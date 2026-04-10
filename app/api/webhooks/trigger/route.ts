import { type NextRequest, NextResponse } from "next/server"
import { createServiceRoleClient } from "@/lib/supabase/server"
import crypto from "crypto"

const RESEND_IT_API_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://qcbllcvbwfykbaxzcrwe.supabase.co/rest/v1"

export async function POST(request: NextRequest) {
  try {
    const { event_type, payload, user_id } = await request.json()

    if (!event_type || !payload) {
      return NextResponse.json({ error: "Missing required fields: event_type, payload" }, { status: 400 })
    }

    const supabase = createServiceRoleClient()

    // Fetch active webhooks for this user that subscribe to this event
    const { data: webhooks, error: webhooksError } = await supabase
      .from("webhooks")
      .select("*")
      .eq("user_id", user_id)
      .eq("is_active", true)
      .contains("events", [event_type])

    if (webhooksError) {
      console.error("[v0] Error fetching webhooks:", webhooksError)
      return NextResponse.json({ error: "Failed to fetch webhooks" }, { status: 500 })
    }

    if (!webhooks || webhooks.length === 0) {
      return NextResponse.json({ message: "No active webhooks found for this event", delivered: 0 }, { status: 200 })
    }

    // Trigger each webhook
    const deliveryPromises = webhooks.map(async (webhook) => {
      try {
        const timestamp = Date.now()
        const signature = generateWebhookSignature(webhook.secret, payload, timestamp)

        const response = await fetch(webhook.url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Webhook-Signature": signature,
            "X-Webhook-Timestamp": timestamp.toString(),
            "X-Webhook-Event": event_type,
          },
          body: JSON.stringify(payload),
        })

        const responseBody = await response.text()
        const success = response.ok

        // Log webhook delivery
        await supabase.from("webhook_logs").insert({
          webhook_id: webhook.id,
          event_type,
          payload,
          response_status: response.status,
          response_body: responseBody.substring(0, 1000), // Limit response body size
          error_message: success ? null : `HTTP ${response.status}: ${response.statusText}`,
          delivered_at: new Date().toISOString(),
        })

        // Update webhook status
        await supabase
          .from("webhooks")
          .update({
            last_triggered_at: new Date().toISOString(),
            last_status: success ? "success" : "failed",
            failure_count: success ? 0 : webhook.failure_count + 1,
          })
          .eq("id", webhook.id)

        return { webhook_id: webhook.id, success, status: response.status }
      } catch (error: any) {
        console.error(`[v0] Error delivering webhook ${webhook.id}:`, error)

        // Log failed delivery
        await supabase.from("webhook_logs").insert({
          webhook_id: webhook.id,
          event_type,
          payload,
          response_status: null,
          response_body: null,
          error_message: error.message,
          delivered_at: new Date().toISOString(),
        })

        // Update failure count
        await supabase
          .from("webhooks")
          .update({
            last_triggered_at: new Date().toISOString(),
            last_status: "failed",
            failure_count: webhook.failure_count + 1,
          })
          .eq("id", webhook.id)

        return { webhook_id: webhook.id, success: false, error: error.message }
      }
    })

    const results = await Promise.all(deliveryPromises)
    const successCount = results.filter((r) => r.success).length

    return NextResponse.json({
      message: "Webhooks triggered",
      delivered: successCount,
      total: webhooks.length,
      results,
    })
  } catch (error: any) {
    console.error("[v0] Error in webhook trigger:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}

function generateWebhookSignature(secret: string, payload: any, timestamp: number): string {
  const data = `${timestamp}.${JSON.stringify(payload)}`
  return crypto.createHmac("sha256", secret).update(data).digest("hex")
}
