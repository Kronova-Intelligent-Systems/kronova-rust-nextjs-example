"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts"
import { Activity, Wifi, AlertCircle, CheckCircle } from "lucide-react"
import { motion } from "framer-motion"
import { useEffect, useState, useMemo } from "react"

interface RealTimeData {
  totalAssets: number
  activeAgents: number
  runningWorkflows: number
  systemHealth: number
  aiInsights: number
  criticalAlerts: number
  efficiency: number
  costSavings: number
}

interface RealTimeMonitoringProps {
  data?: RealTimeData // Made data prop optional
}

export function RealTimeMonitoring({ data }: RealTimeMonitoringProps) {
  const safeData = useMemo(
    () =>
      data || {
        totalAssets: 0,
        activeAgents: 0,
        runningWorkflows: 0,
        systemHealth: 95,
        aiInsights: 0,
        criticalAlerts: 0,
        efficiency: 90,
        costSavings: 0,
      },
    [data],
  )

  const [chartData, setChartData] = useState<
    Array<{
      time: string
      health: number
      efficiency: number
      agents: number
    }>
  >([])

  useEffect(() => {
    const generateInitialData = () => {
      const now = new Date()
      const initialData = []

      for (let i = 23; i >= 0; i--) {
        const time = new Date(now.getTime() - i * 60 * 60 * 1000)
        initialData.push({
          time: time.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
          health: Math.max(90, Math.min(100, 95 + Math.random() * 5)),
          efficiency: Math.max(85, Math.min(98, 90 + Math.random() * 8)),
          agents: Math.floor(6 + Math.random() * 4),
        })
      }

      setChartData(initialData)
    }

    generateInitialData()

    const interval = setInterval(() => {
      setChartData((prev) => {
        const newData = [...prev.slice(1)]
        const now = new Date()
        newData.push({
          time: now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
          health: safeData.systemHealth,
          efficiency: safeData.efficiency,
          agents: safeData.activeAgents,
        })
        return newData
      })
    }, 30000) // Update every 30 seconds

    return () => clearInterval(interval)
  }, [safeData]) // Now safeData is memoized and won't cause infinite updates

  const systemStatus = useMemo(
    () => [
      {
        name: "API Gateway",
        status: "operational",
        latency: "12ms",
        icon: CheckCircle,
        color: "text-green-500",
      },
      {
        name: "Database Cluster",
        status: "operational",
        latency: "8ms",
        icon: CheckCircle,
        color: "text-green-500",
      },
      {
        name: "AI Processing",
        status: "operational",
        latency: "45ms",
        icon: CheckCircle,
        color: "text-green-500",
      },
      {
        name: "IoT Ingestion",
        status: safeData.criticalAlerts > 2 ? "degraded" : "operational",
        latency: "23ms",
        icon: safeData.criticalAlerts > 2 ? AlertCircle : CheckCircle,
        color: safeData.criticalAlerts > 2 ? "text-yellow-500" : "text-green-500",
      },
    ],
    [safeData.criticalAlerts],
  )

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 lg:gap-6">
      <motion.div
        className="xl:col-span-2"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="h-full">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center text-base lg:text-lg">
                <Activity className="mr-2 h-4 w-4 lg:h-5 lg:w-5" />
                Real-Time System Metrics
              </CardTitle>
              <p className="text-xs lg:text-sm text-muted-foreground mt-1">
                Live monitoring of system performance and health
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Wifi className="h-4 w-4 text-green-500" />
              <Badge variant="outline" className="text-xs">
                Live
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] lg:h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="healthGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="efficiencyGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="time" tick={{ fontSize: 12 }} interval="preserveStartEnd" />
                  <YAxis domain={[80, 100]} tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    formatter={(value: any, name: string) => [
                      `${value.toFixed(1)}${name === "agents" ? "" : "%"}`,
                      name === "health" ? "System Health" : name === "efficiency" ? "Efficiency" : "Active Agents",
                    ]}
                  />
                  <Area
                    type="monotone"
                    dataKey="health"
                    stroke="hsl(var(--chart-1))"
                    fillOpacity={1}
                    fill="url(#healthGradient)"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="efficiency"
                    stroke="hsl(var(--chart-2))"
                    fillOpacity={1}
                    fill="url(#efficiencyGradient)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="text-base lg:text-lg">System Status</CardTitle>
            <p className="text-xs lg:text-sm text-muted-foreground">Current status of all system components</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {systemStatus.map((system, index) => (
              <motion.div
                key={system.name}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="flex items-center gap-3">
                  <system.icon className={`h-4 w-4 ${system.color}`} />
                  <div>
                    <p className="text-sm font-medium">{system.name}</p>
                    <p className="text-xs text-muted-foreground">{system.latency} avg latency</p>
                  </div>
                </div>
                <Badge variant={system.status === "operational" ? "default" : "secondary"} className="text-xs">
                  {system.status}
                </Badge>
              </motion.div>
            ))}

            <div className="pt-4 border-t">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Overall Health</span>
                <span className="font-medium text-green-600">{safeData.systemHealth.toFixed(1)}%</span>{" "}
                {/* Using safeData */}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
