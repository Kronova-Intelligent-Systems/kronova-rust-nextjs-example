import { type NextRequest, NextResponse } from "next/server"
import { generateObject } from "ai"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { getAIModel } from "@/lib/ai-config"
import { retryGenerateObject } from "@/lib/ai-retry"

const assetValuePredictionSchema = z.object({
  predictions: z
    .array(
      z.object({
        timeframe: z.string().describe("Time period like '3 months', '6 months', '1 year'"),
        predictedValue: z.number().describe("Predicted asset value in dollars"),
        confidence: z.number().min(0).max(100).describe("Confidence level as percentage 0-100"),
        factors: z.array(z.string()).describe("Key factors affecting this prediction"),
      }),
    )
    .describe("Array of value predictions for different timeframes"),
  depreciationRate: z.number().optional().describe("Annual depreciation rate as percentage"),
  marketTrends: z.string().optional().describe("Overall market trends analysis"),
  recommendations: z.array(z.string()).optional().describe("Strategic recommendations based on predictions"),
})

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { asset_id, timeframes } = await request.json()

    let query = supabase.from("assets").select("*")

    if (asset_id) {
      query = query.eq("id", asset_id)
    }

    const { data: assets } = await query

    const valuationContext = {
      assets: assets?.map((asset) => ({
        name: asset.name,
        type: asset.asset_type,
        currentValue: asset.current_value,
        purchaseDate: asset.purchase_date,
      })),
      timeframes: timeframes || ["3 months", "6 months", "1 year"],
    }

    const { object } = await retryGenerateObject(
      async () =>
        await generateObject({
          model: await getAIModel("gpt-4o-mini"),
          schema: assetValuePredictionSchema,
          prompt: `You are an asset valuation expert. Analyze the following assets and predict their future values.

Asset Data:
${JSON.stringify(valuationContext, null, 2)}

REQUIRED OUTPUT STRUCTURE:
{
  "predictions": [
    {
      "timeframe": "3 months",
      "predictedValue": 1000000,
      "confidence": 85,
      "factors": ["Market growth", "Asset depreciation", "Usage patterns"]
    },
    {
      "timeframe": "6 months",
      "predictedValue": 950000,
      "confidence": 75,
      "factors": ["Market volatility", "Maintenance costs"]
    },
    {
      "timeframe": "1 year",
      "predictedValue": 900000,
      "confidence": 65,
      "factors": ["Long-term depreciation", "Technology obsolescence"]
    }
  ],
  "depreciationRate": 10.5,
  "marketTrends": "Market showing steady growth with moderate volatility",
  "recommendations": ["Consider selling before 1 year", "Invest in maintenance"]
}

INSTRUCTIONS:
1. Create one prediction object for EACH timeframe: ${valuationContext.timeframes.join(", ")}
2. Each prediction MUST have: timeframe (string), predictedValue (number), confidence (0-100), factors (array of strings)
3. Base predictions on asset type, current value, and realistic market conditions
4. Confidence should decrease for longer timeframes
5. Include 2-4 specific factors for each prediction

Generate the predictions now:`,
          maxTokens: 2500,
        }),
      {
        maxRetries: 3,
        initialDelayMs: 1000,
      },
    )

    return NextResponse.json({ data: object, success: true })
  } catch (error: any) {
    console.error("[v0] AI value prediction error:", error)
    return NextResponse.json({ error: error.message, success: false }, { status: 500 })
  }
}
