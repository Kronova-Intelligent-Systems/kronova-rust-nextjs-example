"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { useRSPCQuery, useRSPCMutation } from "@/lib/rspc/hooks"
import { Loader2, Plus, Play, Settings, AlertTriangle, Webhook } from "lucide-react"
import { resenditAPI } from "@/lib/resendit-api-client"
import { useToast } from "@/hooks/use-toast"

export function AIAgents() {
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [useApiMode, setUseApiMode] = useState(false)
  const { toast } = useToast()

  const [newAgent, setNewAgent] = useState({
    name: "",
    description: "",
    agent_type: "analysis",
    system_prompt: "",
    model_id: "gpt-4",
    parameters: "",
  })

  const { data: agents, isLoading, refetch, error } = useRSPCQuery(["ai.agents.list", {}])

  const createAgentMutation = useRSPCMutation("ai.agents.create", {
    onSuccess: () => {
      refetch()
      setShowCreateForm(false)
      setNewAgent({
        name: "",
        description: "",
        agent_type: "analysis",
        system_prompt: "",
        model_id: "gpt-4",
        parameters: "",
      })
      toast({
        title: "Agent created",
        description: "Your AI agent has been created successfully",
      })
    },
  })

  const executeAgentMutation = useRSPCMutation("ai.agents.execute", {
    onSuccess: () => {
      refetch()
      toast({
        title: "Agent executed",
        description: "Your agent is running. Check execution history for results.",
      })
    },
  })

  const handleCreateAgent = async () => {
    let parameters = {}
    try {
      parameters = JSON.parse(newAgent.parameters || "{}")
    } catch (e) {
      parameters = {}
    }

    if (useApiMode) {
      try {
        await resenditAPI.createAgent({
          name: newAgent.name,
          description: newAgent.description,
          system_prompt: newAgent.system_prompt,
          model_id: newAgent.model_id,
          parameters,
        })
        refetch()
        setShowCreateForm(false)
        toast({
          title: "Agent created via API",
          description: "Your AI agent has been created successfully using the Resend-It API",
        })
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        })
      }
    } else {
      createAgentMutation.mutate({
        name: newAgent.name,
        description: newAgent.description,
        agent_type: newAgent.agent_type,
        system_prompt: newAgent.system_prompt,
        model_id: newAgent.model_id,
        parameters: parameters,
        is_active: true,
      })
    }
  }

  const handleExecuteAgent = async (agentId: string, agentName: string) => {
    if (useApiMode) {
      try {
        const result = await resenditAPI.executeAgent(agentId, {
          prompt: `Execute agent ${agentName}`,
          assetIds: [],
          dataStreamIds: [],
        })
        toast({
          title: "Agent execution started via API",
          description: `Execution ID: ${result.executionId}`,
        })
        refetch()
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        })
      }
    } else {
      executeAgentMutation.mutate({
        agent_id: agentId,
        input_data: { prompt: `Execute agent ${agentName}` },
      })
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading AI agents...</span>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <AlertTriangle className="h-8 w-8 text-red-500" />
          <span className="ml-2">Error loading AI agents: {error.message}</span>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>AI Agents</CardTitle>
              <CardDescription>Manage and deploy AI agents for automated asset analysis</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="api-mode" className="text-sm">
                <Webhook className="h-4 w-4 inline mr-1" />
                REST API Mode
              </Label>
              <input
                type="checkbox"
                id="api-mode"
                checked={useApiMode}
                onChange={(e) => setUseApiMode(e.target.checked)}
                className="toggle"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex justify-end mb-6">
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Agent
            </Button>
          </div>

          {showCreateForm && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Create New AI Agent</CardTitle>
                {useApiMode && (
                  <Badge variant="outline" className="w-fit">
                    <Webhook className="h-3 w-3 mr-1" />
                    Using Resend-It REST API
                  </Badge>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="agent-name">Agent Name</Label>
                    <Input
                      id="agent-name"
                      value={newAgent.name}
                      onChange={(e) => setNewAgent({ ...newAgent, name: e.target.value })}
                      placeholder="Enter agent name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="agent-type">Agent Type</Label>
                    <select
                      id="agent-type"
                      value={newAgent.agent_type}
                      onChange={(e) => setNewAgent({ ...newAgent, agent_type: e.target.value })}
                      className="w-full p-2 border rounded-md"
                    >
                      <option value="analysis">Asset Analysis</option>
                      <option value="monitoring">Monitoring</option>
                      <option value="prediction">Predictive Analytics</option>
                      <option value="optimization">Optimization</option>
                    </select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="agent-description">Description</Label>
                  <Textarea
                    id="agent-description"
                    value={newAgent.description}
                    onChange={(e) => setNewAgent({ ...newAgent, description: e.target.value })}
                    placeholder="Describe what this agent does..."
                  />
                </div>
                <div>
                  <Label htmlFor="system-prompt">System Prompt</Label>
                  <Textarea
                    id="system-prompt"
                    value={newAgent.system_prompt}
                    onChange={(e) => setNewAgent({ ...newAgent, system_prompt: e.target.value })}
                    placeholder="Enter the system prompt for this AI agent..."
                  />
                </div>
                <div>
                  <Label htmlFor="agent-config">Parameters (JSON)</Label>
                  <Textarea
                    id="agent-config"
                    value={newAgent.parameters}
                    onChange={(e) => setNewAgent({ ...newAgent, parameters: e.target.value })}
                    placeholder='{"temperature": 0.7, "max_tokens": 1000}'
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleCreateAgent} disabled={createAgentMutation.isLoading || !newAgent.name}>
                    {createAgentMutation.isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Create Agent
                  </Button>
                  <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-4">
            {agents?.data?.map((agent: any) => (
              <Card key={agent.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">{agent.name}</h3>
                        <Badge variant="secondary">{agent.agent_type}</Badge>
                        <Badge variant={agent.is_active ? "default" : "secondary"}>
                          {agent.is_active ? "active" : "inactive"}
                        </Badge>
                        {useApiMode && (
                          <Badge variant="outline">
                            <Webhook className="h-3 w-3 mr-1" />
                            API
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{agent.description}</p>
                      <div className="flex gap-4 text-sm text-muted-foreground">
                        <span>🔄 {agent.execution_count || 0} executions</span>
                        <span>📅 {new Date(agent.created_at).toLocaleDateString()}</span>
                        {agent.last_execution_at && (
                          <span>⏰ Last run: {new Date(agent.last_execution_at).toLocaleString()}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleExecuteAgent(agent.id, agent.name)}
                        disabled={executeAgentMutation.isLoading}
                      >
                        {executeAgentMutation.isLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                      </Button>
                      <Button variant="outline" size="sm">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {agents?.data?.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No AI agents found. Create your first agent to get started.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
