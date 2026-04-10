import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("Authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Missing or invalid API key" }, { status: 401 })
    }

    const apiKey = authHeader.replace("Bearer ", "")
    const supabase = await createClient()

    // Verify API key
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Invalid API key" }, { status: 401 })
    }

    const body = await request.json()
    const { name, description, system_prompt, model_id, parameters } = body

    if (!name) {
      return NextResponse.json({ error: "Agent name is required" }, { status: 400 })
    }

    // Create agent
    const { data: agent, error } = await supabase
      .from("ai_agents")
      .insert({
        name,
        description,
        system_prompt,
        model_id: model_id || "openai/gpt-4",
        parameters,
        user_id: user.id,
        is_active: true,
      })
      .select()
      .single()

    if (error) {
      console.error("[v0] Error creating agent:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: agent }, { status: 201 })
  } catch (error: any) {
    console.error("[v0] Agent creation error:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
