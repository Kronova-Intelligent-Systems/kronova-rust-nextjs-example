import { type NextRequest, NextResponse } from "next/server"
import { createClient, createServiceRoleClient } from "@/lib/supabase/server"
import { sendTeamInvitation } from "@/lib/email/send-email"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient()
    const supabaseAdmin = createServiceRoleClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify user is member of organization
    const { data: membership } = await supabaseAdmin
      .from("organization_members")
      .select("*")
      .eq("organization_id", params.id)
      .eq("user_id", user.id)
      .single()

    if (!membership) {
      return NextResponse.json({ error: "Not a member of this organization" }, { status: 403 })
    }

    // Get all members with profile information
    const { data: members, error } = await supabaseAdmin
      .from("organization_members")
      .select(
        `
        *,
        profiles (
          id,
          email,
          full_name,
          avatar_url
        )
      `,
      )
      .eq("organization_id", params.id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data: members, success: true })
  } catch (error: any) {
    console.error("[v0] Members GET error:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient()
    const supabaseAdmin = createServiceRoleClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user has admin/owner role
    const { data: membership } = await supabaseAdmin
      .from("organization_members")
      .select("role")
      .eq("organization_id", params.id)
      .eq("user_id", user.id)
      .single()

    if (!membership || (membership.role !== "owner" && membership.role !== "admin")) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    const body = await request.json()
    const { email, role = "member" } = body

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    const { data: inviterProfile } = await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", user.id)
      .single()

    const { data: invitedUser } = await supabase.from("profiles").select("id").eq("email", email).maybeSingle()

    // Get organization details for email
    const { data: organization } = await supabase.from("organizations").select("name").eq("id", params.id).single()

    if (!organization) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 })
    }

    const inviterName = inviterProfile?.full_name || inviterProfile?.email || "A team member"
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://app.resend-it.com"

    if (invitedUser) {
      // User exists, add them directly
      const { data: newMember, error: memberError } = await supabaseAdmin
        .from("organization_members")
        .insert({
          organization_id: params.id,
          user_id: invitedUser.id,
          role,
          invited_by: user.id,
          joined_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (memberError) {
        return NextResponse.json({ error: memberError.message }, { status: 500 })
      }

      await sendTeamInvitation({
        to: email,
        organizationName: organization.name,
        inviterName,
        role,
        inviteLink: `${baseUrl}/dashboard`,
        isNewUser: false,
      })

      return NextResponse.json({ data: newMember, success: true })
    } else {
      const { data: invitation, error: inviteError } = await supabaseAdmin
        .from("organization_members")
        .insert({
          organization_id: params.id,
          user_id: null, // Will be filled when user signs up
          role,
          invited_by: user.id,
        })
        .select()
        .single()

      if (inviteError) {
        return NextResponse.json({ error: inviteError.message }, { status: 500 })
      }

      await sendTeamInvitation({
        to: email,
        organizationName: organization.name,
        inviterName,
        role,
        inviteLink: `${baseUrl}/signup?email=${encodeURIComponent(email)}&org=${params.id}`,
        isNewUser: true,
      })

      return NextResponse.json({ data: invitation, success: true, pending: true })
    }
  } catch (error: any) {
    console.error("[v0] Members POST error:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
