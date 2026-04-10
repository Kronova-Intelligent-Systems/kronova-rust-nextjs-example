import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { webhook_type, webhook_code, item_id, error } = body

    console.log("[v0] Plaid webhook received:", webhook_type, webhook_code)

    const supabase = createClient()

    // Handle different webhook types
    switch (webhook_type) {
      case "ITEM":
        if (webhook_code === "ERROR") {
          // Update connection status to error
          await supabase
            .from("plaid_connections")
            .update({
              status: "error",
              error_message: error?.error_message || "Unknown error",
              updated_at: new Date().toISOString(),
            })
            .eq("item_id", item_id)
        }
        break

      case "TRANSACTIONS":
        // Handle transaction updates
        console.log("[v0] Transaction webhook:", webhook_code)
        break

      default:
        console.log("[v0] Unhandled webhook type:", webhook_type)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("[v0] Error processing Plaid webhook:", error)
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 })
  }
}
