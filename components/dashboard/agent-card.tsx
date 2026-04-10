"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Brain, Play, Pause, Settings, MoreVertical, Activity, Clock, CheckCircle } from "lucide-react"
import { RunAgentDialog } from "./run-agent-dialog"

interface Agent {
  id: string
  name: string
  type: string
  status: "active" | "inactive" | "training"
  performance: number
  uptime: number
  tasksCompleted: number
  lastActive: string
  description: string
  configuration: Record<string, any>
}

interface AgentCardProps {
  agent: Agent
}

export function AgentCard({ agent }: AgentCardProps) {
  const [showRunDialog, setShowRunDialog] = useState(false)

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 hover:bg-green-100"
      case "training":
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
        return <CheckCircle className="h-3 w-3" />
      case "training":
        return <Activity className="h-3 w-3" />
      case "inactive":
        return <Pause className="h-3 w-3" />
      default:
        return <Clock className="h-3 w-3" />
    }
  }

  return (
    <>
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Brain className="h-4 w-4 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">{agent.name}</CardTitle>
                <p className="text-sm text-muted-foreground">{agent.type}</p>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setShowRunDialog(true)}>
                  <Play className="mr-2 h-4 w-4" />
                  Run Agent
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  Configure
                </DropdownMenuItem>
                <DropdownMenuItem>
                  {agent.status === "active" ? (
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
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Badge className={getStatusColor(agent.status)}>
              {getStatusIcon(agent.status)}
              <span className="ml-1 capitalize">{agent.status}</span>
            </Badge>
            <span className="text-xs text-muted-foreground">{agent.lastActive}</span>
          </div>

          <p className="text-sm text-muted-foreground line-clamp-2">{agent.description}</p>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Performance</span>
                <span className="font-medium">{agent.performance}%</span>
              </div>
              <Progress value={agent.performance} />
            </div>

            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Uptime</span>
                <span className="font-medium">{agent.uptime}%</span>
              </div>
              <Progress value={agent.uptime} />
            </div>

            <div className="flex justify-between text-sm">
              <span>Tasks Completed</span>
              <span className="font-medium">{agent.tasksCompleted.toLocaleString()}</span>
            </div>
          </div>

          <div className="flex space-x-2 pt-2">
            <Button size="sm" className="flex-1" onClick={() => setShowRunDialog(true)}>
              <Play className="mr-2 h-3 w-3" />
              Run
            </Button>
            <Button size="sm" variant="outline" className="flex-1 bg-transparent">
              <Activity className="mr-2 h-3 w-3" />
              Monitor
            </Button>
          </div>
        </CardContent>
      </Card>

      <RunAgentDialog
        open={showRunDialog}
        onOpenChange={setShowRunDialog}
        agent={{
          id: agent.id,
          name: agent.name,
          description: agent.description,
        }}
      />
    </>
  )
}
