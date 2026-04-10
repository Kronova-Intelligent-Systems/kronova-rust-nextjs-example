"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Brain, Workflow, Clock, CheckCircle, XCircle, Loader2, RefreshCw, Eye } from "lucide-react"
import { apiClient } from "@/lib/api-client"
import { toast } from "sonner"

interface AgentExecution {
  id: string
  agent_id: string
  input_data: any
  status: string
  created_at: string
  updated_at: string
  ai_agents?: {
    name: string
  }
}

interface WorkflowRun {
  id: string
  workflow_id: string
  status: string
  start_time: string
  end_time?: string
  results: any
  error?: string
  created_at: string
  ai_workflows?: {
    name: string
    description?: string
  }
}

export function ExecutionHistory() {
  const [agentExecutions, setAgentExecutions] = useState<AgentExecution[]>([])
  const [workflowRuns, setWorkflowRuns] = useState<WorkflowRun[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const loadExecutionHistory = async () => {
    try {
      const [agentResponse, workflowResponse] = await Promise.all([
        apiClient.getAgentExecutions({ limit: 50 }),
        apiClient.getWorkflowRuns({ limit: 50 }),
      ])

      if (agentResponse.success) {
        setAgentExecutions(agentResponse.data || [])
      }

      if (workflowResponse.success) {
        setWorkflowRuns(workflowResponse.data || [])
      }
    } catch (error) {
      console.error("[v0] Error loading execution history:", error)
      toast.error("Failed to load execution history")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadExecutionHistory()
  }, [])

  const handleRefresh = () => {
    setRefreshing(true)
    loadExecutionHistory()
  }

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return (
          <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
            <CheckCircle className="h-3 w-3 mr-1" />
            Completed
          </Badge>
        )
      case "failed":
        return (
          <Badge className="bg-red-500/10 text-red-500 border-red-500/20">
            <XCircle className="h-3 w-3 mr-1" />
            Failed
          </Badge>
        )
      case "running":
        return (
          <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            Running
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const formatDuration = (start: string, end?: string) => {
    if (!end) return "In progress"
    const duration = new Date(end).getTime() - new Date(start).getTime()
    if (duration < 1000) return `${duration}ms`
    if (duration < 60000) return `${(duration / 1000).toFixed(1)}s`
    return `${(duration / 60000).toFixed(1)}m`
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Execution History</CardTitle>
            <CardDescription>View past agent executions and workflow runs</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="agents" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="agents">
              <Brain className="h-4 w-4 mr-2" />
              Agent Executions ({agentExecutions.length})
            </TabsTrigger>
            <TabsTrigger value="workflows">
              <Workflow className="h-4 w-4 mr-2" />
              Workflow Runs ({workflowRuns.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="agents" className="mt-4">
            {agentExecutions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Brain className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No agent executions yet</p>
              </div>
            ) : (
              <ScrollArea className="h-[500px] pr-4">
                <div className="space-y-3">
                  {agentExecutions.map((execution) => (
                    <Card key={execution.id} className="hover:shadow-sm transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium text-sm">{execution.ai_agents?.name || "Unknown Agent"}</h4>
                              {getStatusBadge(execution.status)}
                            </div>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {new Date(execution.created_at).toLocaleString()}
                              </div>
                            </div>
                          </div>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>

                        {execution.input_data?.prompt && (
                          <div className="mt-2 p-2 bg-muted/50 rounded text-xs">
                            <p className="line-clamp-2">{execution.input_data.prompt}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            )}
          </TabsContent>

          <TabsContent value="workflows" className="mt-4">
            {workflowRuns.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Workflow className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No workflow runs yet</p>
              </div>
            ) : (
              <ScrollArea className="h-[500px] pr-4">
                <div className="space-y-3">
                  {workflowRuns.map((run) => (
                    <Card key={run.id} className="hover:shadow-sm transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium text-sm">{run.ai_workflows?.name || "Unknown Workflow"}</h4>
                              {getStatusBadge(run.status)}
                            </div>
                            {run.ai_workflows?.description && (
                              <p className="text-xs text-muted-foreground mb-2 line-clamp-1">
                                {run.ai_workflows.description}
                              </p>
                            )}
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {new Date(run.start_time || run.created_at).toLocaleString()}
                              </div>
                              {run.end_time && (
                                <Badge variant="outline" className="text-xs">
                                  {formatDuration(run.start_time, run.end_time)}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>

                        {run.error && (
                          <div className="mt-2 p-2 bg-red-500/10 border border-red-500/20 rounded text-xs text-red-600">
                            <p className="line-clamp-2">{run.error}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
