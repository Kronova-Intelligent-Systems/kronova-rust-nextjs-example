"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Workflow,
  Play,
  Pause,
  Settings,
  MoreVertical,
  Clock,
  CheckCircle,
  AlertTriangle,
  FileText,
  Zap,
} from "lucide-react"

interface WorkflowStep {
  id: string
  name: string
  type: string
  status: string
}

interface WorkflowData {
  id: string
  name: string
  description: string
  status: "active" | "inactive" | "draft"
  lastRun: string
  nextRun: string
  successRate: number
  totalRuns: number
  avgDuration: string
  steps: WorkflowStep[]
  triggers: string[]
}

interface WorkflowCardProps {
  workflow: WorkflowData
}

export function WorkflowCard({ workflow }: WorkflowCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 hover:bg-green-100"
      case "draft":
        return "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
      case "inactive":
        return "bg-red-100 text-red-800 hover:bg-red-100"
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-100"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <Play className="h-3 w-3" />
      case "draft":
        return <FileText className="h-3 w-3" />
      case "inactive":
        return <Pause className="h-3 w-3" />
      default:
        return <Clock className="h-3 w-3" />
    }
  }

  const getStepIcon = (type: string) => {
    switch (type) {
      case "ai-analysis":
        return "🧠"
      case "ml-model":
        return "🤖"
      case "automation":
        return "⚙️"
      case "notification":
        return "📧"
      case "security":
        return "🔒"
      case "validation":
        return "✅"
      case "reporting":
        return "📊"
      case "data-collection":
        return "📥"
      case "calculation":
        return "🧮"
      case "monitoring":
        return "👁️"
      case "planning":
        return "📋"
      case "data-entry":
        return "📝"
      default:
        return "⚡"
    }
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Workflow className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">{workflow.name}</CardTitle>
              <p className="text-sm text-muted-foreground line-clamp-1">{workflow.description}</p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                Configure
              </DropdownMenuItem>
              <DropdownMenuItem>
                {workflow.status === "active" ? (
                  <>
                    <Pause className="mr-2 h-4 w-4" />
                    Pause
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    Start
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Zap className="mr-2 h-4 w-4" />
                Run Now
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Badge className={getStatusColor(workflow.status)}>
            {getStatusIcon(workflow.status)}
            <span className="ml-1 capitalize">{workflow.status}</span>
          </Badge>
          <div className="flex space-x-1">
            {workflow.triggers.map((trigger) => (
              <Badge key={trigger} variant="outline" className="text-xs">
                {trigger}
              </Badge>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Last Run:</span>
            <p className="font-medium">{workflow.lastRun}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Next Run:</span>
            <p className="font-medium">{workflow.nextRun}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Total Runs:</span>
            <p className="font-medium">{workflow.totalRuns.toLocaleString()}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Avg Duration:</span>
            <p className="font-medium">{workflow.avgDuration}</p>
          </div>
        </div>

        {workflow.totalRuns > 0 && (
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Success Rate</span>
              <span className="font-medium">{workflow.successRate}%</span>
            </div>
            <Progress value={workflow.successRate} />
          </div>
        )}

        <div className="space-y-2">
          <h4 className="text-sm font-medium">Workflow Steps</h4>
          <div className="space-y-1">
            {workflow.steps.slice(0, 3).map((step, index) => (
              <div key={step.id} className="flex items-center space-x-2 text-sm">
                <span className="text-lg">{getStepIcon(step.type)}</span>
                <span className="flex-1 truncate">{step.name}</span>
                {step.status === "completed" ? (
                  <CheckCircle className="h-3 w-3 text-green-500" />
                ) : step.status === "pending" ? (
                  <Clock className="h-3 w-3 text-yellow-500" />
                ) : (
                  <AlertTriangle className="h-3 w-3 text-red-500" />
                )}
              </div>
            ))}
            {workflow.steps.length > 3 && (
              <p className="text-xs text-muted-foreground">+{workflow.steps.length - 3} more steps</p>
            )}
          </div>
        </div>

        <div className="flex space-x-2 pt-2">
          <Button size="sm" className="flex-1">
            <Settings className="mr-2 h-3 w-3" />
            Configure
          </Button>
          <Button size="sm" variant="outline" className="flex-1 bg-transparent">
            <Zap className="mr-2 h-3 w-3" />
            Run Now
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
