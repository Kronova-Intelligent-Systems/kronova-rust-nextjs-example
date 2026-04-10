import { type NextRequest, NextResponse } from "next/server"
import { generateObject } from "ai"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { getAIModel } from "@/lib/ai-config"
import { retryGenerateObject } from "@/lib/ai-retry"

const assetMaintenancePredictionSchema = z.object({
  predictions: z.array(
    z.object({
      assetId: z.string(),
      assetName: z.string(),
      predictedDate: z.string(),
      maintenanceType: z.string(),
      urgency: z.enum(["critical", "high", "medium", "low"]),
      estimatedCost: z.number(),
      reasoning: z.string(),
    }),
  ),
  summary: z.string(),
  preventiveMeasures: z.array(z.string()),
})

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { days_ahead } = await request.json()

    const { data: assets } = await supabase
      .from("assets")
      .select("*, asset_lifecycle_events(*)")
      .order("created_at", { ascending: false })

    const maintenanceContext = {
      assets: assets?.map((asset) => ({
        id: asset.id,
        name: asset.name,
        type: asset.asset_type,
        status: asset.status,
        maintenanceSchedule: asset.maintenance_schedule,
      })),
      daysAhead: days_ahead || 90,
    }

    const { object } = await retryGenerateObject(
      async () =>
        await generateObject({
          model: await getAIModel("gpt-4o-mini"),
          schema: assetMaintenancePredictionSchema,
          prompt: `Predict upcoming maintenance needs for assets:

${JSON.stringify(maintenanceContext, null, 2)}

Predict:
1. Upcoming maintenance requirements within the next ${days_ahead || 90} days
2. Maintenance type and urgency
3. Estimated costs
4. Reasoning based on asset age, usage, and history
5. Preventive measures to reduce maintenance needs

Prioritize by urgency and potential impact.`,
          maxTokens: 3000,
        }),
      {
        maxRetries: 3,
        initialDelayMs: 1000,
      },
    )

    return NextResponse.json({ data: object, success: true })
  } catch (error: any) {
    console.error("[v0] AI maintenance prediction error:", error)
    return NextResponse.json({ error: error.message, success: false }, { status: 500 })
  }
}
