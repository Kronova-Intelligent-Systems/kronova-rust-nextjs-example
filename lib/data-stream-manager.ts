import { createClient } from "@/lib/supabase/client"
import type { RealtimeChannel } from "@supabase/supabase-js"

export interface DataStreamConfig {
  source_type: "agent_stream" | "workflow_output" | "table_changes"
  source_id: string
  callback: (data: any) => void
  filters?: Record<string, any>
}

export class DataStreamManager {
  private supabase = createClient()
  private activeStreams: Map<string, RealtimeChannel> = new Map()

  /**
   * Subscribe to real-time data stream from AI agents
   */
  subscribeToAgentStream(agentId: string, callback: (execution: any) => void) {
    const channelName = `agent-stream-${agentId}`

    // Check if already subscribed
    if (this.activeStreams.has(channelName)) {
      console.log("[v0] Already subscribed to agent stream:", agentId)
      return
    }

    console.log("[v0] Subscribing to agent stream:", agentId)

    const channel = this.supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "ai_agent_executions",
          filter: `agent_id=eq.${agentId}`,
        },
        (payload) => {
          console.log("[v0] Agent execution update:", payload)
          callback(payload.new)
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "ai_agent_executions",
          filter: `agent_id=eq.${agentId}`,
        },
        (payload) => {
          console.log("[v0] Agent execution status update:", payload)
          callback(payload.new)
        },
      )
      .subscribe()

    this.activeStreams.set(channelName, channel)
  }

  /**
   * Subscribe to real-time workflow execution updates
   */
  subscribeToWorkflowStream(workflowId: string, callback: (run: any) => void) {
    const channelName = `workflow-stream-${workflowId}`

    if (this.activeStreams.has(channelName)) {
      console.log("[v0] Already subscribed to workflow stream:", workflowId)
      return
    }

    console.log("[v0] Subscribing to workflow stream:", workflowId)

    const channel = this.supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "ai_workflow_runs",
          filter: `workflow_id=eq.${workflowId}`,
        },
        (payload) => {
          console.log("[v0] Workflow run update:", payload)
          callback(payload.new)
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "ai_workflow_runs",
          filter: `workflow_id=eq.${workflowId}`,
        },
        (payload) => {
          console.log("[v0] Workflow run status update:", payload)
          callback(payload.new)
        },
      )
      .subscribe()

    this.activeStreams.set(channelName, channel)
  }

  /**
   * Subscribe to table changes for data source monitoring
   */
  subscribeToTableChanges(tableName: string, callback: (change: any) => void, filters?: Record<string, any>) {
    const channelName = `table-changes-${tableName}`

    if (this.activeStreams.has(channelName)) {
      console.log("[v0] Already subscribed to table changes:", tableName)
      return
    }

    console.log("[v0] Subscribing to table changes:", tableName)

    const channelConfig: any = {
      event: "*",
      schema: "public",
      table: tableName,
    }

    // Apply filters if provided
    if (filters) {
      const filterString = Object.entries(filters)
        .map(([key, value]) => `${key}=eq.${value}`)
        .join(",")
      channelConfig.filter = filterString
    }

    const channel = this.supabase
      .channel(channelName)
      .on("postgres_changes", channelConfig, (payload) => {
        console.log("[v0] Table change detected:", payload)
        callback(payload)
      })
      .subscribe()

    this.activeStreams.set(channelName, channel)
  }

  /**
   * Unsubscribe from a specific stream
   */
  unsubscribe(streamId: string) {
    const channel = this.activeStreams.get(streamId)
    if (channel) {
      console.log("[v0] Unsubscribing from stream:", streamId)
      this.supabase.removeChannel(channel)
      this.activeStreams.delete(streamId)
    }
  }

  /**
   * Unsubscribe from all active streams
   */
  unsubscribeAll() {
    console.log("[v0] Unsubscribing from all streams")
    this.activeStreams.forEach((channel, streamId) => {
      this.supabase.removeChannel(channel)
    })
    this.activeStreams.clear()
  }

  /**
   * Get list of active stream IDs
   */
  getActiveStreams(): string[] {
    return Array.from(this.activeStreams.keys())
  }
}

// Export singleton instance
export const dataStreamManager = new DataStreamManager()
