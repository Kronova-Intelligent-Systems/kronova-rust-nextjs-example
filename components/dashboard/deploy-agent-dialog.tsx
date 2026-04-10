"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Rocket, Loader2, CheckCircle, Settings, Wrench } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { apiClient } from "@/lib/api-client"
import { toast } from "sonner"

interface AIModel {
  id: string
  name: string
  model_id: string
  provider: string
  description: string | null
  is_active: boolean | null
}

interface DeployAgentDialogProps {
  template: {
    id: string
    name: string
    description: string
    category: string
    system_prompt: string
    tools: any
    parameters: any
    use_cases?: string[]
    tags?: string[]
  }
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function DeployAgentDialog({ template, open, onOpenChange, onSuccess }: DeployAgentDialogProps) {
  const [loading, setLoading] = useState(false)
  const [customName, setCustomName] = useState(template.name)
  const [customDescription, setCustomDescription] = useState(template.description)
  const [aiModels, setAiModels] = useState<AIModel[]>([])
  const [loadingModels, setLoadingModels] = useState(false)
  const [selectedModelId, setSelectedModelId] = useState<string>("")

  const tools = Array.isArray(template.tools)
    ? template.tools
    : typeof template.tools === "object" && template.tools !== null
      ? Object.keys(template.tools)
      : []

  const parameters = typeof template.parameters === "object" ? template.parameters : {}

  useEffect(() => {
    if (open) {
      loadAIModels()
      setCustomName(template.name)
      setCustomDescription(template.description)
    }
  }, [open, template])

  const loadAIModels = async () => {
    setLoadingModels(true)
    try {
      const result = await apiClient.getAIModels({ is_active: true })
      setAiModels(result.data || [])

      // Set default model if available
      if (result.data && result.data.length > 0 && !selectedModelId) {
        setSelectedModelId(result.data[0].id)
      }
    } catch (error) {
      console.error("[v0] Failed to load AI models:", error)
      toast.error("Failed to load AI models")
    } finally {
      setLoadingModels(false)
    }
  }

  const handleDeploy = async () => {
    setLoading(true)
    try {
      const {
        data: { user },
      } = await apiClient.supabase.auth.getUser()

      if (!user) {
        toast.error("You must be logged in to deploy an agent")
        return
      }

      console.log("[v0] Deploying agent from template:", template.id)

      await apiClient.deployAgentFromTemplate(template.id, user.id, {
        name: customName,
        description: customDescription,
        parameters: {
          model_id: selectedModelId,
        },
      })

      toast.success(`${customName} deployed successfully!`)
      onOpenChange(false)
      onSuccess?.()
    } catch (error: any) {
      console.error("[v0] Failed to deploy agent:", error)
      toast.error(error.message || "Failed to deploy agent")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Rocket className="mr-2 h-5 w-5" />
            Deploy {template.name}
          </DialogTitle>
          <DialogDescription>
            Customize your agent before deployment. You can modify these settings later.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="config">Configuration</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="agent-name">Agent Name</Label>
              <Input
                id="agent-name"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="Enter agent name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="agent-description">Description</Label>
              <Textarea
                id="agent-description"
                value={customDescription}
                onChange={(e) => setCustomDescription(e.target.value)}
                placeholder="Enter agent description"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ai-model">AI Model *</Label>
              <Select value={selectedModelId} onValueChange={setSelectedModelId} disabled={loadingModels}>
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
              <Label>Category</Label>
              <Badge variant="secondary" className="capitalize">
                {template.category}
              </Badge>
            </div>

            {template.tags && template.tags.length > 0 && (
              <div className="space-y-2">
                <Label>Tags</Label>
                <div className="flex flex-wrap gap-2">
                  {template.tags.map((tag) => (
                    <Badge key={tag} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="config" className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="flex items-center">
                <Wrench className="mr-2 h-4 w-4" />
                Pre-configured Tools
              </Label>
              {tools.length > 0 ? (
                <div className="space-y-2">
                  {tools.map((tool) => (
                    <div key={tool} className="flex items-center gap-2 p-3 border rounded-lg bg-muted/50">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="font-medium">{tool}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground p-4 border rounded-lg text-center">
                  No tools configured for this template
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label className="flex items-center">
                <Settings className="mr-2 h-4 w-4" />
                Pre-configured Parameters
              </Label>
              {Object.keys(parameters).length > 0 ? (
                <div className="space-y-2">
                  {Object.entries(parameters).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between p-3 border rounded-lg bg-muted/50">
                      <span className="font-medium">{key}</span>
                      <Badge variant="secondary">{String(value)}</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground p-4 border rounded-lg text-center">
                  No parameters configured for this template
                </div>
              )}
            </div>

            {template.use_cases && template.use_cases.length > 0 && (
              <div className="space-y-2">
                <Label>Use Cases</Label>
                <ul className="space-y-2">
                  {template.use_cases.map((useCase, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 mt-0.5 text-green-500 flex-shrink-0" />
                      <span>{useCase}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </TabsContent>

          <TabsContent value="preview" className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>System Prompt Preview</Label>
              <div className="p-4 bg-muted rounded-lg text-sm max-h-60 overflow-y-auto whitespace-pre-wrap">
                {template.system_prompt}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleDeploy} disabled={!customName || !selectedModelId || loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Rocket className="mr-2 h-4 w-4" />
            Deploy Now
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
