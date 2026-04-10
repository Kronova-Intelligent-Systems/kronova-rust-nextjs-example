import { NextResponse } from "next/server"
import { generateObject } from "ai"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { getAIModel } from "@/lib/ai-config"
import { retryGenerateObject } from "@/lib/ai-retry"

const assetOptimizationSchema = z.object({
  opportunities: z.array(
    z.object({
      area: z.string().describe("The area or category of optimization (e.g., 'Maintenance', 'Energy', 'Utilization')"),
      potentialSavings: z.number().describe("Estimated annual savings in dollars"),
      implementationCost: z.number().optional().describe("One-time cost to implement this optimization"),
      roi: z.number().optional().describe("Return on investment as a percentage"),
      timeframe: z.string().describe("Expected timeframe to implement (e.g., '3 months', '1 year')"),
      priority: z.enum(["critical", "high", "medium", "low"]).describe("Priority level for this optimization"),
      description: z.string().describe("Detailed description of the optimization opportunity"),
      steps: z.array(z.string()).optional().describe("Implementation steps"),
    }),
  ),
  totalPotentialSavings: z.number().optional().describe("Sum of all potential savings"),
  quickWins: z.array(z.string()).optional().describe("Easy-to-implement optimizations with immediate impact"),
})

export async function POST() {
  try {
    const supabase = await createClient()

    const { data: assets } = await supabase.from("assets").select("*").order("current_value", { ascending: false })

    const optimizationContext = {
      totalAssets: assets?.length || 0,
      totalValue: assets?.reduce((sum, asset) => sum + (asset.current_value || 0), 0) || 0,
      maintenanceAssets: assets?.filter((a) => a.status === "maintenance").length || 0,
      highRiskAssets: assets?.filter((a) => (a.risk_score || 0) > 70).length || 0,
      assetsByCategory: assets?.reduce(
        (acc, asset) => {
          acc[asset.category] = (acc[asset.category] || 0) + 1
          return acc
        },
        {} as Record<string, number>,
      ),
    }

    const model = await getAIModel("gpt-4o-mini")
    const { object } = await retryGenerateObject(
      async () =>
        await generateObject({
          model: model,
          schema: assetOptimizationSchema,
          prompt: `You are an asset optimization expert. Analyze the following asset portfolio and identify optimization opportunities.

Asset Portfolio Context:
${JSON.stringify(optimizationContext, null, 2)}

Generate a comprehensive optimization analysis with the following structure:

1. **opportunities**: An array of 3-5 optimization opportunities. Each opportunity should include:
   - area: The category (e.g., "Maintenance Scheduling", "Asset Utilization", "Energy Efficiency", "Risk Mitigation")
   - potentialSavings: Annual savings in dollars (be realistic based on asset values)
   - implementationCost: One-time implementation cost (optional)
   - roi: Return on investment percentage (optional)
   - timeframe: Implementation timeframe (e.g., "3 months", "6 months", "1 year")
   - priority: One of "critical", "high", "medium", or "low"
   - description: Detailed explanation of the opportunity
   - steps: Array of implementation steps (optional)

2. **totalPotentialSavings**: Sum of all potential annual savings (optional)

3. **quickWins**: Array of 2-3 easy-to-implement optimizations with immediate impact (optional)

Focus on practical, actionable recommendations based on the asset portfolio data provided.`,
          maxTokens: 3000,
        }),
      {
        maxRetries: 3,
        initialDelayMs: 1000,
      },
    )

    return NextResponse.json({ data: object, success: true })
  } catch (error: any) {
    console.error("[v0] AI optimization error:", error)
    return NextResponse.json({ error: error.message, success: false }, { status: 500 })
  }
}
