"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

const data = [
  { name: "Jan", assets: 1100, value: 2400000 },
  { name: "Feb", assets: 1150, value: 2600000 },
  { name: "Mar", assets: 1200, value: 2800000 },
  { name: "Apr", assets: 1180, value: 2750000 },
  { name: "May", assets: 1220, value: 2900000 },
  { name: "Jun", assets: 1247, value: 3100000 },
]

export function AssetOverviewChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Asset Growth</CardTitle>
        <CardDescription>Monthly asset count and total value</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted/20" />
            <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" style={{ fontSize: "12px" }} />
            <YAxis stroke="hsl(var(--muted-foreground))" style={{ fontSize: "12px" }} />
            <Tooltip
              formatter={(value, name) => [
                name === "assets" ? value : `$${(value as number).toLocaleString()}`,
                name === "assets" ? "Assets" : "Total Value",
              ]}
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "0.5rem",
                color: "hsl(var(--foreground))",
              }}
            />
            <Bar dataKey="assets" fill="hsl(var(--chart-1))" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
