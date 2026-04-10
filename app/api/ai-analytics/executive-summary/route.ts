import { NextResponse } from "next/server"
import { generateText } from "ai"
import { createClient } from "@/lib/supabase/server"
import { getAIModel } from "@/lib/ai-config"
import { retryGenerateText } from "@/lib/ai-retry"

export async function POST() {
  try {
    console.log("[v0] Executive summary: Starting request")

    const supabase = await createClient()
    console.log("[v0] Executive summary: Supabase client created")

    const [analyticsResult, assetsResult, executionsResult] = await Promise.all([
      supabase.from("asset_analytics").select("*").maybeSingle(),
      supabase.from("assets").select("*"),
      supabase.from("asset_workflow_executions").select("*").order("created_at", { ascending: false }).limit(20),
    ])
    console.log("[v0] Executive summary: Data fetched from Supabase")

    const summaryContext = {
      totalAssets: assetsResult.data?.length || 0,
      totalValue: assetsResult.data?.reduce((sum, asset) => sum + (asset.current_value || 0), 0) || 0,
      recentExecutions: executionsResult.data?.length || 0,
      successRate: executionsResult.data
        ? (executionsResult.data.filter((e) => e.status === "completed").length / executionsResult.data.length) * 100
        : 0,
    }
    console.log("[v0] Executive summary: Context prepared:", summaryContext)

    console.log("[v0] Executive summary: Getting AI model")
    const model = await getAIModel("gpt-4o-mini")
    console.log("[v0] Executive summary: AI model obtained:", typeof model)

    console.log("[v0] Executive summary: Calling generateText")
    const { text } = await retryGenerateText(
      async () =>
        await generateText({
          model,
          prompt: `Generate an executive summary of asset intelligence platform performance:

Platform Metrics:
${JSON.stringify(summaryContext, null, 2)}

Provide a concise executive summary covering key performance indicators, notable achievements, areas of concern, and strategic recommendations. Keep it executive-friendly (2-3 paragraphs).`,
          maxTokens: 1000,
        }),
      {
        maxRetries: 3,
        initialDelayMs: 1000,
      },
    )
    console.log("[v0] Executive summary: Text generated successfully")

    return NextResponse.json({ data: { summary: text }, success: true })
  } catch (error: any) {
    console.error("[v0] AI executive summary error - Full details:")
    console.error("[v0] Error message:", error.message)
    console.error("[v0] Error name:", error.name)
    console.error("[v0] Error stack:", error.stack)
    console.error("[v0] Error object:", JSON.stringify(error, Object.getOwnPropertyNames(error)))

    return NextResponse.json(
      {
        error: error.message || "Unknown error occurred",
        errorName: error.name,
        success: false,
      },
      { status: 500 },
    )
  }
}
