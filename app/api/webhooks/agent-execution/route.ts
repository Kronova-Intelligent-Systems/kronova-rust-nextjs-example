import { createServerClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import crypto from "crypto"

/**
 * Webhook endpoint for receiving agent execution results
 * URL: /api/webhooks/agent-execution
 */
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(cookieStore)

    // Parse the webhook payload
    const payload = await request.json()

    console.log("[v0] Received agent execution webhook:", {
      event: payload.event,
      executionId: payload.data?.executionId,
      agentId: payload.data?.agentId,
    })

    // Verify webhook signature if secret is configured
    const signature = request.headers.get("X-Webhook-Signature")
    const webhookSecret = process.env.RESENDIT_WEBHOOK_SECRET

    if (webhookSecret && signature) {
      const hmac = crypto.createHmac("sha256", webhookSecret)
      hmac.update(JSON.stringify(payload))
      const expectedSignature = hmac.digest("hex")

      if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
        console.error("[v0] Invalid webhook signature")
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
      }

      console.log("[v0] Webhook signature verified successfully")
    } else if (webhookSecret) {
      console.warn("[v0] Webhook secret configured but no signature provided in request")
    } else {
      console.warn("[v0] RESENDIT_WEBHOOK_SECRET not configured - skipping signature verification")
    }

    // Process the webhook based on event type
    switch (payload.event) {
      case "agent.execution.completed":
        await handleAgentExecutionCompleted(supabase, payload.data)
        break

      case "agent.execution.failed":
        await handleAgentExecutionFailed(supabase, payload.data)
        break

      default:
        console.log("[v0] Unhandled webhook event:", payload.event)
    }

    // Log the webhook delivery
    await supabase.from("webhook_logs").insert({
      event_type: payload.event,
      payload: payload,
      status: "delivered",
      response_code: 200,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error processing agent execution webhook:", error)

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    )
  }
}

async function handleAgentExecutionCompleted(supabase: any, data: any) {
  const { executionId, agentId, result, timestamp } = data

  console.log("[v0] Processing completed agent execution:", executionId)

  // Update the execution record in the database
  const { error } = await supabase
    .from("ai_agent_runs")
    .update({
      status: "completed",
      output_data: result,
      end_time: timestamp,
      updated_at: new Date().toISOString(),
    })
    .eq("id", executionId)

  if (error) {
    console.error("[v0] Error updating agent execution:", error)
    throw error
  }

  console.log("[v0] Agent execution marked as completed")
}

async function handleAgentExecutionFailed(supabase: any, data: any) {
  const { executionId, agentId, error, timestamp } = data

  console.log("[v0] Processing failed agent execution:", executionId)

  // Update the execution record in the database
  const { error: updateError } = await supabase
    .from("ai_agent_runs")
    .update({
      status: "failed",
      error: error,
      end_time: timestamp,
      updated_at: new Date().toISOString(),
    })
    .eq("id", executionId)

  if (updateError) {
    console.error("[v0] Error updating agent execution:", updateError)
    throw updateError
  }

  console.log("[v0] Agent execution marked as failed")
}
