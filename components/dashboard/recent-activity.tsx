"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Brain, Database, Workflow, AlertTriangle, CheckCircle, Clock } from "lucide-react"

const activities = [
  {
    id: 1,
    type: "agent",
    title: "Asset Analyzer AI completed optimization",
    description: "Processed 150 assets, identified 12 optimization opportunities",
    time: "2 minutes ago",
    status: "success",
    icon: Brain,
  },
  {
    id: 2,
    type: "workflow",
    title: "Maintenance Workflow triggered",
    description: "Scheduled maintenance for 5 critical assets",
    time: "15 minutes ago",
    status: "pending",
    icon: Workflow,
  },
  {
    id: 3,
    type: "asset",
    title: "New asset registered",
    description: "Industrial Robot #IR-2024-001 added to inventory",
    time: "1 hour ago",
    status: "success",
    icon: Database,
  },
  {
    id: 4,
    type: "alert",
    title: "Performance threshold exceeded",
    description: "Asset #AS-1001 operating above normal parameters",
    time: "2 hours ago",
    status: "warning",
    icon: AlertTriangle,
  },
  {
    id: 5,
    type: "agent",
    title: "Predictive Maintenance AI updated",
    description: "Model retrained with latest sensor data",
    time: "3 hours ago",
    status: "success",
    icon: Brain,
  },
]

const getStatusIcon = (status: string) => {
  switch (status) {
    case "success":
      return <CheckCircle className="h-4 w-4 text-green-500" />
    case "warning":
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />
    case "pending":
      return <Clock className="h-4 w-4 text-blue-500" />
    default:
      return <CheckCircle className="h-4 w-4 text-gray-500" />
  }
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case "success":
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Complete</Badge>
    case "warning":
      return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Warning</Badge>
    case "pending":
      return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Pending</Badge>
    default:
      return <Badge variant="secondary">Unknown</Badge>
  }
}

export function RecentActivity() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Clock className="mr-2 h-5 w-5" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px]">
          <div className="space-y-4">
            {activities.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-muted/50">
                <div className="flex-shrink-0">
                  <activity.icon className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-foreground truncate">{activity.title}</p>
                    {getStatusIcon(activity.status)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{activity.description}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-muted-foreground">{activity.time}</span>
                    {getStatusBadge(activity.status)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
