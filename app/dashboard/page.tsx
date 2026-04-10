"use client"

import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Database, AlertTriangle, CheckCircle, Clock, Zap, BarChart3, Brain } from "lucide-react"
import { AssetOverviewChart } from "@/components/dashboard/asset-overview-chart"
import { AgentPerformanceChart } from "@/components/dashboard/agent-performance-chart"
import { RecentActivity } from "@/components/dashboard/recent-activity"
import { AssetManagement } from "@/components/dashboard/asset-management"
import { AIAgents } from "@/components/dashboard/ai-agents"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { motion } from "framer-motion"
import { useEffect, useState } from "react"
import { EnhancedMetricsGrid } from "@/components/dashboard/enhanced-metrics-grid"
import { AIInsightsDashboard } from "@/components/dashboard/ai-insights-dashboard"
import { RealTimeMonitoring } from "@/components/dashboard/real-time-monitoring"
import { PredictiveAnalytics } from "@/components/dashboard/predictive-analytics"
import { AIRequestLogsDashboard } from "@/components/dashboard/ai-request-logs-dashboard"

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 100,
    },
  },
}

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [realTimeData, setRealTimeData] = useState({
    totalAssets: 15247,
    activeAgents: 8,
    runningWorkflows: 23,
    systemHealth: 98.5,
    aiInsights: 142,
    criticalAlerts: 3,
    efficiency: 94.2,
    costSavings: 2.4,
  })

  useEffect(() => {
    const fetchUser = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUser(user)
    }
    fetchUser()

    // Simulate real-time updates
    const interval = setInterval(() => {
      setRealTimeData((prev) => ({
        ...prev,
        systemHealth: Math.max(95, Math.min(100, prev.systemHealth + (Math.random() - 0.5) * 2)),
        efficiency: Math.max(90, Math.min(98, prev.efficiency + (Math.random() - 0.5) * 1)),
        activeAgents: prev.activeAgents + Math.floor(Math.random() * 3) - 1,
        runningWorkflows: Math.max(0, prev.runningWorkflows + Math.floor(Math.random() * 5) - 2),
      }))
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  const assetsByType = {
    datacenters: 1089,
    vehicles: 8598,
    iotSensors: 5560,
  }

  const agentMetrics = {
    performance: realTimeData.efficiency,
    uptime: 99.8,
    tasksCompleted: 15420,
  }

  return (
    <motion.div
      className="space-y-4 lg:space-y-6 p-2 lg:p-0"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Welcome Section */}
      <motion.div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4" variants={itemVariants}>
        <div className="space-y-1">
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground text-balance">
            Welcome back, {user?.user_metadata?.full_name || "User"}
          </h1>
          <p className="text-sm lg:text-base text-muted-foreground text-pretty">
            Here's what's happening with your assets and AI agents.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button className="w-full sm:w-auto">
            <Zap className="mr-2 h-4 w-4" />
            Quick Action
          </Button>
          <Button variant="outline" className="w-full sm:w-auto bg-transparent">
            <BarChart3 className="mr-2 h-4 w-4" />
            Generate Report
          </Button>
        </div>
      </motion.div>

      {/* Enhanced Metrics Grid */}
      <motion.div variants={itemVariants}>
        <EnhancedMetricsGrid data={realTimeData} />
      </motion.div>

      <Tabs defaultValue="overview" className="space-y-4 lg:space-y-6">
        <motion.div variants={itemVariants}>
          <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6 h-auto">
            <TabsTrigger value="overview" className="text-xs lg:text-sm">
              Overview
            </TabsTrigger>
            <TabsTrigger value="ai-logs" className="text-xs lg:text-sm">
              AI Logs
            </TabsTrigger>
            <TabsTrigger value="assets" className="text-xs lg:text-sm">
              Assets
            </TabsTrigger>
            <TabsTrigger value="agents" className="text-xs lg:text-sm">
              AI Agents
            </TabsTrigger>
            <TabsTrigger value="analytics" className="text-xs lg:text-sm">
              Analytics
            </TabsTrigger>
            <TabsTrigger value="insights" className="text-xs lg:text-sm">
              AI Insights
            </TabsTrigger>
          </TabsList>
        </motion.div>

        <TabsContent value="ai-logs" className="space-y-4 lg:space-y-6">
          <motion.div
            variants={itemVariants}
            initial="hidden"
            animate="visible"
          >
            <AIRequestLogsDashboard />
          </motion.div>
        </TabsContent>

        <TabsContent value="overview" className="space-y-4 lg:space-y-6">
          {/* Real-time Monitoring */}
          <motion.div variants={itemVariants}>
            <RealTimeMonitoring data={realTimeData} />
          </motion.div>

          {/* Charts and Analytics */}
          <motion.div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6" variants={itemVariants}>
            <AssetOverviewChart />
            <AgentPerformanceChart />
          </motion.div>

          {/* Status Overview */}
          <motion.div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6" variants={itemVariants}>
            <Card className="hover:shadow-lg transition-all duration-300">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center text-base lg:text-lg">
                  <Database className="mr-2 h-4 w-4 lg:h-5 lg:w-5" />
                  Asset Distribution
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <CheckCircle className="mr-2 h-4 w-4 text-blue-500" />
                    <span className="text-sm">Data Centers</span>
                  </div>
                  <Badge variant="secondary">{assetsByType.datacenters.toLocaleString()}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Clock className="mr-2 h-4 w-4 text-green-500" />
                    <span className="text-sm">Vehicle Fleet</span>
                  </div>
                  <Badge variant="secondary">{assetsByType.vehicles.toLocaleString()}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <AlertTriangle className="mr-2 h-4 w-4 text-purple-500" />
                    <span className="text-sm">IoT Sensors</span>
                  </div>
                  <Badge variant="secondary">{assetsByType.iotSensors.toLocaleString()}</Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-all duration-300">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center text-base lg:text-lg">
                  <Brain className="mr-2 h-4 w-4 lg:h-5 lg:w-5" />
                  AI Agent Metrics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Performance Score</span>
                    <span className="font-medium">{agentMetrics.performance.toFixed(1)}%</span>
                  </div>
                  <Progress value={agentMetrics.performance} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Uptime</span>
                    <span className="font-medium">{agentMetrics.uptime}%</span>
                  </div>
                  <Progress value={agentMetrics.uptime} className="h-2" />
                </div>
                <div className="flex justify-between text-sm">
                  <span>Tasks Completed</span>
                  <span className="font-medium">{agentMetrics.tasksCompleted.toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>

            <div className="lg:col-span-2 xl:col-span-1">
              <RecentActivity />
            </div>
          </motion.div>
        </TabsContent>

        <TabsContent value="assets" className="space-y-4 lg:space-y-6">
          <motion.div
            variants={itemVariants}
            initial="hidden"
            animate="visible"
          >
            <AssetManagement />
          </motion.div>
        </TabsContent>

        <TabsContent value="agents" className="space-y-4 lg:space-y-6">
          <motion.div
            variants={itemVariants}
            initial="hidden"
            animate="visible"
          >
            <AIAgents />
          </motion.div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4 lg:space-y-6">
          <motion.div
            variants={itemVariants}
            initial="hidden"
            animate="visible"
          >
            <PredictiveAnalytics />
          </motion.div>

          <motion.div
            className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6"
            variants={itemVariants}
            initial="hidden"
            animate="visible"
          >
            <AssetOverviewChart />
            <AgentPerformanceChart />
          </motion.div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4 lg:space-y-6">
          <motion.div
            variants={itemVariants}
            initial="hidden"
            animate="visible"
          >
            <AIInsightsDashboard />
          </motion.div>
        </TabsContent>
      </Tabs>
    </motion.div>
  )
}
