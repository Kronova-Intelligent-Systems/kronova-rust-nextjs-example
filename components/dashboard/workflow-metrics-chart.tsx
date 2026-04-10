"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts"

const executionData = [
  { time: "00:00", successful: 45, failed: 2, pending: 8 },
  { time: "04:00", successful: 52, failed: 1, pending: 5 },
  { time: "08:00", successful: 68, failed: 3, pending: 12 },
  { time: "12:00", successful: 74, failed: 2, pending: 9 },
  { time: "16:00", successful: 81, failed: 4, pending: 15 },
  { time: "20:00", successful: 63, failed: 1, pending: 7 },
]

const performanceData = [
  { date: "Mon", avgDuration: 12.5, successRate: 94.2 },
  { date: "Tue", avgDuration: 11.8, successRate: 96.1 },
  { date: "Wed", avgDuration: 13.2, successRate: 92.8 },
  { date: "Thu", avgDuration: 10.9, successRate: 97.3 },
  { date: "Fri", avgDuration: 12.1, successRate: 95.6 },
  { date: "Sat", avgDuration: 14.3, successRate: 91.4 },
  { date: "Sun", avgDuration: 11.5, successRate: 98.1 },
]

export function WorkflowMetricsChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Workflow Performance Metrics</CardTitle>
        <CardDescription>Real-time execution and performance tracking</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="execution" className="space-y-4">
          <TabsList>
            <TabsTrigger value="execution">Execution Status</TabsTrigger>
            <TabsTrigger value="performance">Performance Trends</TabsTrigger>
          </TabsList>

          <TabsContent value="execution" className="space-y-4">
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={executionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="successful" fill="hsl(var(--chart-1))" name="Successful" />
                <Bar dataKey="failed" fill="hsl(var(--chart-5))" name="Failed" />
                <Bar dataKey="pending" fill="hsl(var(--chart-3))" name="Pending" />
              </BarChart>
            </ResponsiveContainer>
          </TabsContent>

          <TabsContent value="performance" className="space-y-4">
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis yAxisId="left" domain={[8, 16]} />
                <YAxis yAxisId="right" orientation="right" domain={[85, 100]} />
                <Tooltip
                  formatter={(value, name) => [
                    name === "avgDuration" ? `${value} min` : `${value}%`,
                    name === "avgDuration" ? "Avg Duration" : "Success Rate",
                  ]}
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="avgDuration"
                  stroke="hsl(var(--chart-2))"
                  strokeWidth={2}
                  name="avgDuration"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="successRate"
                  stroke="hsl(var(--chart-1))"
                  strokeWidth={2}
                  name="successRate"
                />
              </LineChart>
            </ResponsiveContainer>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
