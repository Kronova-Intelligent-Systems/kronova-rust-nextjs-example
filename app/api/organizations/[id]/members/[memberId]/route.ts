import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function PATCH(request: NextRequest, { params }: { params: { id: string; memberId: string } }) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user has admin/owner role
    const { data: membership } = await supabase
      .from("organization_members")
      .select("role")
      .eq("organization_id", params.id)
      .eq("user_id", user.id)
      .single()

    if (!membership || (membership.role !== "owner" && membership.role !== "admin")) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    const body = await request.json()
    const { role } = body

    if (!role) {
      return NextResponse.json({ error: "Role is required" }, { status: 400 })
    }

    const { data: updatedMember, error } = await supabase
      .from("organization_members")
      .update({ role })
      .eq("id", params.memberId)
      .eq("organization_id", params.id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data: updatedMember, success: true })
  } catch (error: any) {
    console.error("[v0] Member PATCH error:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string; memberId: string } }) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user has admin/owner role
    const { data: membership } = await supabase
      .from("organization_members")
      .select("role")
      .eq("organization_id", params.id)
      .eq("user_id", user.id)
      .single()

    if (!membership || (membership.role !== "owner" && membership.role !== "admin")) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    const { error } = await supabase
      .from("organization_members")
      .delete()
      .eq("id", params.memberId)
      .eq("organization_id", params.id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[v0] Member DELETE error:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
