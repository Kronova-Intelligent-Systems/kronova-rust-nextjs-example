"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Brain, BarChart3, Zap, AlertTriangle, CheckCircle, Sparkles, Plus } from "lucide-react"
import { AgentCard } from "@/components/dashboard/agent-card"
import { AgentMetricsChart } from "@/components/dashboard/agent-metrics-chart"
import { TemplateBrowser } from "@/components/dashboard/template-browser"
import { CreateAgentDialog } from "@/components/dashboard/create-agent-dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface AgentsPageClientProps {
  agents: any[]
  agentStats: {
    total: number
    active: number
    training: number
    inactive: number
    avgPerformance: number
  }
  userId: string
}

export function AgentsPageClient({ agents, agentStats, userId }: AgentsPageClientProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [agentsList, setAgentsList] = useState(agents)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">AI Agent Management</h1>
          <p className="text-muted-foreground">Deploy, monitor, and optimize your AI agents</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button variant="outline" className="flex-1 sm:flex-none bg-transparent">
            <BarChart3 className="mr-2 h-4 w-4" />
            Analytics
          </Button>
          <Button onClick={() => setShowCreateDialog(true)} className="flex-1 sm:flex-none">
            <Plus className="mr-2 h-4 w-4" />
            Create Agent
          </Button>
        </div>
      </div>

      {/* Agent Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Agents</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{agentStats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{agentStats.active}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Training</CardTitle>
            <Zap className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{agentStats.training}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactive</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{agentStats.inactive}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="my-agents" className="space-y-6">
        <TabsList>
          <TabsTrigger value="my-agents">
            <Brain className="mr-2 h-4 w-4" />
            My Agents
          </TabsTrigger>
          <TabsTrigger value="templates">
            <Sparkles className="mr-2 h-4 w-4" />
            Agent Templates
          </TabsTrigger>
        </TabsList>

        <TabsContent value="my-agents" className="space-y-6">
          {/* Agent Metrics Chart */}
          <AgentMetricsChart />

          {/* Agent Grid */}
          {agentsList && agentsList.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {agentsList.map((agent) => (
                <AgentCard
                  key={agent.id}
                  agent={{
                    id: agent.id,
                    name: agent.name,
                    type: agent.ai_models?.name || "Custom",
                    status: agent.is_active ? ("active" as const) : ("inactive" as const),
                    performance: 0,
                    uptime: 0,
                    tasksCompleted: 0,
                    lastActive: new Date(agent.updated_at || agent.created_at || "").toLocaleString(),
                    description: agent.description || "",
                    configuration: {
                      model: agent.ai_models?.name || "Unknown",
                      maxTokens: agent.max_tokens || 0,
                      temperature: agent.temperature || 0,
                    },
                  }}
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Brain className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium mb-2">No agents deployed yet</p>
                <p className="text-muted-foreground mb-4">Deploy your first AI agent from our template library</p>
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Agent
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="templates">
          <TemplateBrowser userId={userId} />
        </TabsContent>
      </Tabs>

      <CreateAgentDialog open={showCreateDialog} onOpenChange={setShowCreateDialog} />
    </div>
  )
}
