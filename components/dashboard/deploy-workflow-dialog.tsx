"use client"

import { useState } from "react"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Rocket, Loader2, CheckCircle, AlertCircle } from "lucide-react"
import { apiClient } from "@/lib/api-client"
import { createClient } from "@/lib/supabase/client"

type WorkflowTemplate = {
  id: string
  name: string
  description: string
  steps: any
  trigger_type: string | null
  trigger_config: any
  prerequisites: string[] | null
  expected_outcomes: string[] | null
}

export function DeployWorkflowDialog({
  template,
  onDeploy,
}: {
  template: WorkflowTemplate
  onDeploy?: () => void
}) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState(template.name)
  const [description, setDescription] = useState(template.description)

  const handleDeploy = async () => {
    try {
      setLoading(true)

      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        throw new Error("You must be logged in to deploy workflows")
      }

      await apiClient.deployWorkflowFromTemplate(template.id, user.id, {
        name,
        description,
      })

      setOpen(false)
      onDeploy?.()
    } catch (error) {
      console.error("[v0] Error deploying workflow:", error)
      alert("Failed to deploy workflow. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full mt-4">
          <Rocket className="mr-2 h-4 w-4" />
          Deploy Workflow
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Deploy {template.name}</DialogTitle>
          <DialogDescription>
            Customize your workflow before deployment. You can modify these settings later.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="steps">Workflow Steps</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Workflow Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter workflow name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter workflow description"
                rows={4}
              />
            </div>

            {template.trigger_type && (
              <div className="space-y-2">
                <Label>Trigger Type</Label>
                <div className="p-3 rounded-lg bg-muted">
                  <Badge variant="secondary">{template.trigger_type}</Badge>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="steps" className="space-y-4">
            <div className="space-y-2">
              <Label>Workflow Steps Preview</Label>
              <div className="space-y-2">
                {Array.isArray(template.steps) ? (
                  template.steps.map((step: any, index: number) => (
                    <div key={index} className="p-3 rounded-lg border bg-card flex items-start gap-3">
                      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-sm font-medium">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{step.name || `Step ${index + 1}`}</p>
                        {step.description && <p className="text-sm text-muted-foreground mt-1">{step.description}</p>}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 rounded-lg border bg-muted/50">
                    <p className="text-sm text-muted-foreground">
                      {Object.keys(template.steps || {}).length} workflow steps configured
                    </p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="details" className="space-y-4">
            {template.prerequisites && template.prerequisites.length > 0 && (
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Prerequisites
                </Label>
                <ul className="space-y-1 pl-4">
                  {template.prerequisites.map((prereq, index) => (
                    <li key={index} className="text-sm text-muted-foreground list-disc">
                      {prereq}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {template.expected_outcomes && template.expected_outcomes.length > 0 && (
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Expected Outcomes
                </Label>
                <ul className="space-y-1 pl-4">
                  {template.expected_outcomes.map((outcome, index) => (
                    <li key={index} className="text-sm text-muted-foreground list-disc">
                      {outcome}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleDeploy} disabled={loading || !name}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deploying...
              </>
            ) : (
              <>
                <Rocket className="mr-2 h-4 w-4" />
                Deploy Now
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
