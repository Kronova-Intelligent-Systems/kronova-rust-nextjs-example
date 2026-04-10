import { generateObject, generateText } from "ai"
import { z } from "zod"
import { createClient } from "@/lib/supabase/client"

// Schema definitions for structured AI outputs
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

const assetOptimizationSchema = z.object({
  opportunities: z.array(
    z.object({
      area: z.string(),
      potentialSavings: z.number(),
      implementationCost: z.number(),
      roi: z.number(),
      timeframe: z.string(),
      priority: z.enum(["critical", "high", "medium", "low"]),
      description: z.string(),
      steps: z.array(z.string()),
    }),
  ),
  totalPotentialSavings: z.number(),
  quickWins: z.array(z.string()),
})

const assetRiskSchema = z.object({
  overallRiskScore: z.number().min(0).max(100),
  riskCategories: z.array(
    z.object({
      category: z.string(),
      score: z.number().min(0).max(100),
      level: z.enum(["critical", "high", "medium", "low"]),
      factors: z.array(z.string()),
      mitigation: z.array(z.string()),
    }),
  ),
  criticalRisks: z.array(z.string()),
  recommendations: z.array(z.string()),
})

const assetValuePredictionSchema = z.object({
  predictions: z.array(
    z.object({
      timeframe: z.string(),
      predictedValue: z.number(),
      confidence: z.number().min(0).max(100),
      factors: z.array(z.string()),
    }),
  ),
  depreciationRate: z.number(),
  marketTrends: z.string(),
  recommendations: z.array(z.string()),
})

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

export class AIAssetAnalytics {
  private supabase = createClient()

  /**
   * Generate AI-powered insights about asset health, risks, and opportunities
   */
  async getAIAssetInsights(params?: { asset_ids?: string[]; limit?: number }) {
    console.log("[v0] Generating AI asset insights...")

    // Fetch asset data
    let query = this.supabase
      .from("assets")
      .select("*, asset_intelligence_insights(*), asset_lifecycle_events(*)")
      .order("created_at", { ascending: false })

    if (params?.asset_ids && params.asset_ids.length > 0) {
      query = query.in("id", params.asset_ids)
    }

    if (params?.limit) {
      query = query.limit(params.limit)
    }

    const { data: assets, error } = await query

    if (error) {
      console.error("[v0] Error fetching assets for AI analysis:", error)
      throw error
    }

    // Prepare context for AI analysis
    const assetContext = assets?.map((asset) => ({
      id: asset.id,
      name: asset.name,
      type: asset.asset_type,
      status: asset.status,
      value: asset.current_value,
      purchaseDate: asset.purchase_date,
      riskScore: asset.risk_score,
      maintenanceSchedule: asset.maintenance_schedule,
      predictiveData: asset.predictive_data,
      esgMetrics: asset.esg_metrics,
      recentInsights: asset.asset_intelligence_insights?.slice(0, 3),
      recentEvents: asset.asset_lifecycle_events?.slice(0, 5),
    }))

    // Generate AI insights using Vercel AI Gateway
    try {
      const { object } = await generateObject({
        model: "openai/gpt-4o-mini",
        schema: assetInsightSchema,
        prompt: `Analyze the following asset data and provide actionable insights:

Asset Data:
${JSON.stringify(assetContext, null, 2)}

Provide comprehensive insights covering:
1. Asset health and condition
2. Risk factors and vulnerabilities
3. Optimization opportunities
4. Maintenance recommendations
5. Value preservation strategies
6. Performance improvements

Focus on actionable recommendations with clear impact and confidence levels.`,
        maxOutputTokens: 3000,
      })

      console.log("[v0] AI asset insights generated successfully")
      return { data: object, success: true }
    } catch (aiError: any) {
      console.error("[v0] AI Gateway error:", aiError)
      throw new Error(`AI insights generation failed: ${aiError.message || "Unknown error"}`)
    }
  }

