"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts"

const performanceData = [
  { time: "00:00", analyzer: 94, predictive: 92, workflow: 87, security: 96, cost: 89, performance: 93 },
  { time: "04:00", analyzer: 95, predictive: 91, workflow: 88, security: 97, cost: 90, performance: 94 },
  { time: "08:00", analyzer: 96, predictive: 93, workflow: 89, security: 96, cost: 91, performance: 95 },
  { time: "12:00", analyzer: 94, predictive: 94, workflow: 87, security: 98, cost: 88, performance: 92 },
  { time: "16:00", analyzer: 97, predictive: 92, workflow: 90, security: 97, cost: 92, performance: 96 },
  { time: "20:00", analyzer: 95, predictive: 90, workflow: 86, security: 95, cost: 87, performance: 94 },
]

const taskData = [
  { time: "00:00", completed: 1200, failed: 15, pending: 45 },
  { time: "04:00", completed: 1350, failed: 12, pending: 38 },
  { time: "08:00", completed: 1580, failed: 18, pending: 52 },
  { time: "12:00", completed: 1720, failed: 22, pending: 41 },
  { time: "16:00", completed: 1890, failed: 16, pending: 35 },
  { time: "20:00", completed: 2100, failed: 19, pending: 48 },
]

export function AgentMetricsChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Agent Performance Metrics</CardTitle>
        <CardDescription>Real-time performance tracking across all AI agents</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="performance" className="space-y-4">
          <TabsList>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="tasks">Task Completion</TabsTrigger>
          </TabsList>

          <TabsContent value="performance" className="space-y-4">
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted/20" />
                <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" style={{ fontSize: "12px" }} />
                <YAxis
                  domain={[80, 100]}
                  stroke="hsl(var(--muted-foreground))"
                  style={{ fontSize: "12px" }}
                />
                <Tooltip
                  formatter={(value) => [`${value}%`, ""]}
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "0.5rem",
                    color: "hsl(var(--foreground))",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="analyzer"
                  stroke="hsl(var(--chart-1))"
                  strokeWidth={2}
                  name="Asset Analyzer"
                  dot={{ fill: "hsl(var(--chart-1))", r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="predictive"
                  stroke="hsl(var(--chart-2))"
                  strokeWidth={2}
                  name="Predictive AI"
                  dot={{ fill: "hsl(var(--chart-2))", r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="workflow"
                  stroke="hsl(var(--chart-3))"
                  strokeWidth={2}
                  name="Workflow Optimizer"
                  dot={{ fill: "hsl(var(--chart-3))", r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="security"
                  stroke="hsl(var(--chart-4))"
                  strokeWidth={2}
                  name="Security Monitor"
                  dot={{ fill: "hsl(var(--chart-4))", r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="cost"
                  stroke="hsl(var(--chart-5))"
                  strokeWidth={2}
                  name="Cost Optimizer"
                  dot={{ fill: "hsl(var(--chart-5))", r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </TabsContent>

          <TabsContent value="tasks" className="space-y-4">
            <ResponsiveContainer width="100%" height={400}>
              <AreaChart data={taskData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted/20" />
                <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" style={{ fontSize: "12px" }} />
                <YAxis stroke="hsl(var(--muted-foreground))" style={{ fontSize: "12px" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "0.5rem",
                    color: "hsl(var(--foreground))",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="completed"
                  stackId="1"
                  stroke="hsl(var(--chart-1))"
                  fill="hsl(var(--chart-1))"
                  fillOpacity={0.6}
                  name="Completed"
                />
                <Area
                  type="monotone"
                  dataKey="pending"
                  stackId="1"
                  stroke="hsl(var(--chart-3))"
                  fill="hsl(var(--chart-3))"
                  fillOpacity={0.6}
                  name="Pending"
                />
                <Area
                  type="monotone"
                  dataKey="failed"
                  stackId="1"
                  stroke="hsl(var(--chart-5))"
                  fill="hsl(var(--chart-5))"
                  fillOpacity={0.6}
                  name="Failed"
                />
              </AreaChart>
            </ResponsiveContainer>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
