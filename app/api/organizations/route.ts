import { type NextRequest, NextResponse } from "next/server"
import { createClient, createServiceRoleClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const adminClient = createServiceRoleClient()

    // First, get organization memberships for the user
    const { data: memberships, error: membershipsError } = await adminClient
      .from("organization_members")
      .select("organization_id, role")
      .eq("user_id", user.id)

    if (membershipsError) {
      console.error("[v0] Error fetching memberships:", membershipsError)
      return NextResponse.json({ error: membershipsError.message }, { status: 500 })
    }

    if (!memberships || memberships.length === 0) {
      return NextResponse.json({ data: [], success: true })
    }

    // Extract organization IDs
    const orgIds = memberships.map((m) => m.organization_id)

    // Then, fetch organizations separately
    const { data: organizations, error: orgsError } = await adminClient
      .from("organizations")
      .select("*")
      .in("id", orgIds)

    if (orgsError) {
      console.error("[v0] Error fetching organizations:", orgsError)
      return NextResponse.json({ error: orgsError.message }, { status: 500 })
    }

    // Combine the data
    const organizationsWithRoles = organizations?.map((org) => {
      const membership = memberships.find((m) => m.organization_id === org.id)
      return {
        ...org,
        userRole: membership?.role,
      }
    })

    return NextResponse.json({ data: organizationsWithRoles, success: true })
  } catch (error: any) {
    console.error("[v0] Organizations GET error:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { name, slug, description, company_size, industry, website_url } = body

    if (!name || !slug) {
      return NextResponse.json({ error: "Name and slug are required" }, { status: 400 })
    }

    const adminClient = createServiceRoleClient()

    const { data: existingOrg, error: checkError } = await adminClient
      .from("organizations")
      .select("id")
      .eq("slug", slug)
      .maybeSingle()

    if (checkError) {
      console.error("[v0] Error checking slug:", checkError)
      return NextResponse.json({ error: checkError.message }, { status: 500 })
    }

    if (existingOrg) {
      return NextResponse.json(
        { error: "This organization URL is already taken. Please choose a different one." },
        { status: 409 },
      )
    }

    // Create organization
    const { data: organization, error: orgError } = await adminClient
      .from("organizations")
      .insert({
        name,
        slug,
        description,
        company_size,
        industry,
        website_url,
        created_by: user.id,
      })
      .select()
      .single()

    if (orgError) {
      console.error("[v0] Error creating organization:", orgError)
      if (orgError.code === "23505") {
        return NextResponse.json(
          { error: "This organization URL is already taken. Please choose a different one." },
          { status: 409 },
        )
      }
      return NextResponse.json({ error: orgError.message }, { status: 500 })
    }

    // Add creator as owner
    const { error: memberError } = await adminClient.from("organization_members").insert({
      organization_id: organization.id,
      user_id: user.id,
      role: "owner",
    })

    if (memberError) {
      console.error("[v0] Error adding organization owner:", memberError)
      // Try to clean up the organization
      await adminClient.from("organizations").delete().eq("id", organization.id)
      return NextResponse.json({ error: memberError.message }, { status: 500 })
    }

    return NextResponse.json({ data: organization, success: true })
  } catch (error: any) {
    console.error("[v0] Organizations POST error:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
