"use client"

import type React from "react"

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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, Workflow } from "lucide-react"

export function CreateWorkflowDialog() {
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    trigger: "",
    schedule: "",
    steps: [] as string[],
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle workflow creation logic here
    console.log("Creating workflow:", formData)
    setOpen(false)
    setFormData({ name: "", description: "", trigger: "", schedule: "", steps: [] })
  }

  const handleStepChange = (stepId: string, checked: boolean) => {
    if (checked) {
      setFormData({ ...formData, steps: [...formData.steps, stepId] })
    } else {
      setFormData({ ...formData, steps: formData.steps.filter((id) => id !== stepId) })
    }
  }

  const availableSteps = [
    { id: "data-collection", name: "Data Collection", description: "Gather data from various sources" },
    { id: "ai-analysis", name: "AI Analysis", description: "Analyze data using AI models" },
    { id: "validation", name: "Validation", description: "Validate results and check thresholds" },
    { id: "notification", name: "Notification", description: "Send alerts and notifications" },
    { id: "reporting", name: "Reporting", description: "Generate reports and documentation" },
    { id: "automation", name: "Automation", description: "Execute automated actions" },
  ]

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create Workflow
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[625px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Workflow className="mr-2 h-5 w-5" />
            Create New Workflow
          </DialogTitle>
          <DialogDescription>
            Design an automated workflow to streamline your asset intelligence processes.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="col-span-3"
                placeholder="Asset Maintenance Pipeline"
                required
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Description
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="col-span-3"
                placeholder="Describe the workflow's purpose and functionality..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="trigger" className="text-right">
                Trigger
              </Label>
              <Select value={formData.trigger} onValueChange={(value) => setFormData({ ...formData, trigger: value })}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select trigger type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="schedule">Schedule</SelectItem>
                  <SelectItem value="event">Event-based</SelectItem>
                  <SelectItem value="threshold">Threshold</SelectItem>
                  <SelectItem value="manual">Manual</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.trigger === "schedule" && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="schedule" className="text-right">
                  Schedule
                </Label>
                <Select
                  value={formData.schedule}
                  onValueChange={(value) => setFormData({ ...formData, schedule: value })}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select schedule" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hourly">Every Hour</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid grid-cols-4 items-start gap-4">
              <Label className="text-right mt-2">Workflow Steps</Label>
              <div className="col-span-3 space-y-3">
                {availableSteps.map((step) => (
                  <div key={step.id} className="flex items-start space-x-2">
                    <Checkbox
                      id={step.id}
                      checked={formData.steps.includes(step.id)}
                      onCheckedChange={(checked) => handleStepChange(step.id, checked as boolean)}
                    />
                    <div className="grid gap-1.5 leading-none">
                      <label
                        htmlFor={step.id}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {step.name}
                      </label>
                      <p className="text-xs text-muted-foreground">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Create Workflow</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
