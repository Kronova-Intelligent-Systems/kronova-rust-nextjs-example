import { type NextRequest, NextResponse } from "next/server"
import { createServiceRoleClient } from "@/lib/supabase/server"
import { WebhookDeliveryService } from "@/lib/webhook-delivery"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const workflowId = params.id
    const { input, webhookUrl, api_key } = await request.json()

    const supabase = createServiceRoleClient()

    const authHeader = request.headers.get("Authorization")
    const apiKey = api_key || (authHeader ? authHeader.replace("Bearer ", "") : null)

    if (!apiKey) {
      return NextResponse.json({ error: "API key required" }, { status: 401 })
    }

    // Verify API key
    const keyHash = await hashAPIKey(apiKey)
    const { data: apiKeyData, error: keyError } = await supabase
      .from("api_keys")
      .select("user_id, is_active, expires_at")
      .eq("key_hash", keyHash)
      .single()

    if (keyError || !apiKeyData || !apiKeyData.is_active) {
      return NextResponse.json({ error: "Invalid or inactive API key" }, { status: 401 })
    }

    if (apiKeyData.expires_at && new Date(apiKeyData.expires_at) < new Date()) {
      return NextResponse.json({ error: "API key expired" }, { status: 401 })
    }

    const userId = apiKeyData.user_id

    // Verify workflow exists and belongs to user
    const { data: workflow, error: workflowError } = await supabase
      .from("ai_workflows")
      .select("*")
      .eq("id", workflowId)
      .eq("user_id", userId)
      .single()

    if (workflowError || !workflow) {
      return NextResponse.json({ error: "Workflow not found" }, { status: 404 })
    }

    const inputData = {
      input: input || {},
      webhookUrl,
    }

    const { data: run, error: runError } = await supabase
      .from("ai_workflow_runs")
      .insert({
        workflow_id: workflowId,
        user_id: userId,
        input_data: inputData,
        status: "running",
      })
      .select()
      .single()

    if (runError) {
      console.error("[v0] Error creating workflow run:", runError)
      return NextResponse.json({ error: "Failed to start workflow execution" }, { status: 500 })
    }

    await WebhookDeliveryService.notifyWebhooks("workflow.execution.started", {
      workflowId,
      executionId: run.id,
      input,
      timestamp: run.created_at,
    })

    // TODO: Implement actual workflow execution logic here
    // For now, simulate completion
    setTimeout(async () => {
      const results = {
        status: "success",
        output: `Workflow "${workflow.name}" executed successfully`,
        input,
        steps_completed: workflow.steps?.length || 0,
      }

      await supabase
        .from("ai_workflow_runs")
        .update({
          status: "completed",
          results,
          completed_at: new Date().toISOString(),
          execution_time_ms: 2000,
        })
        .eq("id", run.id)

      await WebhookDeliveryService.notifyWebhooks("workflow.execution.completed", {
        workflowId,
        executionId: run.id,
        result: results,
        timestamp: new Date().toISOString(),
      })

      if (webhookUrl) {
        await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            event: "workflow.execution.completed",
            data: {
              workflowId,
              executionId: run.id,
              result: results,
              timestamp: new Date().toISOString(),
            },
          }),
        })
      }
    }, 2000)

    return NextResponse.json({
      success: true,
      executionId: run.id,
      result: { output: "Workflow execution started" },
      timestamp: run.created_at,
    })
  } catch (error: any) {
    console.error("[v0] Error in workflow execution:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}

async function hashAPIKey(apiKey: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(apiKey)
  const hashBuffer = await crypto.subtle.digest("SHA-256", data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
}
