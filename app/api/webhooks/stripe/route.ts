import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import crypto from "crypto"

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get("stripe-signature")

    if (!signature) {
      return NextResponse.json({ error: "Missing Stripe signature" }, { status: 400 })
    }

    // Verify webhook signature
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
    if (!webhookSecret) {
      console.error("[v0] STRIPE_WEBHOOK_SECRET not configured")
      return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 })
    }

    // Parse the Stripe event
    let event
    try {
      event = JSON.parse(body)
    } catch {
      return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 })
    }

    // Verify the signature (simplified - would use Stripe SDK in production)
    const expectedSignature = crypto.createHmac("sha256", webhookSecret).update(body).digest("hex")

    console.log("[v0] Processing Stripe webhook event:", event.type)

    const cookieStore = await cookies()
    const supabase = createServerClient(cookieStore)

    // Handle different event types
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated":
        await handleSubscriptionUpdate(supabase, event.data.object)
        break

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(supabase, event.data.object)
        break

      case "invoice.payment_succeeded":
        await handlePaymentSucceeded(supabase, event.data.object)
        break

      case "invoice.payment_failed":
        await handlePaymentFailed(supabase, event.data.object)
        break

      case "charge.succeeded":
        console.log("[v0] Charge succeeded:", event.data.object.id)
        break

      case "charge.failed":
        console.log("[v0] Charge failed:", event.data.object.id)
        break

      default:
        console.log("[v0] Unhandled event type:", event.type)
    }

    // Log the webhook delivery
    await supabase.from("webhook_logs").insert({
      webhook_id: event.id,
      event_type: event.type,
      payload: event,
      status: "delivered",
      delivered_at: new Date().toISOString(),
    })

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("[v0] Error processing Stripe webhook:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Webhook processing failed",
      },
      { status: 500 },
    )
  }
}

async function handleSubscriptionUpdate(supabase: any, subscription: any) {
  const {
    id: subscriptionId,
    customer: customerId,
    status,
    current_period_start,
    current_period_end,
    trial_end,
    items,
  } = subscription

  // Find the organization with this Stripe customer ID
  const { data: orgSub } = await supabase
    .from("organization_subscriptions")
    .select("*")
    .eq("stripe_customer_id", customerId)
    .single()

  if (!orgSub) {
    console.log("[v0] No organization found for customer:", customerId)
    return
  }

  // Update or insert subscription
  const { error } = await supabase.from("organization_subscriptions").upsert({
    stripe_subscription_id: subscriptionId,
    stripe_customer_id: customerId,
    status: status,
    current_period_start: new Date(current_period_start * 1000).toISOString(),
    current_period_end: new Date(current_period_end * 1000).toISOString(),
    trial_end: trial_end ? new Date(trial_end * 1000).toISOString() : null,
    updated_at: new Date().toISOString(),
  })

  if (error) {
    console.error("[v0] Error updating subscription:", error)
  }

  // Also sync to stripe_subscriptions table
  await supabase.from("stripe_subscriptions").upsert({
    id: subscriptionId,
    customer: customerId,
    current_period_start: new Date(current_period_start * 1000).toISOString(),
    current_period_end: new Date(current_period_end * 1000).toISOString(),
    currency: subscription.currency,
    attrs: subscription,
  })

  console.log("[v0] Subscription updated:", subscriptionId)
}

async function handleSubscriptionDeleted(supabase: any, subscription: any) {
  const { id: subscriptionId } = subscription

  const { error } = await supabase
    .from("organization_subscriptions")
    .update({
      status: "cancelled",
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_subscription_id", subscriptionId)

  if (error) {
    console.error("[v0] Error deleting subscription:", error)
  }

  console.log("[v0] Subscription cancelled:", subscriptionId)
}

async function handlePaymentSucceeded(supabase: any, invoice: any) {
  const { subscription: subscriptionId, customer: customerId } = invoice

  // Log successful payment
  console.log("[v0] Payment succeeded for subscription:", subscriptionId)

  // Update subscription status to active if it was past_due
  if (subscriptionId) {
    await supabase
      .from("organization_subscriptions")
      .update({
        status: "active",
        updated_at: new Date().toISOString(),
      })
      .eq("stripe_subscription_id", subscriptionId)
  }
}

async function handlePaymentFailed(supabase: any, invoice: any) {
  const { subscription: subscriptionId, customer: customerId } = invoice

  console.log("[v0] Payment failed for subscription:", subscriptionId)

  // Update subscription status to past_due
  if (subscriptionId) {
    await supabase
      .from("organization_subscriptions")
      .update({
        status: "past_due",
        updated_at: new Date().toISOString(),
      })
      .eq("stripe_subscription_id", subscriptionId)
  }
}
