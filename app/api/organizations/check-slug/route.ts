import { type NextRequest, NextResponse } from "next/server"
import { createServiceRoleClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const slug = searchParams.get("slug")

    if (!slug) {
      return NextResponse.json({ error: "Slug is required" }, { status: 400 })
    }

    const adminClient = createServiceRoleClient()

    const { data: existingOrg, error } = await adminClient
      .from("organizations")
      .select("id")
      .eq("slug", slug)
      .maybeSingle()

    if (error) {
      console.error("[v0] Error checking slug:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ available: !existingOrg, success: true })
  } catch (error: any) {
    console.error("[v0] Check slug error:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
