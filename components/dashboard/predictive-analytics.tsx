"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { TrendingUp, AlertTriangle, Target, Calendar, DollarSign } from "lucide-react"
import { motion } from "framer-motion"
import { Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ComposedChart, Bar } from "recharts"

const predictiveData = [
  { month: "Jan", actual: 2400, predicted: 2380, maintenance: 180, efficiency: 94 },
  { month: "Feb", actual: 2600, predicted: 2620, maintenance: 160, efficiency: 95 },
  { month: "Mar", actual: 2800, predicted: 2790, maintenance: 140, efficiency: 96 },
  { month: "Apr", actual: 2750, predicted: 2760, maintenance: 200, efficiency: 93 },
  { month: "May", actual: 2900, predicted: 2880, maintenance: 120, efficiency: 97 },
  { month: "Jun", actual: null, predicted: 3100, maintenance: 100, efficiency: 98 },
  { month: "Jul", actual: null, predicted: 3200, maintenance: 90, efficiency: 98 },
  { month: "Aug", actual: null, predicted: 3300, maintenance: 85, efficiency: 99 },
]

const riskAssessments = [
  {
    asset: "Data Center Alpha",
    riskLevel: "Medium",
    probability: 35,
    impact: "High",
    timeframe: "3-6 months",
    mitigation: "Upgrade cooling system",
    cost: "$125K",
  },
  {
    asset: "Vehicle Fleet Beta",
    riskLevel: "Low",
    probability: 15,
    impact: "Medium",
    timeframe: "6-12 months",
    mitigation: "Preventive maintenance",
    cost: "$45K",
  },
  {
    asset: "IoT Sensor Network",
    riskLevel: "High",
    probability: 65,
    impact: "Critical",
    timeframe: "1-3 months",
    mitigation: "Hardware replacement",
    cost: "$280K",
  },
]

const optimizationOpportunities = [
  {
    title: "Energy Consumption Optimization",
    description: "Reduce data center energy usage by 22% through AI-driven cooling optimization",
    savings: "$340K/year",
    implementation: "2-3 months",
    confidence: 89,
  },
  {
    title: "Route Optimization",
    description: "Optimize delivery routes to reduce fuel consumption and improve efficiency",
    savings: "$180K/year",
    implementation: "1 month",
    confidence: 94,
  },
  {
    title: "Predictive Maintenance",
    description: "Implement AI-driven maintenance scheduling to reduce downtime by 35%",
    savings: "$520K/year",
    implementation: "4-6 months",
    confidence: 87,
  },
]

export function PredictiveAnalytics() {
  const getRiskColor = (level: string) => {
    switch (level) {
      case "High":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
      case "Medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400"
      default:
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
    }
  }

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Predictive Performance Chart */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-base lg:text-lg">
              <TrendingUp className="mr-2 h-4 w-4 lg:h-5 lg:w-5" />
              Predictive Performance Analysis
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              AI-powered predictions vs actual performance with maintenance forecasting
            </p>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] lg:h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={predictiveData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    formatter={(value: any, name: string) => [
                      name === "efficiency" ? `${value}%` : name === "maintenance" ? `$${value}K` : `$${value}K`,
                      name === "actual"
                        ? "Actual Performance"
                        : name === "predicted"
                          ? "Predicted Performance"
                          : name === "maintenance"
                            ? "Maintenance Cost"
                            : "Efficiency Score",
                    ]}
                  />
                  <Bar yAxisId="right" dataKey="maintenance" fill="hsl(var(--chart-4))" opacity={0.6} />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="actual"
                    stroke="hsl(var(--chart-1))"
                    strokeWidth={3}
                    dot={{ r: 4 }}
                  />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="predicted"
                    stroke="hsl(var(--chart-2))"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={{ r: 3 }}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="efficiency"
                    stroke="hsl(var(--chart-3))"
                    strokeWidth={2}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6">
        {/* Risk Assessment */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center text-base lg:text-lg">
                <AlertTriangle className="mr-2 h-4 w-4 lg:h-5 lg:w-5" />
                Risk Assessment
              </CardTitle>
              <p className="text-sm text-muted-foreground">AI-powered risk analysis and mitigation strategies</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {riskAssessments.map((risk, index) => (
                  <motion.div
                    key={risk.asset}
                    className="p-4 rounded-lg border bg-muted/20"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-sm">{risk.asset}</h4>
                      <Badge className={`text-xs ${getRiskColor(risk.riskLevel)}`}>{risk.riskLevel} Risk</Badge>
                    </div>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Probability:</span>
                        <div className="flex items-center gap-2">
                          <Progress value={risk.probability} className="h-1.5 w-16" />
                          <span className="font-medium">{risk.probability}%</span>
                        </div>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Impact:</span>
                        <span className="font-medium">{risk.impact}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Timeframe:</span>
                        <span className="font-medium">{risk.timeframe}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Mitigation:</span>
                        <span className="font-medium">{risk.mitigation}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Est. Cost:</span>
                        <span className="font-medium text-orange-600">{risk.cost}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Optimization Opportunities */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center text-base lg:text-lg">
                <Target className="mr-2 h-4 w-4 lg:h-5 lg:w-5" />
                Optimization Opportunities
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                AI-identified opportunities for performance and cost optimization
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {optimizationOpportunities.map((opportunity, index) => (
                  <motion.div
                    key={opportunity.title}
                    className="p-4 rounded-lg border bg-muted/20"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h4 className="font-semibold text-sm">{opportunity.title}</h4>
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3 text-green-600" />
                        <span className="text-xs font-medium text-green-600">{opportunity.savings}</span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mb-3 text-pretty">{opportunity.description}</p>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Implementation:</span>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3 w-3" />
                          <span className="font-medium">{opportunity.implementation}</span>
                        </div>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Confidence:</span>
                        <div className="flex items-center gap-2">
                          <Progress value={opportunity.confidence} className="h-1.5 w-16" />
                          <span className="font-medium">{opportunity.confidence}%</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
