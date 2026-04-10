import { type NextRequest, NextResponse } from "next/server"
import { generateObject } from "ai"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { getAIModel } from "@/lib/ai-config"
import { retryGenerateObject } from "@/lib/ai-retry"

const assetInsightSchema = z.object({
  insights: z.array(
    z.object({
      category: z.enum(["health", "risk", "opportunity", "maintenance", "value", "performance"]),
      severity: z.enum(["critical", "high", "medium", "low", "info"]),
      title: z.string(),
      description: z.string(),
      recommendation: z.string(),
      impact: z.string(),
      confidence: z.number().min(0).max(100),
    }),
  ),
  summary: z.string(),
  actionItems: z.array(z.string()),
})

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] AI insights: Starting request")
    const supabase = await createClient()
    const { asset_ids, limit } = await request.json()

    let query = supabase
      .from("assets")
      .select("*, asset_intelligence_insights(*), asset_lifecycle_events(*)")
      .order("created_at", { ascending: false })

    if (asset_ids && asset_ids.length > 0) {
      query = query.in("id", asset_ids)
    }

    if (limit) {
      query = query.limit(limit)
    }

    const { data: assets, error } = await query

    if (error) throw error

    console.log("[v0] AI insights: Found", assets?.length || 0, "assets")

    if (!assets || assets.length === 0) {
      return NextResponse.json({
        data: {
          insights: [],
          summary: "No assets available for analysis.",
          actionItems: ["Import or add assets to begin receiving AI insights"],
        },
        success: true,
      })
    }

    const assetContext = assets.map((asset) => ({
      id: asset.id,
      name: asset.name,
      type: asset.asset_type,
      status: asset.status,
      value: asset.current_value,
      riskScore: asset.risk_score,
      condition: asset.condition,
      lastMaintenance: asset.last_maintenance_date,
    }))

    console.log("[v0] AI insights: Generating insights for assets")

    try {
      const { object } = await retryGenerateObject(
        async () =>
          await generateObject({
            model: await getAIModel("gpt-4o"),
            schema: assetInsightSchema,
            prompt: `You are an expert asset management analyst. Analyze the following asset data and provide actionable insights.

Asset Data (${assets.length} assets):
${JSON.stringify(assetContext, null, 2)}

IMPORTANT: You MUST provide exactly 3-5 insights covering different categories (health, risk, opportunity, maintenance, value, performance).
Each insight should have:
- category: one of the allowed categories
- severity: critical, high, medium, low, or info
- title: a clear, concise title (5-10 words)
- description: detailed description (2-3 sentences)
- recommendation: specific actionable recommendation (1-2 sentences)
- impact: business impact if not addressed (1 sentence)
- confidence: your confidence level (0-100)

Also provide:
- summary: executive summary of overall asset health (2-3 sentences)
- actionItems: 3-5 prioritized action items (each 1 sentence)`,
            maxTokens: 3000,
          }),
        {
          maxRetries: 3,
          initialDelayMs: 1000,
        },
      )

      console.log("[v0] AI insights: Successfully generated", object.insights?.length || 0, "insights")
      return NextResponse.json({ data: object, success: true })
    } catch (aiError: any) {
      console.error("[v0] AI insights generation error:", aiError.message)

      return NextResponse.json({
        data: {
          insights: [
            {
              category: "health" as const,
              severity: "info" as const,
              title: "Asset Portfolio Overview",
              description: `You have ${assets.length} asset(s) in your portfolio with a total value of $${assets.reduce((sum, a) => sum + (a.current_value || 0), 0).toLocaleString()}.`,
              recommendation: "Continue monitoring asset performance and maintain regular updates to asset data.",
              impact: "Comprehensive asset visibility enables better decision-making and resource allocation.",
              confidence: 95,
            },
            {
              category: "opportunity" as const,
              severity: "medium" as const,
              title: "Enable AI Analytics",
              description: "AI-powered insights are temporarily unavailable. Basic asset tracking is operational.",
              recommendation: "Check AI service configuration and ensure proper API connectivity.",
              impact: "Limited predictive capabilities may affect maintenance planning and optimization opportunities.",
              confidence: 100,
            },
          ],
          summary: `Portfolio contains ${assets.length} asset(s). AI analytics temporarily unavailable - basic monitoring active.`,
          actionItems: [
            "Review asset data quality and completeness",
            "Verify AI service configuration",
            "Update asset maintenance schedules",
          ],
        },
        success: true,
      })
    }
  } catch (error: any) {
    console.error("[v0] AI insights error:", error.message)
    return NextResponse.json({ error: error.message, success: false }, { status: 500 })
  }
}
