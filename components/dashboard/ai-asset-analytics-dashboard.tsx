"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  DollarSign,
  Wrench,
  Target,
  Shield,
  Sparkles,
  RefreshCw,
  XCircle,
} from "lucide-react"
import { apiClient } from "@/lib/api-client"
import { motion } from "framer-motion"

export function AIAssetAnalyticsDashboard() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [insights, setInsights] = useState<any>(null)
  const [performance, setPerformance] = useState<any>(null)
  const [optimization, setOptimization] = useState<any>(null)
  const [risk, setRisk] = useState<any>(null)
  const [valuePrediction, setValuePrediction] = useState<any>(null)
  const [maintenance, setMaintenance] = useState<any>(null)
  const [executiveSummary, setExecutiveSummary] = useState<any>(null)

  const loadAnalytics = async () => {
    setLoading(true)
    setError(null)

    try {
      console.log("[v0] Loading AI analytics...")

      const [insightsRes, performanceRes, optimizationRes, riskRes, valueRes, maintenanceRes, summaryRes] =
        await Promise.allSettled([
          apiClient.getAIAssetInsights({ limit: 10 }),
          apiClient.getAIAssetPerformanceAnalysis(),
          apiClient.getAIAssetOptimizationRecommendations(),
          apiClient.getAIAssetRiskAssessment(),
          apiClient.getAIAssetValuePrediction(),
          apiClient.getAIAssetMaintenancePrediction({ days_ahead: 90 }),
          apiClient.getAIExecutiveSummary(),
        ])

      if (insightsRes.status === "fulfilled") {
        setInsights(insightsRes.value.data)
      } else {
        console.error("[v0] Insights error:", insightsRes.reason)
      }

      if (performanceRes.status === "fulfilled") {
        setPerformance(performanceRes.value.data)
      } else {
        console.error("[v0] Performance error:", performanceRes.reason)
      }

      if (optimizationRes.status === "fulfilled") {
        setOptimization(optimizationRes.value.data)
      } else {
        console.error("[v0] Optimization error:", optimizationRes.reason)
      }

      if (riskRes.status === "fulfilled") {
        setRisk(riskRes.value.data)
      } else {
        console.error("[v0] Risk error:", riskRes.reason)
      }

      if (valueRes.status === "fulfilled") {
        setValuePrediction(valueRes.value.data)
      } else {
        console.error("[v0] Value prediction error:", valueRes.reason)
      }

      if (maintenanceRes.status === "fulfilled") {
        setMaintenance(maintenanceRes.value.data)
      } else {
        console.error("[v0] Maintenance error:", maintenanceRes.reason)
      }

      if (summaryRes.status === "fulfilled") {
        setExecutiveSummary(summaryRes.value.data)
      } else {
        console.error("[v0] Executive summary error:", summaryRes.reason)
      }

      const allFailed = [
        insightsRes,
        performanceRes,
        optimizationRes,
        riskRes,
        valueRes,
        maintenanceRes,
        summaryRes,
      ].every((result) => result.status === "rejected")

      if (allFailed) {
        const firstError = [
          insightsRes,
          performanceRes,
          optimizationRes,
          riskRes,
          valueRes,
          maintenanceRes,
          summaryRes,
        ].find((result) => result.status === "rejected")

        if (firstError && firstError.status === "rejected") {
          throw new Error(
            firstError.reason?.message ||
              "Failed to load AI analytics. Please check your network connection and try again.",
          )
        }
      }

      console.log("[v0] AI analytics loaded successfully")
    } catch (error: any) {
      console.error("[v0] Error loading AI analytics:", error)
      setError(error.message || "Failed to load AI analytics. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAnalytics()
  }, [])

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "destructive"
      case "high":
        return "destructive"
      case "medium":
        return "default"
      case "low":
        return "secondary"
      default:
        return "outline"
    }
  }

  const getTrendIcon = (direction: string) => {
    switch (direction) {
      case "improving":
        return <TrendingUp className="h-[4dvw] w-[4dvw] md:h-6 md:w-6 text-green-600" />
      case "declining":
        return <TrendingDown className="h-[4dvw] w-[4dvw] md:h-6 md:w-6 text-red-600" />
      default:
        return <CheckCircle2 className="h-[4dvw] w-[4dvw] md:h-6 md:w-6 text-blue-600" />
    }
  }

  if (loading && !insights && !error) {
    return (
      <div className="space-y-[3dvw] md:space-y-4">
        <Skeleton className="h-[20dvw] md:h-32 w-full" />
        <Skeleton className="h-[60dvw] md:h-96 w-full" />
      </div>
    )
  }

  if (error && !insights && !performance && !optimization) {
    return (
      <Alert variant="destructive" className="my-[4dvw] md:my-6">
        <XCircle className="h-[4dvw] w-[4dvw] md:h-4 md:w-4" />
        <AlertTitle className="text-[3.5dvw] md:text-base">Failed to Load AI Analytics</AlertTitle>
        <AlertDescription className="text-[3dvw] md:text-sm mt-[2dvw] md:mt-2">
          <p className="mb-[3dvw] md:mb-4">{error}</p>
          <Button onClick={loadAnalytics} disabled={loading} variant="outline" size="sm">
            <RefreshCw
              className={`h-[3.5dvw] w-[3.5dvw] md:h-4 md:w-4 mr-[2dvw] md:mr-2 ${loading ? "animate-spin" : ""}`}
            />
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  const hasPartialData =
    insights || performance || optimization || risk || valuePrediction || maintenance || executiveSummary
  const hasError = error && hasPartialData

  return (
    <div className="space-y-[3dvw] md:space-y-6">
      {hasError && (
        <Alert variant="destructive">
          <AlertTriangle className="h-[4dvw] w-[4dvw] md:h-4 md:w-4" />
          <AlertTitle className="text-[3.5dvw] md:text-base">Partial Data Loaded</AlertTitle>
          <AlertDescription className="text-[3dvw] md:text-sm">Some analytics failed to load. {error}</AlertDescription>
        </Alert>
      )}

      {/* Executive Summary */}
      {executiveSummary && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-[2dvw] md:gap-2">
                  <Sparkles className="h-[5dvw] w-[5dvw] md:h-6 md:w-6 text-primary" />
                  <CardTitle className="text-[4dvw] md:text-xl">AI Executive Summary</CardTitle>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadAnalytics}
                  disabled={loading}
                  className="gap-[1.5dvw] md:gap-2 bg-transparent"
                >
                  <RefreshCw className={`h-[3.5dvw] w-[3.5dvw] md:h-4 md:w-4 ${loading ? "animate-spin" : ""}`} />
                  <span className="hidden md:inline">Refresh</span>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-[3.5dvw] md:text-base text-muted-foreground leading-relaxed">
                {executiveSummary.summary.replace(/^###\s*/, "")}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Performance Score */}
      {performance && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-[2dvw] md:gap-2 text-[4dvw] md:text-xl">
                <Target className="h-[5dvw] w-[5dvw] md:h-6 md:w-6" />
                Asset Performance Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-[4dvw] md:gap-6">
                <div className="text-[12dvw] md:text-6xl font-bold text-primary">{performance.overallScore}</div>
                <div className="flex-1 space-y-[2dvw] md:space-y-3">
                  <p className="text-[3.5dvw] md:text-base text-muted-foreground">
                    {performance.benchmarks.yourPosition}
                  </p>
                  {performance.benchmarks.industryAverage && (
                    <p className="text-[3dvw] md:text-sm">
                      Industry Average: <span className="font-semibold">{performance.benchmarks.industryAverage}</span>
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      <Tabs defaultValue="insights" className="space-y-[3dvw] md:space-y-4">
        <TabsList className="grid w-full grid-cols-3 md:grid-cols-6 gap-[1dvw] md:gap-1 h-auto">
          <TabsTrigger value="insights" className="text-[3dvw] md:text-sm px-[2dvw] md:px-3 py-[1.5dvw] md:py-2">
            <span className="md:hidden">Insights</span>
            <span className="hidden md:inline">AI Insights</span>
          </TabsTrigger>
          <TabsTrigger value="performance" className="text-[3dvw] md:text-sm px-[2dvw] md:px-3 py-[1.5dvw] md:py-2">
            Performance
          </TabsTrigger>
          <TabsTrigger value="optimization" className="text-[3dvw] md:text-sm px-[2dvw] md:px-3 py-[1.5dvw] md:py-2">
            <span className="md:hidden">Optimize</span>
            <span className="hidden md:inline">Optimization</span>
          </TabsTrigger>
          <TabsTrigger value="risk" className="text-[3dvw] md:text-sm px-[2dvw] md:px-3 py-[1.5dvw] md:py-2">
            Risk
          </TabsTrigger>
          <TabsTrigger value="value" className="text-[3dvw] md:text-sm px-[2dvw] md:px-3 py-[1.5dvw] md:py-2">
            Value
          </TabsTrigger>
          <TabsTrigger value="maintenance" className="text-[3dvw] md:text-sm px-[2dvw] md:px-3 py-[1.5dvw] md:py-2">
            <span className="md:hidden">Maint.</span>
            <span className="hidden md:inline">Maintenance</span>
          </TabsTrigger>
        </TabsList>

        {/* AI Insights Tab */}
        <TabsContent value="insights" className="space-y-[3dvw] md:space-y-4">
          {insights && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="text-[4dvw] md:text-lg">Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-[3.5dvw] md:text-base text-muted-foreground">
                    {insights.summary.replace(/^###\s*/, "")}
                  </p>
                </CardContent>
              </Card>

              <div className="grid gap-[3dvw] md:gap-4 md:grid-cols-2">
                {insights.insights.map((insight: any, index: number) => (
                  <Card key={index}>
                    <CardHeader>
                      <div className="flex items-start justify-between gap-[2dvw] md:gap-2">
                        <CardTitle className="text-[3.5dvw] md:text-base">{insight.title}</CardTitle>
                        <Badge variant={getSeverityColor(insight.severity)} className="text-[2.5dvw] md:text-xs">
                          {insight.severity}
                        </Badge>
                      </div>
                      <CardDescription className="text-[3dvw] md:text-sm">{insight.category}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-[2dvw] md:space-y-3">
                      <p className="text-[3dvw] md:text-sm">{insight.description}</p>
                      <div className="space-y-[1.5dvw] md:space-y-2">
                        <p className="text-[3dvw] md:text-sm font-semibold">Recommendation:</p>
                        <p className="text-[3dvw] md:text-sm text-muted-foreground">{insight.recommendation}</p>
                      </div>
                      <div className="flex items-center justify-between text-[2.5dvw] md:text-xs text-muted-foreground">
                        <span>Impact: {insight.impact}</span>
                        <span>Confidence: {insight.confidence}%</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {insights.actionItems.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-[4dvw] md:text-lg">Action Items</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-[2dvw] md:space-y-2">
                      {insights.actionItems.map((item: any, index: number) => (
                        <li key={index} className="flex items-start gap-[2dvw] md:gap-2 text-[3dvw] md:text-sm">
                          <CheckCircle2 className="h-[4dvw] w-[4dvw] md:h-5 md:w-5 text-primary mt-[0.5dvw] md:mt-0.5 flex-shrink-0" />
                          <span>{typeof item === 'string' ? item : item.action || JSON.stringify(item)}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-[3dvw] md:space-y-4">
          {performance && (
            <>
              <div className="grid gap-[3dvw] md:gap-4 md:grid-cols-2 lg:grid-cols-3">
                {performance.trends.map((trend: any, index: number) => (
                  <Card key={index}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-[3.5dvw] md:text-base">{trend.metric}</CardTitle>
                        {getTrendIcon(trend.direction)}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-[2dvw] md:space-y-2">
                      <div className="text-[6dvw] md:text-3xl font-bold">
                        {trend.change > 0 ? "+" : ""}
                        {trend.change}%
                      </div>
                      <p className="text-[3dvw] md:text-sm text-muted-foreground">{trend.analysis}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-[4dvw] md:text-lg">Recommendations</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-[2dvw] md:space-y-2">
                    {performance.recommendations.map((rec: string, index: number) => (
                      <li key={index} className="flex items-start gap-[2dvw] md:gap-2 text-[3dvw] md:text-sm">
                        <TrendingUp className="h-[4dvw] w-[4dvw] md:h-5 md:w-5 text-green-600 mt-[0.5dvw] md:mt-0.5 flex-shrink-0" />
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Optimization Tab */}
        <TabsContent value="optimization" className="space-y-[3dvw] md:space-y-4">
          {optimization && (
            <>
              <Card className="border-green-200 bg-green-50/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-[2dvw] md:gap-2 text-[4dvw] md:text-lg">
                    <DollarSign className="h-[5dvw] w-[5dvw] md:h-6 md:w-6 text-green-600" />
                    Total Potential Savings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-[8dvw] md:text-4xl font-bold text-green-600">
                    ${optimization.totalPotentialSavings.toLocaleString()}
                  </div>
                </CardContent>
              </Card>

              <div className="grid gap-[3dvw] md:gap-4">
                {optimization.opportunities.map((opp: any, index: number) => (
                  <Card key={index}>
                    <CardHeader>
                      <div className="flex items-start justify-between gap-[2dvw] md:gap-2">
                        <div className="flex-1">
                          <CardTitle className="text-[3.5dvw] md:text-base">{opp.area}</CardTitle>
                          <CardDescription className="text-[3dvw] md:text-sm mt-[1dvw] md:mt-1">
                            {opp.description}
                          </CardDescription>
                        </div>
                        <Badge variant={getSeverityColor(opp.priority)} className="text-[2.5dvw] md:text-xs">
                          {opp.priority}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-[3dvw] md:space-y-4">
                      <div className="grid grid-cols-2 gap-[3dvw] md:gap-4 text-[3dvw] md:text-sm">
                        <div>
                          <p className="text-muted-foreground">Potential Savings</p>
                          <p className="text-[4dvw] md:text-lg font-semibold text-green-600">
                            ${opp.potentialSavings.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Implementation Cost</p>
                          <p className="text-[4dvw] md:text-lg font-semibold">
                            ${opp.implementationCost.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">ROI</p>
                          <p className="text-[4dvw] md:text-lg font-semibold text-primary">{opp.roi}%</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Timeframe</p>
                          <p className="text-[4dvw] md:text-lg font-semibold">{opp.timeframe}</p>
                        </div>
                      </div>

                      <div>
                        <p className="text-[3dvw] md:text-sm font-semibold mb-[2dvw] md:mb-2">Implementation Steps:</p>
                        <ol className="space-y-[1.5dvw] md:space-y-1.5 list-decimal list-inside text-[3dvw] md:text-sm text-muted-foreground">
                          {opp.steps.map((step: string, stepIndex: number) => (
                            <li key={stepIndex}>{step}</li>
                          ))}
                        </ol>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {optimization.quickWins.length > 0 && (
                <Card className="border-blue-200 bg-blue-50/50">
                  <CardHeader>
                    <CardTitle className="text-[4dvw] md:text-lg">Quick Wins</CardTitle>
                    <CardDescription className="text-[3dvw] md:text-sm">
                      Implement these immediately for fast results
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-[2dvw] md:space-y-2">
                      {optimization.quickWins.map((win: any, index: number) => (
                        <li key={index} className="flex items-start gap-[2dvw] md:gap-2 text-[3dvw] md:text-sm">
                          <CheckCircle2 className="h-[4dvw] w-[4dvw] md:h-5 md:w-5 text-blue-600 mt-[0.5dvw] md:mt-0.5 flex-shrink-0" />
                          <span>{typeof win === 'string' ? win : win.action || JSON.stringify(win)}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        {/* Risk Tab */}
        <TabsContent value="risk" className="space-y-[3dvw] md:space-y-4">
          {risk && (
            <>
              <Card className="border-red-200 bg-red-50/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-[2dvw] md:gap-2 text-[4dvw] md:text-lg">
                    <Shield className="h-[5dvw] w-[5dvw] md:h-6 md:w-6 text-red-600" />
                    Overall Risk Score
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-[8dvw] md:text-4xl font-bold text-red-600">{risk.overallRiskScore}/100</div>
                </CardContent>
              </Card>

              {risk.criticalRisks.length > 0 && (
                <Card className="border-red-300 bg-red-100/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-[2dvw] md:gap-2 text-[4dvw] md:text-lg text-red-700">
                      <AlertTriangle className="h-[5dvw] w-[5dvw] md:h-6 md:w-6" />
                      Critical Risks
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-[2dvw] md:space-y-2">
                      {risk.criticalRisks.map((criticalRisk: string, index: number) => (
                        <li key={index} className="flex items-start gap-[2dvw] md:gap-2 text-[3dvw] md:text-sm">
                          <AlertTriangle className="h-[4dvw] w-[4dvw] md:h-5 md:w-5 text-red-600 mt-[0.5dvw] md:mt-0.5 flex-shrink-0" />
                          <span>{criticalRisk}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              <div className="grid gap-[3dvw] md:gap-4">
                {risk.riskCategories.map((category: any, index: number) => (
                  <Card key={index}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-[3.5dvw] md:text-base">{category.category}</CardTitle>
                        <Badge variant={getSeverityColor(category.level)} className="text-[2.5dvw] md:text-xs">
                          {category.level}
                        </Badge>
                      </div>
                      <CardDescription className="text-[3dvw] md:text-sm">
                        Risk Score: {category.score}/100
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-[3dvw] md:space-y-3">
                      <div>
                        <p className="text-[3dvw] md:text-sm font-semibold mb-[1.5dvw] md:mb-1.5">Risk Factors:</p>
                        <ul className="space-y-[1dvw] md:space-y-1 list-disc list-inside text-[3dvw] md:text-sm text-muted-foreground">
                          {category.factors.map((factor: string, factorIndex: number) => (
                            <li key={factorIndex}>{factor}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <p className="text-[3dvw] md:text-sm font-semibold mb-[1.5dvw] md:mb-1.5">Mitigation:</p>
                        <ul className="space-y-[1dvw] md:space-y-1 list-disc list-inside text-[3dvw] md:text-sm text-muted-foreground">
                          {category.mitigation.map((mit: string, mitIndex: number) => (
                            <li key={mitIndex}>{mit}</li>
                          ))}
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </TabsContent>

        {/* Value Prediction Tab */}
        <TabsContent value="value" className="space-y-[3dvw] md:space-y-4">
          {valuePrediction && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="text-[4dvw] md:text-lg">Market Trends</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-[3dvw] md:text-sm text-muted-foreground">{valuePrediction.marketTrends}</p>
                </CardContent>
              </Card>

              <div className="grid gap-[3dvw] md:gap-4 md:grid-cols-2">
                {valuePrediction.predictions.map((pred: any, index: number) => (
                  <Card key={index}>
                    <CardHeader>
                      <CardTitle className="text-[3.5dvw] md:text-base">{pred.timeframe}</CardTitle>
                      <CardDescription className="text-[3dvw] md:text-sm">
                        Confidence: {pred.confidence}%
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-[2dvw] md:space-y-3">
                      <div className="text-[6dvw] md:text-3xl font-bold text-primary">
                        ${pred.predictedValue.toLocaleString()}
                      </div>
                      <div>
                        <p className="text-[3dvw] md:text-sm font-semibold mb-[1.5dvw] md:mb-1.5">Key Factors:</p>
                        <ul className="space-y-[1dvw] md:space-y-1 list-disc list-inside text-[3dvw] md:text-sm text-muted-foreground">
                          {pred.factors.map((factor: string, factorIndex: number) => (
                            <li key={factorIndex}>{factor}</li>
                          ))}
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-[4dvw] md:text-lg">Value Preservation Recommendations</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-[2dvw] md:space-y-2">
                    {valuePrediction.recommendations.map((rec: string, index: number) => (
                      <li key={index} className="flex items-start gap-[2dvw] md:gap-2 text-[3dvw] md:text-sm">
                        <DollarSign className="h-[4dvw] w-[4dvw] md:h-5 md:w-5 text-green-600 mt-[0.5dvw] md:mt-0.5 flex-shrink-0" />
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Maintenance Prediction Tab */}
        <TabsContent value="maintenance" className="space-y-[3dvw] md:space-y-4">
          {maintenance && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="text-[4dvw] md:text-lg">Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-[3.5dvw] md:text-base text-muted-foreground">{maintenance.summary}</p>
                </CardContent>
              </Card>

              <div className="grid gap-[3dvw] md:gap-4">
                {maintenance.predictions.map((pred: any, index: number) => (
                  <Card key={index}>
                    <CardHeader>
                      <div className="flex items-start justify-between gap-[2dvw] md:gap-2">
                        <div className="flex-1">
                          <CardTitle className="text-[3.5dvw] md:text-base">{pred.assetName}</CardTitle>
                          <CardDescription className="text-[3dvw] md:text-sm mt-[1dvw] md:mt-1">
                            {pred.maintenanceType}
                          </CardDescription>
                        </div>
                        <Badge variant={getSeverityColor(pred.urgency)} className="text-[2.5dvw] md:text-xs">
                          {pred.urgency}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-[2dvw] md:space-y-3">
                      <div className="grid grid-cols-2 gap-[3dvw] md:gap-4 text-[3dvw] md:text-sm">
                        <div>
                          <p className="text-muted-foreground">Predicted Date</p>
                          <p className="text-[3.5dvw] md:text-base font-semibold">
                            {new Date(pred.predictedDate).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Estimated Cost</p>
                          <p className="text-[3.5dvw] md:text-base font-semibold">
                            ${pred.estimatedCost.toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div>
                        <p className="text-[3dvw] md:text-sm font-semibold mb-[1.5dvw] md:mb-1.5">Reasoning:</p>
                        <p className="text-[3dvw] md:text-sm text-muted-foreground">{pred.reasoning}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {maintenance.preventiveMeasures.length > 0 && (
                <Card className="border-blue-200 bg-blue-50/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-[2dvw] md:gap-2 text-[4dvw] md:text-lg">
                      <Wrench className="h-[5dvw] w-[5dvw] md:h-6 md:w-6 text-blue-600" />
                      Preventive Measures
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-[2dvw] md:space-y-2">
                      {maintenance.preventiveMeasures.map((measure: string, index: number) => (
                        <li key={index} className="flex items-start gap-[2dvw] md:gap-2 text-[3dvw] md:text-sm">
                          <CheckCircle2 className="h-[4dvw] w-[4dvw] md:h-5 md:w-5 text-blue-600 mt-[0.5dvw] md:mt-0.5 flex-shrink-0" />
                          <span>{measure}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
