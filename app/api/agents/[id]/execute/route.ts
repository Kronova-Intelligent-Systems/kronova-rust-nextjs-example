import { type NextRequest, NextResponse } from "next/server"
import { createServiceRoleClient } from "@/lib/supabase/server"
import { WebhookDeliveryService } from "@/lib/webhook-delivery"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const agentId = params.id
    const { prompt, assetIds, dataStreamIds, webhookUrl, api_key } = await request.json()

    const supabase = createServiceRoleClient()

    const isInternalRequest = request.headers.get("X-Internal-Request") === "true"
    const internalUserId = request.headers.get("X-User-ID")

    let userId: string | undefined

    if (isInternalRequest && internalUserId) {
      // Internal authenticated request from execute-proxy
      console.log("[v0] Internal request from execute-proxy for user:", internalUserId)
      userId = internalUserId
    } else {
      // External API request - require API key
      const authHeader = request.headers.get("Authorization")
      const providedApiKey = api_key || (authHeader ? authHeader.replace("Bearer ", "") : null)

      console.log("[v0] Execute route - API key validation:")
      console.log("[v0] - Has Authorization header:", !!authHeader)
      console.log("[v0] - Has api_key in body:", !!api_key)
      console.log("[v0] - Provided API key (first 8 chars):", providedApiKey?.substring(0, 8) || "NOT_PROVIDED")

      if (!providedApiKey) {
        console.error("[v0] No API key provided")
        return NextResponse.json({ error: "API key required" }, { status: 401 })
      }

      const expectedApiKey = process.env.RESENDIT_API_KEY
      console.log("[v0] Expected API key (first 8 chars):", expectedApiKey?.substring(0, 8) || "NOT_SET")

      if (!expectedApiKey || providedApiKey !== expectedApiKey) {
        console.error("[v0] API key validation failed")
        return NextResponse.json({ error: "Invalid API key" }, { status: 401 })
      }

      console.log("[v0] API key validation successful")

      // Get user ID from the agent record (since we're using a shared API key)
      const { data: agent, error: agentError } = await supabase.from("ai_agents").select("*").eq("id", agentId).single()

      if (agentError || !agent) {
        return NextResponse.json({ error: "Agent not found" }, { status: 404 })
      }

      userId = agent.user_id
    }

    if (!userId) {
      return NextResponse.json({ error: "User identification failed" }, { status: 401 })
    }

    const inputData = {
      prompt,
      assetIds: assetIds || [],
      dataStreamIds: dataStreamIds || [],
      webhookUrl,
    }

    const { data: run, error: runError } = await supabase
      .from("ai_agent_runs")
      .insert({
        agent_id: agentId,
        user_id: userId,
        input_data: inputData,
        status: "running",
        started_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (runError) {
      console.error("[v0] Error creating agent run:", runError)
      return NextResponse.json({ error: "Failed to start agent execution" }, { status: 500 })
    }

    console.log("[v0] Agent run created with ID:", run.id)

    await WebhookDeliveryService.notifyWebhooks("agent.execution.started", {
      agentId,
      executionId: run.id,
      prompt,
      timestamp: run.created_at,
    })

    setImmediate(async () => {
      try {
        // Get agent details for the execution
        const { data: agent } = await supabase.from("ai_agents").select("*").eq("id", agentId).single()

        if (!agent) {
          throw new Error("Agent not found")
        }

        // Simulate AI execution (in production, this would call the actual AI model)
        const result = `Agent "${agent.name}" analyzed: ${prompt}\n\nProcessed ${assetIds?.length || 0} assets and ${dataStreamIds?.length || 0} data streams.\n\nAnalysis complete with high confidence.`

        const outputData = {
          response: result,
          prompt,
          assetIds,
          dataStreamIds,
          confidence_score: 0.92,
          sources: ["Asset Database", "Data Streams"],
          usage: {
            prompt_tokens: 150,
            completion_tokens: 85,
            total_tokens: 235,
          },
        }

        const completedAt = new Date().toISOString()
        const startedAt = new Date(run.started_at || run.created_at)
        const executionTimeMs = new Date(completedAt).getTime() - startedAt.getTime()

        console.log("[v0] Completing agent run:", run.id)
        console.log("[v0] Output data:", outputData)

        const { error: updateError } = await supabase
          .from("ai_agent_runs")
          .update({
            status: "completed",
            output_data: outputData,
            completed_at: completedAt,
            execution_time_ms: executionTimeMs,
            updated_at: completedAt,
          })
          .eq("id", run.id)

        if (updateError) {
          console.error("[v0] Error updating agent run:", updateError)
        } else {
          console.log("[v0] Agent run completed successfully")
        }

        await WebhookDeliveryService.notifyWebhooks("agent.execution.completed", {
          agentId,
          executionId: run.id,
          result,
          timestamp: completedAt,
        })

        if (webhookUrl) {
          await fetch(webhookUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              event: "agent.execution.completed",
              data: {
                agentId,
                executionId: run.id,
                result,
                timestamp: completedAt,
              },
            }),
          }).catch((err) => {
            console.error("[v0] Error calling webhook:", err)
          })
        }
      } catch (error) {
        console.error("[v0] Error in agent execution completion:", error)
        await supabase
          .from("ai_agent_runs")
          .update({
            status: "failed",
            error_message: error instanceof Error ? error.message : "Unknown error during execution",
            completed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", run.id)
      }
    })

    return NextResponse.json({
      success: true,
      executionId: run.id,
      result: "Agent execution started",
      timestamp: run.created_at,
    })
  } catch (error: any) {
    console.error("[v0] Error in agent execution:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
