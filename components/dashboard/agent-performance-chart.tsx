"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

const data = [
  { time: "00:00", performance: 92, efficiency: 88 },
  { time: "04:00", performance: 94, efficiency: 91 },
  { time: "08:00", performance: 96, efficiency: 93 },
  { time: "12:00", performance: 95, efficiency: 94 },
  { time: "16:00", performance: 97, efficiency: 96 },
  { time: "20:00", performance: 94, efficiency: 92 },
]

export function AgentPerformanceChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Agent Performance</CardTitle>
        <CardDescription>Real-time performance and efficiency metrics</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" />
            <YAxis domain={[80, 100]} />
            <Tooltip formatter={(value) => [`${value}%`, ""]} />
            <Line
              type="monotone"
              dataKey="performance"
              stroke="hsl(var(--chart-1))"
              strokeWidth={2}
              name="Performance"
            />
            <Line type="monotone" dataKey="efficiency" stroke="hsl(var(--chart-2))" strokeWidth={2} name="Efficiency" />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