  /**
   * Analyze asset performance trends with AI
   */
  async getAIAssetPerformanceAnalysis(params?: { timeframe?: string; asset_type?: string }) {
    console.log("[v0] Analyzing asset performance with AI...")

    // Fetch asset analytics and execution data
    const { data: analytics, error: analyticsError } = await this.supabase
      .from("asset_analytics")
      .select("*")
      .maybeSingle()

    const { data: executions, error: executionsError } = await this.supabase
      .from("asset_workflow_executions")
      .select("*, ai_workflows(name)")
      .order("created_at", { ascending: false })
      .limit(50)

    if (analyticsError) {
      console.error("[v0] Error fetching analytics data:", analyticsError)
    }

    if (executionsError) {
      console.error("[v0] Error fetching executions data:", executionsError)
    }

    const performanceContext = {
      analytics: analytics || {},
      recentExecutions: executions?.map((exec) => ({
        workflowName: exec.ai_workflows?.name,
        status: exec.status,
        performanceMetrics: exec.performance_metrics,
        learningInsights: exec.learning_insights,
        executionTime:
          exec.end_time && exec.start_time
            ? new Date(exec.end_time).getTime() - new Date(exec.start_time).getTime()
            : null,
      })),
      timeframe: params?.timeframe || "last_30_days",
      assetType: params?.asset_type,
    }

    // Generate AI performance analysis using Vercel AI Gateway
    try {
      const { object } = await generateObject({
        model: "openai/gpt-4o-mini",
        schema: assetPerformanceSchema,
        prompt: `Analyze asset performance trends and provide insights:

Performance Data:
${JSON.stringify(performanceContext, null, 2)}

Provide:
1. Overall performance score (0-100)
2. Key performance trends with direction and analysis
3. Benchmark comparisons
4. Actionable recommendations for improvement

Be specific and data-driven in your analysis.`,
        maxOutputTokens: 2500,
      })

      console.log("[v0] AI performance analysis completed")
      return { data: object, success: true }
    } catch (aiError: any) {
      console.error("[v0] AI Gateway error:", aiError)
      throw new Error(`AI analysis failed: ${aiError.message || "Unknown error"}`)
    }
  }

  /**
   * Generate AI-powered optimization recommendations
   */
  async getAIAssetOptimizationRecommendations() {
    console.log("[v0] Generating AI optimization recommendations...")

    // Fetch comprehensive asset data
    const { data: assets, error } = await this.supabase
      .from("assets")
      .select("*")
      .order("current_value", { ascending: false })

    if (error) {
      console.error("[v0] Error fetching assets for optimization:", error)
      throw error
    }

    const optimizationContext = {
      totalAssets: assets?.length || 0,
      totalValue: assets?.reduce((sum, asset) => sum + (asset.current_value || 0), 0) || 0,
      assetsByType: assets?.reduce(
        (acc, asset) => {
          acc[asset.asset_type] = (acc[asset.asset_type] || 0) + 1
          return acc
        },
        {} as Record<string, number>,
      ),
      maintenanceAssets: assets?.filter((a) => a.status === "maintenance").length || 0,
      highRiskAssets: assets?.filter((a) => (a.risk_score || 0) > 70).length || 0,
      iotEnabledAssets: assets?.filter((a) => a.iot_sensor_id).length || 0,
    }

    // Generate AI optimization recommendations using Vercel AI Gateway
    try {
      const { object } = await generateObject({
        model: "openai/gpt-4o-mini",
        schema: assetOptimizationSchema,
        prompt: `Analyze asset portfolio and identify optimization opportunities:

Portfolio Overview:
${JSON.stringify(optimizationContext, null, 2)}

Identify:
1. Cost reduction opportunities with ROI calculations
2. Efficiency improvements
3. Risk mitigation strategies
4. Technology adoption opportunities (IoT, AI, automation)
5. Quick wins that can be implemented immediately

Prioritize by ROI and implementation feasibility.`,
        maxOutputTokens: 3000,
      })

      console.log("[v0] AI optimization recommendations generated")
      return { data: object, success: true }
    } catch (aiError: any) {
      console.error("[v0] AI Gateway error:", aiError)
      throw new Error(`AI optimization failed: ${aiError.message || "Unknown error"}`)
    }
  }

