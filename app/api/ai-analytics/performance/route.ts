import { type NextRequest, NextResponse } from "next/server"
import { generateObject } from "ai"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { getAIModel } from "@/lib/ai-config"
import { retryGenerateObject } from "@/lib/ai-retry"

const assetPerformanceSchema = z.object({
  overallScore: z.number().min(0).max(100),
  trends: z.array(
    z.object({
      metric: z.string(),
      direction: z.enum(["improving", "declining", "stable"]),
      change: z.number(),
      analysis: z.string(),
    }),
  ),
  benchmarks: z.object({
    industryAverage: z.number().optional(),
    topPerformer: z.number().optional(),
    yourPosition: z.string(),
  }),
  recommendations: z.array(z.string()),
})

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { timeframe, asset_type } = await request.json()

    const { data: analytics } = await supabase.from("asset_analytics").select("*").maybeSingle()

    const { data: executions } = await supabase
      .from("asset_workflow_executions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50)

    const performanceContext = {
      analytics: analytics || {},
      recentExecutions: executions?.length || 0,
      timeframe: timeframe || "last_30_days",
      asset_type: asset_type || "default_asset_type",
    }

    const { object } = await retryGenerateObject(
      async () =>
        await generateObject({
          model: await getAIModel("gpt-4o-mini"),
          schema: assetPerformanceSchema,
          prompt: `Analyze asset performance trends:

${JSON.stringify(performanceContext, null, 2)}

Provide overall score, trends, benchmarks, and recommendations.`,
          maxTokens: 2500,
        }),
      {
        maxRetries: 3,
        initialDelayMs: 1000,
      },
    )

    return NextResponse.json({ data: object, success: true })
  } catch (error: any) {
    console.error("[v0] AI performance error:", error)
    return NextResponse.json({ error: error.message, success: false }, { status: 500 })
  }
}
