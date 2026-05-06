import { type NextRequest, NextResponse } from "next/server"
import { createServiceRoleClient } from "@/lib/supabase/server"
import { sendWelcomeEmail } from "@/lib/email/send-email"

/**
 * POST /api/auth/signup
 *
 * Called after Supabase Auth signup to send a welcome email via Resend.
 * Uses the service role client to look up the newly created profile.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, email, fullName } = body

    if (!userId || !email) {
      return NextResponse.json({ error: "userId and email are required" }, { status: 400 })
    }

    const supabaseAdmin = createServiceRoleClient()

    // Fetch any org membership so we can personalise the email
    const { data: membership } = await supabaseAdmin
      .from("organization_members")
      .select("organizations(name)")
      .eq("user_id", userId)
      .maybeSingle()

    const organizationName =
      (membership?.organizations as any)?.name ?? undefined

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://app.kronova.io"

    const result = await sendWelcomeEmail({
      to: email,
      userName: fullName || email.split("@")[0],
      organizationName,
      dashboardLink: `${appUrl}/dashboard`,
    })

    if (!result.success) {
      console.error("[v0] Welcome email failed:", result.error)
      // Non-fatal — signup succeeded even if email fails
      return NextResponse.json({ success: false, error: result.error }, { status: 500 })
    }

    return NextResponse.json({ success: true, emailId: result.data?.id })
  } catch (error: any) {
    console.error("[v0] Signup welcome email error:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
