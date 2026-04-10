"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Brain, Loader2, Wrench } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { apiClient } from "@/lib/api-client"
import { toast } from "sonner"

interface AgentTool {
  name: string
  description?: string
  enabled: boolean
}

interface AIModel {
  id: string
  name: string
  model_id: string
  provider: string
  description: string | null
  is_active: boolean | null
}

interface CreateAgentFormData {
  name: string
  type: string
  description: string
  model_id: string
  system_prompt: string
  temperature: number
  max_tokens: number
  parameters: Record<string, any>
  tools: string[]
}

export function CreateAgentDialog() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [aiModels, setAiModels] = useState<AIModel[]>([])
  const [loadingModels, setLoadingModels] = useState(false)

  const [formData, setFormData] = useState<CreateAgentFormData>({
    name: "",
    type: "",
    description: "",
    model_id: "",
    system_prompt: "",
    temperature: 0.7,
    max_tokens: 2000,
    parameters: {},
    tools: [],
  })

  const [availableTools, setAvailableTools] = useState<AgentTool[]>([
    { name: "web_search", description: "Search the web for information", enabled: false },
    { name: "data_analysis", description: "Analyze data and generate insights", enabled: false },
    { name: "asset_query", description: "Query asset database", enabled: false },
    { name: "predictive_modeling", description: "Run predictive models", enabled: false },
    { name: "report_generation", description: "Generate reports", enabled: false },
  ])

  useEffect(() => {
    if (open) {
      loadAIModels()
    }
  }, [open])

  const loadAIModels = async () => {
    setLoadingModels(true)
    try {
      const result = await apiClient.getAIModels({ is_active: true })
      setAiModels(result.data || [])

      // Set default model if available
      if (result.data && result.data.length > 0 && !formData.model_id) {
        setFormData((prev) => ({ ...prev, model_id: result.data[0].id }))
      }
    } catch (error) {
      console.error("[v0] Failed to load AI models:", error)
      toast.error("Failed to load AI models")
    } finally {
      setLoadingModels(false)
    }
  }

  const handleToolToggle = (toolName: string) => {
    setAvailableTools((prev) =>
      prev.map((tool) => (tool.name === toolName ? { ...tool, enabled: !tool.enabled } : tool)),
    )

    const enabledTools = availableTools.filter((t) => (t.name === toolName ? !t.enabled : t.enabled)).map((t) => t.name)

    setFormData({ ...formData, tools: enabledTools })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const {
        data: { user },
      } = await apiClient.supabase.auth.getUser()

      if (!user) {
        toast.error("You must be logged in to create an agent")
        return
      }

      const agentData = {
        name: formData.name,
        description: formData.description,
        system_prompt: formData.system_prompt,
        model_id: formData.model_id,
        temperature: formData.temperature,
        max_tokens: formData.max_tokens,
        parameters: {
          ...formData.parameters,
          type: formData.type,
        },
        tools: formData.tools.length > 0 ? formData.tools : null,
        user_id: user.id,
      }

      console.log("[v0] Creating custom agent with data:", agentData)

      await apiClient.createAIAgent(agentData)

      toast.success("AI Agent created successfully!")
      setOpen(false)

      setFormData({
        name: "",
        type: "",
        description: "",
        model_id: "",
        system_prompt: "",
        temperature: 0.7,
        max_tokens: 2000,
        parameters: {},
        tools: [],
      })
      setAvailableTools((prev) => prev.map((tool) => ({ ...tool, enabled: false })))
    } catch (error: any) {
      console.error("[v0] Failed to create agent:", error)
      toast.error(error.message || "Failed to create agent")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create Agent
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Brain className="mr-2 h-5 w-5" />
            Create Custom AI Agent
          </DialogTitle>
          <DialogDescription>Build a custom AI agent from scratch with your own configuration.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="config">Configuration</TabsTrigger>
              <TabsTrigger value="tools">Tools</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Agent Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="My Custom Agent"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Agent Type *</Label>
                <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select agent type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="asset-analysis">Asset Analysis</SelectItem>
                    <SelectItem value="predictive-analytics">Predictive Analytics</SelectItem>
                    <SelectItem value="process-optimization">Process Optimization</SelectItem>
                    <SelectItem value="security-analysis">Security Analysis</SelectItem>
                    <SelectItem value="financial-analysis">Financial Analysis</SelectItem>
                    <SelectItem value="performance-monitoring">Performance Monitoring</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the agent's purpose and capabilities..."
                  rows={3}
                />
              </div>
            </TabsContent>

            <TabsContent value="config" className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="model">AI Model *</Label>
                <Select
                  value={formData.model_id}
                  onValueChange={(value) => setFormData({ ...formData, model_id: value })}
                  disabled={loadingModels}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={loadingModels ? "Loading models..." : "Select AI model"} />
                  </SelectTrigger>
                  <SelectContent>
                    {aiModels.map((model) => (
                      <SelectItem key={model.id} value={model.id}>
                        <div className="flex flex-col">
                          <span className="font-medium">{model.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {model.provider} • {model.model_id}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {aiModels.length === 0 && !loadingModels && (
                  <p className="text-xs text-muted-foreground">No AI models available</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="system_prompt">System Prompt *</Label>
                <Textarea
                  id="system_prompt"
                  value={formData.system_prompt}
                  onChange={(e) => setFormData({ ...formData, system_prompt: e.target.value })}
                  placeholder="You are an AI agent specialized in..."
                  rows={4}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="temperature">Temperature: {formData.temperature}</Label>
                  <Input
                    id="temperature"
                    type="range"
                    min="0"
                    max="2"
                    step="0.1"
                    value={formData.temperature}
                    onChange={(e) => setFormData({ ...formData, temperature: Number.parseFloat(e.target.value) })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="max_tokens">Max Tokens</Label>
                  <Input
                    id="max_tokens"
                    type="number"
                    value={formData.max_tokens}
                    onChange={(e) => setFormData({ ...formData, max_tokens: Number.parseInt(e.target.value) })}
                    min="100"
                    max="8000"
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="tools" className="space-y-4 py-4">
              <div className="space-y-2">
                <Label className="flex items-center">
                  <Wrench className="mr-2 h-4 w-4" />
                  Available Tools
                </Label>
                <div className="space-y-2">
                  {availableTools.map((tool) => (
                    <div key={tool.name} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium">{tool.name}</div>
                        {tool.description && <div className="text-sm text-muted-foreground">{tool.description}</div>}
                      </div>
                      <Button
                        type="button"
                        variant={tool.enabled ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleToolToggle(tool.name)}
                      >
                        {tool.enabled ? "Enabled" : "Disabled"}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !formData.name || !formData.type || !formData.system_prompt || !formData.model_id}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Agent
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
