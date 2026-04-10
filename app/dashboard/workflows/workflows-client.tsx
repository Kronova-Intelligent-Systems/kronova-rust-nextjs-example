"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Workflow, Play, Pause, BarChart3, Clock, CheckCircle, Settings, MoreVertical } from "lucide-react"
import { WorkflowTemplateBrowser } from "@/components/dashboard/workflow-template-browser"
import { CreateWorkflowDialog } from "@/components/dashboard/create-workflow-dialog"
import { ExecuteWorkflowDialog } from "@/components/dashboard/execute-workflow-dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

type AIWorkflow = {
  id: string
  name: string
  description: string | null
  steps: any
  trigger_type: string | null
  trigger_config: any
  is_active: boolean | null
  created_at: string | null
  updated_at: string | null
  user_id: string
}

export function WorkflowsPageClient({ initialWorkflows }: { initialWorkflows: AIWorkflow[] }) {
  const [workflows] = useState(initialWorkflows)
  const [selectedWorkflow, setSelectedWorkflow] = useState<AIWorkflow | null>(null)
  const [showExecuteDialog, setShowExecuteDialog] = useState(false)

  const workflowStats = {
    total: workflows.length,
    active: workflows.filter((w) => w.is_active).length,
    inactive: workflows.filter((w) => !w.is_active).length,
  }

  const handleExecuteWorkflow = (workflow: AIWorkflow) => {
    setSelectedWorkflow(workflow)
    setShowExecuteDialog(true)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Workflow Engine</h1>
          <p className="text-muted-foreground">Automate and orchestrate your asset intelligence processes</p>
        </div>
        <div className="flex space-x-2">
          <CreateWorkflowDialog />
          <Button variant="outline">
            <BarChart3 className="mr-2 h-4 w-4" />
            Analytics
          </Button>
        </div>
      </div>

      {/* Workflow Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Workflows</CardTitle>
            <Workflow className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{workflowStats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <Play className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{workflowStats.active}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactive</CardTitle>
            <Pause className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{workflowStats.inactive}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Templates</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Available</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for My Workflows and Templates */}
      <Tabs defaultValue="workflows" className="w-full">
        <TabsList>
          <TabsTrigger value="workflows">My Workflows</TabsTrigger>
          <TabsTrigger value="templates">Browse Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="workflows" className="space-y-4">
          {workflows.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Workflow className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">No workflows yet</p>
                <p className="text-sm text-muted-foreground mb-6">
                  Get started by creating a custom workflow or deploying from a template
                </p>
                <div className="flex gap-2">
                  <CreateWorkflowDialog />
                  <Button
                    variant="outline"
                    onClick={() => {
                      const tabsTrigger = document.querySelector('[value="templates"]') as HTMLElement
                      tabsTrigger?.click()
                    }}
                  >
                    Browse Templates
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {workflows.map((workflow) => (
                <Card key={workflow.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <CardTitle>{workflow.name}</CardTitle>
                          <div
                            className={`px-2 py-1 rounded-full text-xs ${
                              workflow.is_active ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
                            }`}
                          >
                            {workflow.is_active ? "Active" : "Inactive"}
                          </div>
                        </div>
                        {workflow.description && (
                          <p className="text-sm text-muted-foreground mt-1">{workflow.description}</p>
                        )}
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleExecuteWorkflow(workflow)}>
                            <Play className="mr-2 h-4 w-4" />
                            Execute
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Settings className="mr-2 h-4 w-4" />
                            Configure
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            {workflow.is_active ? (
                              <>
                                <Pause className="mr-2 h-4 w-4" />
                                Deactivate
                              </>
                            ) : (
                              <>
                                <Play className="mr-2 h-4 w-4" />
                                Activate
                              </>
                            )}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                      {workflow.trigger_type && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{workflow.trigger_type}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Workflow className="h-3 w-3" />
                        <span>
                          {Array.isArray(workflow.steps)
                            ? workflow.steps.length
                            : Object.keys(workflow.steps || {}).length}{" "}
                          steps
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" className="flex-1" onClick={() => handleExecuteWorkflow(workflow)}>
                        <Play className="mr-2 h-3 w-3" />
                        Execute
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1 bg-transparent">
                        <BarChart3 className="mr-2 h-3 w-3" />
                        View Runs
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="templates">
          <WorkflowTemplateBrowser />
        </TabsContent>
      </Tabs>

      {selectedWorkflow && (
        <ExecuteWorkflowDialog
          open={showExecuteDialog}
          onOpenChange={setShowExecuteDialog}
          workflow={selectedWorkflow}
        />
      )}
    </div>
  )
}
