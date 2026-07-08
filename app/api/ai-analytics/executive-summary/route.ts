import { NextResponse } from "next/server"
import { generateText } from "ai"
import { createClient } from "@/lib/supabase/server"
import { getAIModel } from "@/lib/ai-config"
import { retryGenerateText } from "@/lib/ai-retry"

export async function POST() {
  try {
    const supabase = await createClient()

    const [analyticsResult, assetsResult, executionsResult] = await Promise.all([
      supabase.from("asset_analytics").select("*").maybeSingle(),
      supabase.from("assets").select("*"),
      supabase.from("asset_workflow_executions").select("*").order("created_at", { ascending: false }).limit(20),
    ])

    const summaryContext = {
      totalAssets: assetsResult.data?.length || 0,
      totalValue: assetsResult.data?.reduce((sum, asset) => sum + (asset.current_value || 0), 0) || 0,
      recentExecutions: executionsResult.data?.length || 0,
      successRate: executionsResult.data
        ? (executionsResult.data.filter((e) => e.status === "completed").length / executionsResult.data.length) * 100
        : 0,
    }

    const model = await getAIModel("gpt-4o-mini")

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

    return NextResponse.json({ data: { summary: text }, success: true })
  } catch (error: any) {
    console.error("AI executive summary error:", error.message)

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
