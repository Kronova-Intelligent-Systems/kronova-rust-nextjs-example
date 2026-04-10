"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Database, Brain, Workflow, Activity, TrendingUp, Shield, DollarSign, Zap } from "lucide-react"
import { motion } from "framer-motion"

interface MetricsData {
  totalAssets: number
  activeAgents: number
  runningWorkflows: number
  systemHealth: number
  aiInsights: number
  criticalAlerts: number
  efficiency: number
  costSavings: number
}

interface EnhancedMetricsGridProps {
  data: MetricsData
}

const cardVariants = {
  hidden: { scale: 0.8, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15,
    },
  },
}

export function EnhancedMetricsGrid({ data }: EnhancedMetricsGridProps) {
  const metrics = [
    {
      title: "Total Assets",
      value: data.totalAssets.toLocaleString(),
      change: "+12%",
      changeType: "positive" as const,
      icon: Database,
      color: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-950/20",
    },
    {
      title: "Active AI Agents",
      value: data.activeAgents.toString(),
      change: "+2 new",
      changeType: "positive" as const,
      icon: Brain,
      color: "text-purple-600",
      bgColor: "bg-purple-50 dark:bg-purple-950/20",
    },
    {
      title: "Running Workflows",
      value: data.runningWorkflows.toString(),
      change: "5 scheduled",
      changeType: "neutral" as const,
      icon: Workflow,
      color: "text-green-600",
      bgColor: "bg-green-50 dark:bg-green-950/20",
    },
    {
      title: "System Health",
      value: `${data.systemHealth.toFixed(1)}%`,
      change: "Excellent",
      changeType: "positive" as const,
      icon: Activity,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50 dark:bg-emerald-950/20",
      showProgress: true,
      progressValue: data.systemHealth,
    },
    {
      title: "AI Insights",
      value: data.aiInsights.toString(),
      change: "+24 today",
      changeType: "positive" as const,
      icon: TrendingUp,
      color: "text-orange-600",
      bgColor: "bg-orange-50 dark:bg-orange-950/20",
    },
    {
      title: "Critical Alerts",
      value: data.criticalAlerts.toString(),
      change: "-2 resolved",
      changeType: data.criticalAlerts > 5 ? "negative" : ("positive" as const),
      icon: Shield,
      color: data.criticalAlerts > 5 ? "text-red-600" : "text-yellow-600",
      bgColor: data.criticalAlerts > 5 ? "bg-red-50 dark:bg-red-950/20" : "bg-yellow-50 dark:bg-yellow-950/20",
    },
    {
      title: "Efficiency Score",
      value: `${data.efficiency.toFixed(1)}%`,
      change: "+1.2%",
      changeType: "positive" as const,
      icon: Zap,
      color: "text-cyan-600",
      bgColor: "bg-cyan-50 dark:bg-cyan-950/20",
      showProgress: true,
      progressValue: data.efficiency,
    },
    {
      title: "Cost Savings",
      value: `$${data.costSavings}M`,
      change: "This month",
      changeType: "positive" as const,
      icon: DollarSign,
      color: "text-green-600",
      bgColor: "bg-green-50 dark:bg-green-950/20",
    },
  ]

  const getChangeColor = (type: "positive" | "negative" | "neutral") => {
    switch (type) {
      case "positive":
        return "text-green-600"
      case "negative":
        return "text-red-600"
      default:
        return "text-blue-600"
    }
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6">
      {metrics.map((metric, index) => (
        <motion.div
          key={metric.title}
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          transition={{ delay: index * 0.1 }}
        >
          <Card className="hover:shadow-lg transition-all duration-300 border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs lg:text-sm font-medium text-muted-foreground">{metric.title}</CardTitle>
              <div className={`p-2 rounded-lg ${metric.bgColor}`}>
                <metric.icon className={`h-3 w-3 lg:h-4 lg:w-4 ${metric.color}`} />
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-xl lg:text-2xl font-bold">{metric.value}</div>
              {metric.showProgress && <Progress value={metric.progressValue} className="h-1.5 lg:h-2" />}
              <p className="text-xs text-muted-foreground">
                <span className={getChangeColor(metric.changeType)}>{metric.change}</span>
                {metric.changeType === "positive" && " from last period"}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  )
}
