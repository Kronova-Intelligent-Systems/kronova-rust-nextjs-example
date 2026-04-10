"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { Webhook, Plus, Trash2, Edit, Copy, CheckCircle2, XCircle, Loader2 } from "lucide-react"
import { useWebhooks, useCreateWebhook, useUpdateWebhook, useDeleteWebhook, useToggleWebhook } from "@/lib/rspc/hooks"
import { useToast } from "@/hooks/use-toast"
import { Textarea } from "@/components/ui/textarea"

interface WebhookData {
  id: string
  name: string
  url: string
  secret: string
  events: string[]
  is_active: boolean
  last_triggered_at: string | null
  last_status: string | null
  failure_count: number
  description: string | null
  created_at: string
}

const AVAILABLE_EVENTS = [
  { value: "agent.execution.started", label: "Agent Execution Started" },
  { value: "agent.execution.completed", label: "Agent Execution Completed" },
  { value: "agent.execution.failed", label: "Agent Execution Failed" },
  { value: "workflow.execution.started", label: "Workflow Execution Started" },
  { value: "workflow.execution.completed", label: "Workflow Execution Completed" },
  { value: "workflow.execution.failed", label: "Workflow Execution Failed" },
  { value: "asset.created", label: "Asset Created" },
  { value: "asset.updated", label: "Asset Updated" },
  { value: "asset.deleted", label: "Asset Deleted" },
]

export function WebhookManager() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingWebhook, setEditingWebhook] = useState<WebhookData | null>(null)
  const { toast } = useToast()

  const { data: webhooksData, isLoading: loading } = useWebhooks()
  const createWebhook = useCreateWebhook()
  const updateWebhook = useUpdateWebhook()
  const deleteWebhook = useDeleteWebhook()
  const toggleWebhook = useToggleWebhook()

  const webhooks = webhooksData?.data || []

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    url: "",
    description: "",
    events: [] as string[],
    is_active: true,
  })

  function openCreateDialog() {
    setEditingWebhook(null)
    setFormData({
      name: "",
      url: "",
      description: "",
      events: [],
      is_active: true,
    })
    setDialogOpen(true)
  }

  function openEditDialog(webhook: WebhookData) {
    setEditingWebhook(webhook)
    setFormData({
      name: webhook.name,
      url: webhook.url,
      description: webhook.description || "",
      events: webhook.events,
      is_active: webhook.is_active,
    })
    setDialogOpen(true)
  }

  async function handleSubmit() {
    try {
      if (!formData.name || !formData.url || formData.events.length === 0) {
        toast({
          title: "Validation Error",
          description: "Please fill in all required fields and select at least one event",
          variant: "destructive",
        })
        return
      }

      if (editingWebhook) {
        await updateWebhook.mutateAsync({
          webhook_id: editingWebhook.id,
          name: formData.name,
          url: formData.url,
          description: formData.description,
          events: formData.events,
          is_active: formData.is_active,
          updated_at: new Date().toISOString(),
        })

        toast({
          title: "Success",
          description: "Webhook updated successfully",
        })
      } else {
        const secret = generateWebhookSecret()
        await createWebhook.mutateAsync({
          name: formData.name,
          url: formData.url,
          description: formData.description,
          events: formData.events,
          is_active: formData.is_active,
          secret,
          failure_count: 0,
        })

        toast({
          title: "Success",
          description: "Webhook created successfully. Save your secret key securely!",
        })
      }

      setDialogOpen(false)
    } catch (error: any) {
      console.error("[v0] Error saving webhook:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to save webhook",
        variant: "destructive",
      })
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this webhook?")) return

    try {
      await deleteWebhook.mutateAsync({ webhook_id: id })

      toast({
        title: "Success",
        description: "Webhook deleted successfully",
      })
    } catch (error: any) {
      console.error("[v0] Error deleting webhook:", error)
      toast({
        title: "Error",
        description: "Failed to delete webhook",
        variant: "destructive",
      })
    }
  }

  async function handleToggle(id: string, currentStatus: boolean) {
    try {
      await toggleWebhook.mutateAsync({
        webhook_id: id,
        is_active: !currentStatus,
      })

      toast({
        title: "Success",
        description: `Webhook ${!currentStatus ? "enabled" : "disabled"}`,
      })
    } catch (error: any) {
      console.error("[v0] Error toggling webhook:", error)
      toast({
        title: "Error",
        description: "Failed to update webhook status",
        variant: "destructive",
      })
    }
  }

  function generateWebhookSecret(): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
    let secret = "whsec_"
    for (let i = 0; i < 48; i++) {
      secret += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return secret
  }

  function copyToClipboard(text: string, label: string) {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied",
      description: `${label} copied to clipboard`,
    })
  }

  function toggleEventSelection(eventValue: string) {
    setFormData((prev) => ({
      ...prev,
      events: prev.events.includes(eventValue)
        ? prev.events.filter((e) => e !== eventValue)
        : [...prev.events, eventValue],
    }))
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Webhook className="h-5 w-5" />
              Webhook Management
            </CardTitle>
            <CardDescription>
              Configure webhooks to receive real-time notifications for agent and workflow executions
            </CardDescription>
          </div>
          <Button onClick={openCreateDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Add Webhook
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : webhooks.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Webhook className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No webhooks configured yet</p>
            <p className="text-sm">Create your first webhook to start receiving notifications</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>URL</TableHead>
                <TableHead>Events</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Triggered</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {webhooks.map((webhook) => (
                <TableRow key={webhook.id}>
                  <TableCell className="font-medium">{webhook.name}</TableCell>
                  <TableCell className="max-w-xs truncate">{webhook.url}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{webhook.events.length} events</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={webhook.is_active}
                        onCheckedChange={() => handleToggle(webhook.id, webhook.is_active)}
                      />
                      {webhook.is_active ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-gray-400" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {webhook.last_triggered_at ? new Date(webhook.last_triggered_at).toLocaleString() : "Never"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" onClick={() => openEditDialog(webhook)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(webhook.secret, "Webhook secret")}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(webhook.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingWebhook ? "Edit Webhook" : "Create New Webhook"}</DialogTitle>
              <DialogDescription>Configure webhook endpoint to receive real-time event notifications</DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Webhook Name *</Label>
                <Input
                  id="name"
                  placeholder="Production API Webhook"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="url">Endpoint URL *</Label>
                <Input
                  id="url"
                  type="url"
                  placeholder="https://api.example.com/webhooks/resend-it"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Optional description for this webhook"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Events to Subscribe *</Label>
                <div className="grid grid-cols-1 gap-2 border rounded-lg p-4 max-h-64 overflow-y-auto">
                  {AVAILABLE_EVENTS.map((event) => (
                    <div key={event.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={event.value}
                        checked={formData.events.includes(event.value)}
                        onCheckedChange={() => toggleEventSelection(event.value)}
                      />
                      <label
                        htmlFor={event.value}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {event.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Active</Label>
                  <p className="text-sm text-muted-foreground">Enable this webhook to receive events</p>
                </div>
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit}>{editingWebhook ? "Update Webhook" : "Create Webhook"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
