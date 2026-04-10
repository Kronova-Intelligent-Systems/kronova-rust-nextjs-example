"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Brain, TrendingUp, AlertTriangle, Lightbulb, Target, Zap, Eye, ThumbsUp } from "lucide-react"
import { motion } from "framer-motion"
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts"

const insightCategories = [
  { name: "Performance", value: 35, color: "hsl(var(--chart-1))" },
  { name: "Cost Optimization", value: 28, color: "hsl(var(--chart-2))" },
  { name: "Predictive Maintenance", value: 22, color: "hsl(var(--chart-3))" },
  { name: "Security", value: 15, color: "hsl(var(--chart-4))" },
]

const weeklyInsights = [
  { day: "Mon", insights: 18, implemented: 12 },
  { day: "Tue", insights: 22, implemented: 16 },
  { day: "Wed", insights: 25, implemented: 19 },
  { day: "Thu", insights: 20, implemented: 15 },
  { day: "Fri", insights: 28, implemented: 22 },
  { day: "Sat", insights: 15, implemented: 10 },
  { day: "Sun", insights: 12, implemented: 8 },
]

const aiInsights = [
  {
    id: 1,
    title: "Asset Utilization Optimization",
    description: "Vehicle fleet #VF-2024 showing 23% underutilization. Recommend route optimization.",
    category: "Performance",
    priority: "high",
    confidence: 94,
    impact: "High",
    savings: "$45K/month",
    icon: Target,
    status: "new",
  },
  {
    id: 2,
    title: "Predictive Maintenance Alert",
    description: "Industrial equipment #IE-1001 requires maintenance in 5-7 days based on vibration patterns.",
    category: "Maintenance",
    priority: "medium",
    confidence: 87,
    impact: "Medium",
    savings: "$12K",
    icon: AlertTriangle,
    status: "reviewing",
  },
  {
    id: 3,
    title: "Energy Efficiency Opportunity",
    description: "Data center cooling system can be optimized to reduce energy consumption by 18%.",
    category: "Cost",
    priority: "medium",
    confidence: 91,
    impact: "High",
    savings: "$28K/month",
    icon: Zap,
    status: "implemented",
  },
  {
    id: 4,
    title: "Security Anomaly Detection",
    description: "Unusual access patterns detected in asset management system. Recommend security review.",
    category: "Security",
    priority: "high",
    confidence: 96,
    impact: "Critical",
    savings: "Risk mitigation",
    icon: AlertTriangle,
    status: "new",
  },
]

export function AIInsightsDashboard() {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
      case "medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400"
      default:
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "implemented":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
      case "reviewing":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400"
    }
  }

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* AI Insights Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-base lg:text-lg">
                <Brain className="mr-2 h-4 w-4 lg:h-5 lg:w-5" />
                Insight Categories
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={insightCategories}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {insightCategories.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value}%`, "Insights"]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2 mt-4">
                {insightCategories.map((category) => (
                  <div key={category.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: category.color }} />
                      <span>{category.name}</span>
                    </div>
                    <span className="font-medium">{category.value}%</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="lg:col-span-2"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-base lg:text-lg">
                <TrendingUp className="mr-2 h-4 w-4 lg:h-5 lg:w-5" />
                Weekly Insights & Implementation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyInsights}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Bar dataKey="insights" fill="hsl(var(--chart-1))" name="Generated" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="implemented" fill="hsl(var(--chart-2))" name="Implemented" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* AI Insights List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center text-base lg:text-lg">
                <Lightbulb className="mr-2 h-4 w-4 lg:h-5 lg:w-5" />
                Latest AI Insights
              </div>
              <Badge variant="outline" className="text-xs">
                {aiInsights.length} Active
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {aiInsights.map((insight, index) => (
                <motion.div
                  key={insight.id}
                  className="p-4 rounded-lg border bg-card hover:shadow-md transition-all duration-300"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="p-2 rounded-lg bg-muted">
                        <insight.icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold text-sm lg:text-base">{insight.title}</h4>
                          <Badge className={`text-xs ${getPriorityColor(insight.priority)}`}>{insight.priority}</Badge>
                          <Badge className={`text-xs ${getStatusColor(insight.status)}`}>{insight.status}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3 text-pretty">{insight.description}</p>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                          <div>
                            <span className="text-muted-foreground">Confidence:</span>
                            <div className="flex items-center gap-2 mt-1">
                              <Progress value={insight.confidence} className="h-1.5 flex-1" />
                              <span className="font-medium">{insight.confidence}%</span>
                            </div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Impact:</span>
                            <p className="font-medium mt-1">{insight.impact}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Potential Savings:</span>
                            <p className="font-medium mt-1 text-green-600">{insight.savings}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Category:</span>
                            <p className="font-medium mt-1">{insight.category}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button size="sm" variant="outline" className="text-xs bg-transparent">
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </Button>
                      {insight.status === "new" && (
                        <Button size="sm" className="text-xs">
                          <ThumbsUp className="h-3 w-3 mr-1" />
                          Implement
                        </Button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
