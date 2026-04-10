"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import {
  Download,
  FileText,
  Mail,
  Link2,
  TrendingUp,
  DollarSign,
  Shield,
  Wrench,
  Target,
  Sparkles,
  RefreshCw,
  XCircle,
  Calendar,
  Building2,
} from "lucide-react"
import { apiClient } from "@/lib/api-client"
import { motion } from "framer-motion"
import { useToast } from "@/hooks/use-toast"

interface ReportSection {
  id: string
  name: string
  icon: any
  enabled: boolean
}

export function AIReportsDashboard() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [reportData, setReportData] = useState<any>(null)
  const [exportFormat, setExportFormat] = useState<"pdf" | "csv" | "json">("pdf")
  const [exporting, setExporting] = useState(false)

  const [sections, setSections] = useState<ReportSection[]>([
    { id: "summary", name: "Executive Summary", icon: Sparkles, enabled: true },
    { id: "performance", name: "Performance Analysis", icon: Target, enabled: true },
    { id: "insights", name: "AI Insights", icon: FileText, enabled: true },
    { id: "optimization", name: "Optimization Opportunities", icon: TrendingUp, enabled: true },
    { id: "risk", name: "Risk Assessment", icon: Shield, enabled: true },
    { id: "value", name: "Value Predictions", icon: DollarSign, enabled: true },
    { id: "maintenance", name: "Maintenance Forecast", icon: Wrench, enabled: true },
  ])

  const loadReportData = async () => {
    setLoading(true)
    setError(null)

    try {
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

      const data: any = {}

      if (insightsRes.status === "fulfilled") data.insights = insightsRes.value.data
      if (performanceRes.status === "fulfilled") data.performance = performanceRes.value.data
      if (optimizationRes.status === "fulfilled") data.optimization = optimizationRes.value.data
      if (riskRes.status === "fulfilled") data.risk = riskRes.value.data
      if (valueRes.status === "fulfilled") data.value = valueRes.value.data
      if (maintenanceRes.status === "fulfilled") data.maintenance = maintenanceRes.value.data
      if (summaryRes.status === "fulfilled") data.summary = summaryRes.value.data

      setReportData(data)

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
        throw new Error("Failed to load report data. Please try again.")
      }
    } catch (error: any) {
      console.error("[v0] Error loading report data:", error)
      setError(error.message || "Failed to load report data")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadReportData()
  }, [])

  const toggleSection = (sectionId: string) => {
    setSections((prev) => prev.map((s) => (s.id === sectionId ? { ...s, enabled: !s.enabled } : s)))
  }

  const handleExport = async () => {
    if (!reportData) return

    setExporting(true)

    try {
      const enabledSections = sections.filter((s) => s.enabled).map((s) => s.id)
      const filteredData: any = {}

      enabledSections.forEach((sectionId) => {
        if (reportData[sectionId]) {
          filteredData[sectionId] = reportData[sectionId]
        }
      })

      if (exportFormat === "json") {
        const dataStr = JSON.stringify(filteredData, null, 2)
        const dataBlob = new Blob([dataStr], { type: "application/json" })
        const url = URL.createObjectURL(dataBlob)
        const link = document.createElement("a")
        link.href = url
        link.download = `ai-analytics-report-${new Date().toISOString().split("T")[0]}.json`
        link.click()
        URL.revokeObjectURL(url)

        toast({
          title: "Report Exported",
          description: "JSON report downloaded successfully",
        })
      } else if (exportFormat === "csv") {
        let csvContent = "AI Analytics Report\n"
        csvContent += `Generated: ${new Date().toLocaleString()}\n\n`

        if (filteredData.summary) {
          csvContent += "Executive Summary\n"
          csvContent += `"${filteredData.summary.summary.replace(/^###\s*/, "").replace(/^\*\*(.*?)\*\*/, "$1")}"\n\n`
        }

        if (filteredData.performance) {
          csvContent += "Performance Score\n"
          csvContent += `Overall Score,${filteredData.performance.overallScore}\n\n`
        }

        if (filteredData.insights && filteredData.insights.insights) {
          csvContent += "AI Insights\n"
          csvContent += "Title,Category,Severity,Description,Recommendation\n"
          filteredData.insights.insights.forEach((insight: any) => {
            csvContent += `"${insight.title}","${insight.category}","${insight.severity}","${insight.description}","${insight.recommendation}"\n`
          })
          csvContent += "\n"
        }

        if (filteredData.optimization) {
          csvContent += "Optimization Opportunities\n"
          csvContent += `Total Potential Savings,$${filteredData.optimization.totalPotentialSavings}\n`
          csvContent += "Area,Priority,Potential Savings,Implementation Cost,ROI\n"
          filteredData.optimization.opportunities.forEach((opp: any) => {
            csvContent += `"${opp.area}","${opp.priority}",$${opp.potentialSavings},$${opp.implementationCost},${opp.roi}%\n`
          })
          csvContent += "\n"
        }

        if (filteredData.risk) {
          csvContent += "Risk Assessment\n"
          csvContent += `Overall Risk Score,${filteredData.risk.overallRiskScore}\n`
          csvContent += "Category,Level,Score\n"
          filteredData.risk.riskCategories.forEach((cat: any) => {
            csvContent += `"${cat.category}","${cat.level}",${cat.score}\n`
          })
          csvContent += "\n"
        }

        const csvBlob = new Blob([csvContent], { type: "text/csv" })
        const url = URL.createObjectURL(csvBlob)
        const link = document.createElement("a")
        link.href = url
        link.download = `ai-analytics-report-${new Date().toISOString().split("T")[0]}.csv`
        link.click()
        URL.revokeObjectURL(url)

        toast({
          title: "Report Exported",
          description: "CSV report downloaded successfully",
        })
      } else if (exportFormat === "pdf") {
        const printWindow = window.open("", "_blank")
        if (printWindow) {
          let htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
              <title>AI Analytics Report</title>
              <style>
                body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
                h1 { color: #1a1a1a; border-bottom: 3px solid #3b82f6; padding-bottom: 10px; }
                h2 { color: #3b82f6; margin-top: 30px; }
                h3 { color: #4b5563; margin-top: 20px; }
                .meta { color: #6b7280; font-size: 14px; margin-bottom: 30px; }
                .section { margin-bottom: 40px; page-break-inside: avoid; }
                .badge { display: inline-block; padding: 4px 12px; border-radius: 4px; font-size: 12px; font-weight: 600; }
                .badge-critical { background: #fee2e2; color: #991b1b; }
                .badge-high { background: #fef3c7; color: #92400e; }
                .badge-medium { background: #dbeafe; color: #1e40af; }
                .badge-low { background: #d1fae5; color: #065f46; }
                .metric { background: #f9fafb; padding: 15px; border-radius: 8px; margin: 10px 0; }
                .metric-value { font-size: 32px; font-weight: bold; color: #3b82f6; }
                table { width: 100%; border-collapse: collapse; margin: 15px 0; }
                th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb; }
                th { background: #f9fafb; font-weight: 600; }
                @media print {
                  body { padding: 20px; }
                  .no-print { display: none; }
                }
              </style>
            </head>
            <body>
              <h1>AI Analytics Report</h1>
              <div class="meta">
                <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
                <p><strong>Report Type:</strong> Comprehensive Asset Intelligence Analysis</p>
              </div>
          `

          if (filteredData.summary) {
            htmlContent += `
              <div class="section">
                <h2>Executive Summary</h2>
                <p>${filteredData.summary.summary.replace(/^###\s*/, "").replace(/^\*\*(.*?)\*\*/, "$1")}</p>
              </div>
            `
          }

          if (filteredData.performance) {
            htmlContent += `
              <div class="section">
                <h2>Performance Analysis</h2>
                <div class="metric">
                  <div class="metric-value">${filteredData.performance.overallScore}</div>
                  <p>Overall Performance Score</p>
                </div>
                <h3>Performance Trends</h3>
                <table>
                  <thead>
                    <tr>
                      <th>Metric</th>
                      <th>Direction</th>
                      <th>Change</th>
                      <th>Analysis</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${filteredData.performance.trends
                      .map(
                        (trend: any) => `
                      <tr>
                        <td>${trend.metric}</td>
                        <td>${trend.direction}</td>
                        <td>${trend.change > 0 ? "+" : ""}${trend.change}%</td>
                        <td>${trend.analysis}</td>
                      </tr>
                    `,
                      )
                      .join("")}
                  </tbody>
                </table>
              </div>
            `
          }

          if (filteredData.insights && filteredData.insights.insights) {
            htmlContent += `
              <div class="section">
                <h2>AI Insights</h2>
                <p>${filteredData.insights.summary.replace(/^###\s*/, "").replace(/^\*\*(.*?)\*\*/, "$1")}</p>
                ${filteredData.insights.insights
                  .map(
                    (insight: any) => `
                  <div class="metric">
                    <h3>${insight.title} <span class="badge badge-${insight.severity}">${insight.severity}</span></h3>
                    <p><strong>Category:</strong> ${insight.category}</p>
                    <p>${insight.description}</p>
                    <p><strong>Recommendation:</strong> ${insight.recommendation}</p>
                    <p><small>Impact: ${insight.impact} | Confidence: ${insight.confidence}%</small></p>
                  </div>
                `,
                  )
                  .join("")}
              </div>
            `
          }

          if (filteredData.optimization) {
            htmlContent += `
              <div class="section">
                <h2>Optimization Opportunities</h2>
                <div class="metric">
                  <div class="metric-value">$${filteredData.optimization.totalPotentialSavings.toLocaleString()}</div>
                  <p>Total Potential Savings</p>
                </div>
                <table>
                  <thead>
                    <tr>
                      <th>Area</th>
                      <th>Priority</th>
                      <th>Potential Savings</th>
                      <th>Implementation Cost</th>
                      <th>ROI</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${filteredData.optimization.opportunities
                      .map(
                        (opp: any) => `
                      <tr>
                        <td>${opp.area}</td>
                        <td><span class="badge badge-${opp.priority}">${opp.priority}</span></td>
                        <td>$${opp.potentialSavings.toLocaleString()}</td>
                        <td>$${opp.implementationCost.toLocaleString()}</td>
                        <td>${opp.roi}%</td>
                      </tr>
                    `,
                      )
                      .join("")}
                  </tbody>
                </table>
              </div>
            `
          }

          if (filteredData.risk) {
            htmlContent += `
              <div class="section">
                <h2>Risk Assessment</h2>
                <div class="metric">
                  <div class="metric-value">${filteredData.risk.overallRiskScore}/100</div>
                  <p>Overall Risk Score</p>
                </div>
                ${
                  filteredData.risk.criticalRisks.length > 0
                    ? `
                  <h3>Critical Risks</h3>
                  <ul>
                    ${filteredData.risk.criticalRisks.map((risk: string) => `<li>${risk}</li>`).join("")}
                  </ul>
                `
                    : ""
                }
                <h3>Risk Categories</h3>
                <table>
                  <thead>
                    <tr>
                      <th>Category</th>
                      <th>Level</th>
                      <th>Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${filteredData.risk.riskCategories
                      .map(
                        (cat: any) => `
                      <tr>
                        <td>${cat.category}</td>
                        <td><span class="badge badge-${cat.level}">${cat.level}</span></td>
                        <td>${cat.score}/100</td>
                      </tr>
                    `,
                      )
                      .join("")}
                  </tbody>
                </table>
              </div>
            `
          }

          if (filteredData.value && filteredData.value.predictions) {
            htmlContent += `
              <div class="section">
                <h2>Value Predictions</h2>
                ${filteredData.value.marketTrends ? `<p><strong>Market Trends:</strong> ${filteredData.value.marketTrends}</p>` : ""}
                <table>
                  <thead>
                    <tr>
                      <th>Timeframe</th>
                      <th>Predicted Value</th>
                      <th>Confidence</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${filteredData.value.predictions
                      .map(
                        (pred: any) => `
                      <tr>
                        <td>${pred.timeframe}</td>
                        <td>$${pred.predictedValue.toLocaleString()}</td>
                        <td>${pred.confidence}%</td>
                      </tr>
                    `,
                      )
                      .join("")}
                  </tbody>
                </table>
              </div>
            `
          }

          if (filteredData.maintenance && filteredData.maintenance.predictions) {
            htmlContent += `
              <div class="section">
                <h2>Maintenance Forecast</h2>
                <p>${filteredData.maintenance.summary}</p>
                <table>
                  <thead>
                    <tr>
                      <th>Asset</th>
                      <th>Maintenance Type</th>
                      <th>Predicted Date</th>
                      <th>Estimated Cost</th>
                      <th>Urgency</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${filteredData.maintenance.predictions
                      .map(
                        (pred: any) => `
                      <tr>
                        <td>${pred.assetName}</td>
                        <td>${pred.maintenanceType}</td>
                        <td>${new Date(pred.predictedDate).toLocaleDateString()}</td>
                        <td>$${pred.estimatedCost.toLocaleString()}</td>
                        <td><span class="badge badge-${pred.urgency}">${pred.urgency}</span></td>
                      </tr>
                    `,
                      )
                      .join("")}
                  </tbody>
                </table>
              </div>
            `
          }

          htmlContent += `
              <div class="no-print" style="margin-top: 40px; text-align: center;">
                <button onclick="window.print()" style="padding: 12px 24px; background: #3b82f6; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 16px;">
                  Print / Save as PDF
                </button>
                <button onclick="window.close()" style="padding: 12px 24px; background: #6b7280; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 16px; margin-left: 10px;">
                  Close
                </button>
              </div>
            </body>
            </html>
          `

          printWindow.document.write(htmlContent)
          printWindow.document.close()
        }

        toast({
          title: "Report Ready",
          description: "Print dialog opened. Use Print to PDF to save.",
        })
      }
    } catch (error: any) {
      console.error("[v0] Export error:", error)
      toast({
        title: "Export Failed",
        description: error.message || "Failed to export report",
        variant: "destructive",
      })
    } finally {
      setExporting(false)
    }
  }

  const handleShare = async () => {
    if (!reportData) return

    try {
      const reportUrl = window.location.href
      await navigator.clipboard.writeText(reportUrl)

      toast({
        title: "Link Copied",
        description: "Report link copied to clipboard",
      })
    } catch (error) {
      toast({
        title: "Share Failed",
        description: "Failed to copy link to clipboard",
        variant: "destructive",
      })
    }
  }

  const handleEmailShare = () => {
    const subject = encodeURIComponent("AI Analytics Report")
    const body = encodeURIComponent(
      `I'd like to share this AI Analytics Report with you:\n\n${window.location.href}\n\nGenerated: ${new Date().toLocaleString()}`,
    )
    window.location.href = `mailto:?subject=${subject}&body=${body}`
  }

  if (loading && !reportData) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  if (error && !reportData) {
    return (
      <Alert variant="destructive">
        <XCircle className="h-4 w-4" />
        <AlertTitle>Failed to Load Report Data</AlertTitle>
        <AlertDescription>
          <p className="mb-4">{error}</p>
          <Button onClick={loadReportData} disabled={loading} variant="outline" size="sm">
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      {/* Report Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-6 w-6" />
                AI Analytics Report
              </CardTitle>
              <CardDescription className="mt-2">Comprehensive asset intelligence analysis and insights</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button onClick={loadReportData} disabled={loading} variant="outline" size="sm">
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>Generated: {new Date().toLocaleDateString()}</span>
            </div>
            <Separator orientation="vertical" className="h-4" />
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              <span>Asset Intelligence Platform</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Report Configuration</CardTitle>
          <CardDescription>Customize which sections to include in your report</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            {sections.map((section) => {
              const Icon = section.icon
              return (
                <div key={section.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={section.id}
                    checked={section.enabled}
                    onCheckedChange={() => toggleSection(section.id)}
                  />
                  <Label
                    htmlFor={section.id}
                    className="flex items-center gap-2 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    <Icon className="h-4 w-4" />
                    {section.name}
                  </Label>
                </div>
              )
            })}
          </div>

          <Separator />

          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <Label htmlFor="export-format">Export Format:</Label>
              <Select value={exportFormat} onValueChange={(value: any) => setExportFormat(value)}>
                <SelectTrigger id="export-format" className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF (Print)</SelectItem>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="json">JSON</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleExport} disabled={exporting || !reportData} className="gap-2">
                <Download className="h-4 w-4" />
                Export Report
              </Button>
              <Button onClick={handleShare} disabled={!reportData} variant="outline" className="gap-2 bg-transparent">
                <Link2 className="h-4 w-4" />
                Copy Link
              </Button>
              <Button
                onClick={handleEmailShare}
                disabled={!reportData}
                variant="outline"
                className="gap-2 bg-transparent"
              >
                <Mail className="h-4 w-4" />
                Email
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report Preview */}
      {reportData && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Report Preview</CardTitle>
              <CardDescription>Preview of the sections included in your report</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {sections.find((s) => s.id === "summary" && s.enabled) && reportData.summary && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold">Executive Summary</h3>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {reportData.summary.summary.replace(/^###\s*/, "").replace(/^\*\*(.*?)\*\*/, "$1")}
                  </p>
                </div>
              )}

              {sections.find((s) => s.id === "performance" && s.enabled) && reportData.performance && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold">Performance Analysis</h3>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-4xl font-bold text-primary">{reportData.performance.overallScore}</div>
                    <p className="text-sm text-muted-foreground">{reportData.performance.benchmarks.yourPosition}</p>
                  </div>
                </div>
              )}

              {sections.find((s) => s.id === "insights" && s.enabled) && reportData.insights && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold">AI Insights</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {reportData.insights.insights.length} insights identified
                  </p>
                </div>
              )}

              {sections.find((s) => s.id === "optimization" && s.enabled) && reportData.optimization && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    <h3 className="text-lg font-semibold">Optimization Opportunities</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-green-600" />
                    <span className="text-2xl font-bold text-green-600">
                      ${reportData.optimization.totalPotentialSavings.toLocaleString()}
                    </span>
                    <span className="text-sm text-muted-foreground">potential savings</span>
                  </div>
                </div>
              )}

              {sections.find((s) => s.id === "risk" && s.enabled) && reportData.risk && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-red-600" />
                    <h3 className="text-lg font-semibold">Risk Assessment</h3>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-4xl font-bold text-red-600">{reportData.risk.overallRiskScore}/100</div>
                    <p className="text-sm text-muted-foreground">
                      {reportData.risk.criticalRisks.length} critical risks identified
                    </p>
                  </div>
                </div>
              )}

              {sections.find((s) => s.id === "value" && s.enabled) && reportData.value && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold">Value Predictions</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {reportData.value.predictions?.length || 0} timeframe predictions
                  </p>
                </div>
              )}

              {sections.find((s) => s.id === "maintenance" && s.enabled) && reportData.maintenance && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Wrench className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold">Maintenance Forecast</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {reportData.maintenance.predictions?.length || 0} maintenance events predicted
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  )
}
