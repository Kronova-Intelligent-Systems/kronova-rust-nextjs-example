/**
 * Kronova API Client
 * Handles programmatic execution of agents and workflows via REST API
 * Base URL: https://api.kronova.io/v1
 */

import { createClient } from "@/lib/supabase/client"

export type ApiKeyScope =
  | "agents:read"
  | "agents:write"
  | "agents:execute"
  | "workflows:read"
  | "workflows:write"
  | "workflows:execute"
  | "webhooks:read"
  | "webhooks:write"
  | "assets:read"
  | "assets:write"

export interface AgentExecutionRequest {
  prompt: string
  assetIds?: string[]
  dataStreamIds?: string[]
  webhookUrl?: string
  context?: any
}

export interface WorkflowExecutionRequest {
  input: Record<string, any>
  webhookUrl?: string
}

export interface AgentExecutionResponse {
  success: boolean
  executionId: string
  result?: string
  timestamp: string
}

export interface WorkflowExecutionResponse {
  success: boolean
  executionId: string
  result?: Record<string, any>
  timestamp: string
}

export class KronovaAPIClient {
  private baseUrl: string
  private supabase = createClient()

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || process.env.NEXT_PUBLIC_SUPABASE_URL + "/rest/v1" || "https://api.kronova.io/v1"
  }

  /**
   * Execute an AI agent via API
   */
  async executeAgent(agentId: string, request: AgentExecutionRequest): Promise<any> {
    const response = await fetch(`/api/agents/execute-proxy`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        agentId,
        ...request,
      }),
    })

    if (!response.ok) {
      const contentType = response.headers.get("content-type")
      let errorMessage = `Failed to execute agent (${response.status})`

      if (contentType && contentType.includes("application/json")) {
        try {
          const error = await response.json()
          errorMessage = error.message || error.error || errorMessage
        } catch (e) {
          // JSON parse failed
        }
      } else {
        try {
          const errorText = await response.text()
          errorMessage = errorText || errorMessage
        } catch (e) {
          // Text read failed
        }
      }

      throw new Error(errorMessage)
    }

    return await response.json()
  }

  /**
   * Execute a workflow via API
   */
  async executeWorkflow(workflowId: string, request: WorkflowExecutionRequest): Promise<WorkflowExecutionResponse> {
    const response = await fetch(`/api/workflows/execute-proxy`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        workflowId,
        ...request,
      }),
    })

    if (!response.ok) {
      const contentType = response.headers.get("content-type")
      let errorMessage = `Failed to execute workflow (${response.status})`

      if (contentType && contentType.includes("application/json")) {
        try {
          const error = await response.json()
          errorMessage = error.message || error.error || errorMessage
        } catch (e) {
          // JSON parse failed
        }
      } else {
        try {
          const errorText = await response.text()
          errorMessage = errorText || errorMessage
        } catch (e) {
          // Text read failed
        }
      }

      throw new Error(errorMessage)
    }

    return await response.json()
  }
}

// Export singleton instance
export const kronovaAPI = new KronovaAPIClient()