  /**
   * AI-powered risk assessment for assets
   */
  async getAIAssetRiskAssessment(params?: { asset_ids?: string[] }) {
    console.log("[v0] Performing AI risk assessment...")

    let query = this.supabase.from("assets").select("*")

    if (params?.asset_ids && params.asset_ids.length > 0) {
      query = query.in("id", params.asset_ids)
    }

    const { data: assets, error } = await query

    if (error) {
      console.error("[v0] Error fetching assets for risk assessment:", error)
      throw error
    }

    const riskContext = {
      assets: assets?.map((asset) => ({
        id: asset.id,
        name: asset.name,
        type: asset.asset_type,
        status: asset.status,
        riskScore: asset.risk_score,
        value: asset.current_value,
        age: asset.purchase_date
          ? Math.floor((Date.now() - new Date(asset.purchase_date).getTime()) / (1000 * 60 * 60 * 24 * 365))
          : null,
        maintenanceSchedule: asset.maintenance_schedule,
        complianceData: asset.compliance_data,
        esgMetrics: asset.esg_metrics,
      })),
    }

    // Generate AI risk assessment using Vercel AI Gateway
    try {
      const { object } = await generateObject({
        model: "openai/gpt-4o-mini",
        schema: assetRiskSchema,
        prompt: `Perform comprehensive risk assessment for assets:

Asset Risk Data:
${JSON.stringify(riskContext, null, 2)}

Analyze:
1. Overall portfolio risk score
2. Risk categories (operational, financial, compliance, environmental, technological)
3. Critical risk factors
4. Mitigation strategies
5. Prioritized recommendations

Provide actionable risk mitigation plans.`,
        maxOutputTokens: 2500,
      })

      console.log("[v0] AI risk assessment completed")
      return { data: object, success: true }
    } catch (aiError: any) {
      console.error("[v0] AI Gateway error:", aiError)
      throw new Error(`AI risk assessment failed: ${aiError.message || "Unknown error"}`)
    }
  }

  /**
   * Predict future asset values using AI
   */
  async getAIAssetValuePrediction(params?: { asset_id?: string; timeframes?: string[] }) {
    console.log("[v0] Predicting asset values with AI...")

    let query = this.supabase.from("assets").select("*")

    if (params?.asset_id) {
      query = query.eq("id", params.asset_id)
    }

    const { data: assets, error } = await query

    if (error) {
      console.error("[v0] Error fetching assets for value prediction:", error)
      throw error
    }

    const valuationContext = {
      assets: assets?.map((asset) => ({
        id: asset.id,
        name: asset.name,
        type: asset.asset_type,
        purchaseCost: asset.purchase_cost,
        currentValue: asset.current_value,
        purchaseDate: asset.purchase_date,
        depreciationRate: asset.depreciation_rate,
        predictiveData: asset.predictive_data,
        maintenanceHistory: asset.maintenance_schedule,
      })),
      timeframes: params?.timeframes || ["3_months", "6_months", "1_year", "3_years"],
    }

    // Generate AI value predictions using Vercel AI Gateway
    try {
      const { object } = await generateObject({
        model: "openai/gpt-4o-mini",
        schema: assetValuePredictionSchema,
        prompt: `Predict future asset values based on historical data and trends:

Asset Valuation Data:
${JSON.stringify(valuationContext, null, 2)}

Provide:
1. Value predictions for each timeframe with confidence levels
2. Key factors influencing value changes
3. Depreciation rate analysis
4. Market trend insights
5. Recommendations for value preservation

Be realistic and factor in depreciation, maintenance, and market conditions.`,
        maxOutputTokens: 2500,
      })

      console.log("[v0] AI value predictions generated")
      return { data: object, success: true }
    } catch (aiError: any) {
      console.error("[v0] AI Gateway error:", aiError)
      throw new Error(`AI value prediction failed: ${aiError.message || "Unknown error"}`)
    }
  }

