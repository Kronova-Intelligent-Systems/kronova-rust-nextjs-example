import { type NextRequest, NextResponse } from "next/server"
import { generateObject } from "ai"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { getAIModel } from "@/lib/ai-config"
import { retryGenerateObject } from "@/lib/ai-retry"

const assetRiskSchema = z.object({
  overallRiskScore: z.number().min(0).max(100).describe("Overall risk score from 0-100"),
  riskCategories: z
    .array(
      z.object({
        category: z.string().describe("Risk category name (e.g., 'Operational Risk', 'Financial Risk')"),
        score: z.number().min(0).max(100).describe("Risk score for this category from 0-100"),
        level: z.enum(["critical", "high", "medium", "low"]).describe("Risk level: critical, high, medium, or low"),
        factors: z.array(z.string()).describe("List of factors contributing to this risk"),
        mitigation: z.array(z.string()).describe("List of mitigation strategies for this risk"),
      }),
    )
    .describe("Array of risk categories with detailed analysis"),
  criticalRisks: z.array(z.string()).optional().describe("List of critical risks requiring immediate attention"),
  recommendations: z.array(z.string()).optional().describe("List of overall risk management recommendations"),
})

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { asset_ids } = await request.json()

    let query = supabase.from("assets").select("*")

    if (asset_ids && asset_ids.length > 0) {
      query = query.in("id", asset_ids)
    }

    const { data: assets } = await query

    const riskContext = {
      assets: assets?.map((asset) => ({
        name: asset.name,
        type: asset.asset_type,
        riskScore: asset.risk_score,
        value: asset.current_value,
      })),
    }

    const model = await getAIModel("gpt-4o-mini")

    const { object } = await retryGenerateObject(
      async () =>
        await generateObject({
          model: model,
          schema: assetRiskSchema,
          prompt: `You are an expert risk analyst. Perform a comprehensive risk assessment for the following assets.

Asset Data:
${JSON.stringify(riskContext, null, 2)}

Generate a risk assessment with the following structure:

1. overallRiskScore: Calculate an overall risk score from 0-100 (0 = no risk, 100 = critical risk)

2. riskCategories: Analyze at least 3-5 risk categories. For each category provide:
   - category: Name of the risk category (e.g., "Operational Risk", "Financial Risk", "Market Risk", "Technology Risk", "Compliance Risk")
   - score: Risk score for this category (0-100)
   - level: Risk level - must be exactly one of: "critical", "high", "medium", or "low"
   - factors: Array of 2-4 specific factors contributing to this risk
   - mitigation: Array of 2-4 specific mitigation strategies

3. criticalRisks (optional): List of critical risks requiring immediate attention

4. recommendations (optional): List of overall risk management recommendations

Example structure:
{
  "overallRiskScore": 65,
  "riskCategories": [
    {
      "category": "Operational Risk",
      "score": 70,
      "level": "high",
      "factors": ["High asset value concentration", "Limited redundancy"],
      "mitigation": ["Implement backup systems", "Diversify asset portfolio"]
    }
  ],
  "criticalRisks": ["High value concentration in single asset"],
  "recommendations": ["Implement risk monitoring dashboard", "Review insurance coverage"]
}

Provide detailed, actionable analysis based on the asset data provided.`,
          maxTokens: 2500,
        }),
      {
        maxRetries: 3,
        initialDelayMs: 1000,
      },
    )

    return NextResponse.json({ data: object, success: true })
  } catch (error: any) {
    console.error("[v0] AI risk error:", error)
    return NextResponse.json({ error: error.message, success: false }, { status: 500 })
  }
}
