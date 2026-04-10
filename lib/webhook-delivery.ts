/**
 * Webhook Delivery Service
 * Handles delivering webhook payloads to registered URLs with signature verification
 */

import { createClient } from "@/lib/supabase/server"
import crypto from "crypto"

export interface WebhookPayload {
  event: string
  data: any
  timestamp: string
}

export class WebhookDeliveryService {
  /**
   * Deliver a webhook payload to a URL
   */
  static async deliver(
    webhookId: string,
    webhookUrl: string,
    secret: string,
    payload: WebhookPayload,
  ): Promise<boolean> {
    try {
      // Generate signature
      const signature = this.generateSignature(payload, secret)

      // Deliver webhook
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Webhook-Signature": signature,
          "X-Webhook-Id": webhookId,
          "User-Agent": "ResendIt-Webhook/1.0",
        },
        body: JSON.stringify(payload),
      })

      // Log the delivery
      await this.logDelivery(webhookId, payload, response.status, response.ok, signature)

      return response.ok
    } catch (error: any) {
      console.error("[v0] Webhook delivery error:", error)
      await this.logDelivery(webhookId, payload, 0, false, "", error.message)
      return false
    }
  }

  /**
   * Generate HMAC SHA-256 signature for webhook payload
   */
  static generateSignature(payload: WebhookPayload, secret: string): string {
    const hmac = crypto.createHmac("sha256", secret)
    hmac.update(JSON.stringify(payload))
    return hmac.digest("hex")
  }

  /**
   * Verify webhook signature
   */
  static verifySignature(payload: string, signature: string, secret: string): boolean {
    try {
      const hmac = crypto.createHmac("sha256", secret)
      hmac.update(payload)
      const expectedSignature = hmac.digest("hex")

      return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))
    } catch (error) {
      console.error("[v0] Signature verification error:", error)
      return false
    }
  }

  /**
   * Log webhook delivery attempt
   */
  private static async logDelivery(
    webhookId: string,
    payload: WebhookPayload,
    statusCode: number,
    success: boolean,
    signature: string,
    errorMessage?: string,
  ) {
    const supabase = await createClient()

    await supabase.from("webhook_logs").insert({
      webhook_id: webhookId,
      event_type: payload.event,
      payload: payload,
      status_code: statusCode,
      success: success,
      signature: signature,
      error_message: errorMessage,
      delivered_at: new Date().toISOString(),
    })
  }

  /**
   * Notify registered webhooks about an event
   */
  static async notifyWebhooks(event: string, data: any) {
    const supabase = await createClient()

    // Get all active webhooks subscribed to this event
    const { data: webhooks } = await supabase
      .from("webhooks")
      .select("*")
      .eq("is_active", true)
      .contains("events", [event])

    if (!webhooks || webhooks.length === 0) {
      console.log(`[v0] No webhooks registered for event: ${event}`)
      return
    }

    console.log(`[v0] Notifying ${webhooks.length} webhooks for event: ${event}`)

    // Deliver to all registered webhooks
    const deliveryPromises = webhooks.map((webhook) => {
      const payload: WebhookPayload = {
        event,
        data,
        timestamp: new Date().toISOString(),
      }

      return this.deliver(webhook.id, webhook.url, webhook.secret, payload)
    })

    await Promise.all(deliveryPromises)
  }
}