  /**
   * Predict maintenance needs using AI
   */
  async getAIAssetMaintenancePrediction(params?: { days_ahead?: number }) {
    console.log("[v0] Predicting maintenance needs with AI...")

    const { data: assets, error } = await this.supabase
      .from("assets")
      .select("*, asset_lifecycle_events(*)")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] Error fetching assets for maintenance prediction:", error)
      throw error
    }

    const maintenanceContext = {
      assets: assets?.map((asset) => ({
        id: asset.id,
        name: asset.name,
        type: asset.asset_type,
        status: asset.status,
        purchaseDate: asset.purchase_date,
        maintenanceSchedule: asset.maintenance_schedule,
        recentEvents: asset.asset_lifecycle_events?.filter((e: any) => e.event_type === "maintenance").slice(0, 5),
        iotSensorId: asset.iot_sensor_id,
        predictiveData: asset.predictive_data,
      })),
      daysAhead: params?.days_ahead || 90,
    }

    // Generate AI maintenance predictions using Vercel AI Gateway
    try {
      const { object } = await generateObject({
        model: "openai/gpt-4o-mini",
        schema: assetMaintenancePredictionSchema,
        prompt: `Predict upcoming maintenance needs for assets:

Maintenance Data:
${JSON.stringify(maintenanceContext, null, 2)}

Predict:
1. Upcoming maintenance requirements within the next ${params?.days_ahead || 90} days
2. Maintenance type and urgency
3. Estimated costs
4. Reasoning based on asset age, usage, and history
5. Preventive measures to reduce maintenance needs

Prioritize by urgency and potential impact.`,
        maxOutputTokens: 3000,
      })

      console.log("[v0] AI maintenance predictions generated")
      return { data: object, success: true }
    } catch (aiError: any) {
      console.error("[v0] AI Gateway error:", aiError)
      throw new Error(`AI maintenance prediction failed: ${aiError.message || "Unknown error"}`)
    }
  }

  /**
   * Generate executive summary with AI
   */
  async getAIExecutiveSummary() {
    console.log("[v0] Generating AI executive summary...")

    // Fetch all relevant data
    const [analyticsResult, assetsResult, executionsResult] = await Promise.all([
      this.supabase.from("asset_analytics").select("*").maybeSingle(),
      this.supabase.from("assets").select("*"),
      this.supabase.from("asset_workflow_executions").select("*").order("created_at", { ascending: false }).limit(20),
    ])

    const summaryContext = {
      analytics: analyticsResult.data || {},
      totalAssets: assetsResult.data?.length || 0,
      totalValue: assetsResult.data?.reduce((sum, asset) => sum + (asset.current_value || 0), 0) || 0,
      recentExecutions: executionsResult.data?.length || 0,
      successRate: executionsResult.data
        ? (executionsResult.data.filter((e) => e.status === "completed").length / executionsResult.data.length) * 100
        : 0,
    }

    // Generate AI executive summary using Vercel AI Gateway
    try {
      const { text } = await generateText({
        model: "openai/gpt-4o-mini",
        prompt: `Generate an executive summary of asset intelligence platform performance:

Platform Metrics:
${JSON.stringify(summaryContext, null, 2)}

Provide a concise executive summary covering:
1. Key performance indicators
2. Notable achievements and trends
3. Areas of concern
4. Strategic recommendations
5. Next steps

Keep it concise, actionable, and executive-friendly (2-3 paragraphs).`,
        maxOutputTokens: 1000,
      })

      console.log("[v0] AI executive summary generated")
      return { data: { summary: text }, success: true }
    } catch (aiError: any) {
      console.error("[v0] AI Gateway error:", aiError)
      throw new Error(`AI executive summary failed: ${aiError.message || "Unknown error"}`)
    }
  }
}

// Export singleton instance
export const aiAssetAnalytics = new AIAssetAnalytics()
