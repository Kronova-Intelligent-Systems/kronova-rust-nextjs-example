"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Key, Plus, Copy, Trash2, Eye, EyeOff, AlertCircle, CheckCircle2, Shield } from "lucide-react"
import { apiClient } from "@/lib/api-client"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"

interface APIKey {
  id: string
  name: string
  key_prefix: string
  is_active: boolean
  created_at: string
  last_used_at: string | null
  expires_at: string | null
  scopes: string[]
}

const AVAILABLE_SCOPES = [
  { value: "agents:execute", label: "Execute Agents", description: "Run and execute AI agents" },
  { value: "workflows:execute", label: "Execute Workflows", description: "Run and execute workflows" },
  { value: "assets:read", label: "Read Assets", description: "View and retrieve assets" },
  { value: "assets:write", label: "Write Assets", description: "Create, update, and delete assets" },
  { value: "webhooks:manage", label: "Manage Webhooks", description: "Create and manage webhook endpoints" },
  { value: "admin:full", label: "Full Admin Access", description: "Complete administrative privileges" },
]

export function APIKeyManager() {
  const [apiKeys, setApiKeys] = useState<APIKey[]>([])
  const [loading, setLoading] = useState(true)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [newKeyName, setNewKeyName] = useState("")
  const [newKeyExpiry, setNewKeyExpiry] = useState("")
  const [selectedScopes, setSelectedScopes] = useState<string[]>(["agents:execute"])
  const [createdKey, setCreatedKey] = useState<string | null>(null)
  const [showCreatedKey, setShowCreatedKey] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    loadAPIKeys()
  }, [])

  const loadAPIKeys = async () => {
    try {
      setLoading(true)
      const { data } = await apiClient.getAPIKeys()
      setApiKeys(data)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load API keys",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleScopeToggle = (scope: string) => {
    setSelectedScopes((prev) => (prev.includes(scope) ? prev.filter((s) => s !== scope) : [...prev, scope]))
  }

  const handleCreateKey = async () => {
    if (!newKeyName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a name for the API key",
        variant: "destructive",
      })
      return
    }

    if (selectedScopes.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one scope",
        variant: "destructive",
      })
      return
    }

    try {
      const apiKey = generateSecureKey()

      const { data } = await apiClient.createAPIKey({
        name: newKeyName,
        expires_at: newKeyExpiry || undefined,
        scopes: selectedScopes,
      })

      localStorage.setItem("resendit_api_key", apiKey)

      setCreatedKey(apiKey)
      setShowCreatedKey(true)
      setNewKeyName("")
      setNewKeyExpiry("")
      setSelectedScopes(["agents:execute"])
      await loadAPIKeys()

      toast({
        title: "Success",
        description: "API key created successfully",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create API key",
        variant: "destructive",
      })
    }
  }

  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key)
    toast({
      title: "Copied",
      description: "API key copied to clipboard",
    })
  }

  const handleRevokeKey = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to revoke the API key "${name}"?`)) {
      return
    }

    try {
      await apiClient.revokeAPIKey(id)
      await loadAPIKeys()
      toast({
        title: "Success",
        description: "API key revoked successfully",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to revoke API key",
        variant: "destructive",
      })
    }
  }

  const handleDeleteKey = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to permanently delete the API key "${name}"?`)) {
      return
    }

    try {
      await apiClient.deleteAPIKey(id)
      await loadAPIKeys()
      toast({
        title: "Success",
        description: "API key deleted successfully",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete API key",
        variant: "destructive",
      })
    }
  }

  const closeCreateDialog = () => {
    setCreateDialogOpen(false)
    setCreatedKey(null)
    setShowCreatedKey(false)
    setNewKeyName("")
    setNewKeyExpiry("")
    setSelectedScopes(["agents:execute"])
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              API Key Management
            </CardTitle>
            <CardDescription className="mt-1">Manage API keys for Resend-It platform integrations</CardDescription>
          </div>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Create Key
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New API Key</DialogTitle>
                <DialogDescription>
                  {createdKey
                    ? "Save your API key now. You won't be able to see it again."
                    : "Create a new API key for external integrations with specific permissions"}
                </DialogDescription>
              </DialogHeader>

              {createdKey ? (
                <div className="space-y-4">
                  <div className="p-4 bg-muted rounded-lg space-y-2">
                    <div className="flex items-center gap-2 text-amber-600">
                      <AlertCircle className="h-5 w-5" />
                      <p className="font-medium">Important: Save this key now</p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      This is the only time you'll see the full API key. Store it securely.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Your API Key</Label>
                    <div className="flex gap-2">
                      <Input
                        value={showCreatedKey ? createdKey : "•".repeat(64)}
                        readOnly
                        className="font-mono text-xs"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setShowCreatedKey(!showCreatedKey)}
                        className="shrink-0"
                      >
                        {showCreatedKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleCopyKey(createdKey)}
                        className="shrink-0"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="key-name">Key Name</Label>
                    <Input
                      id="key-name"
                      placeholder="e.g., Production API, Development Key"
                      value={newKeyName}
                      onChange={(e) => setNewKeyName(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="key-expiry">Expiration Date (Optional)</Label>
                    <Input
                      id="key-expiry"
                      type="date"
                      value={newKeyExpiry}
                      onChange={(e) => setNewKeyExpiry(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">Leave empty for no expiration</p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      <Label>Permissions & Scopes</Label>
                    </div>
                    <p className="text-xs text-muted-foreground">Select what this API key will be allowed to do</p>
                    <div className="space-y-2 border rounded-lg p-3">
                      {AVAILABLE_SCOPES.map((scope) => (
                        <div key={scope.value} className="flex items-start space-x-3 p-2 hover:bg-muted rounded">
                          <Checkbox
                            id={scope.value}
                            checked={selectedScopes.includes(scope.value)}
                            onCheckedChange={() => handleScopeToggle(scope.value)}
                          />
                          <div className="flex-1">
                            <label
                              htmlFor={scope.value}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                            >
                              {scope.label}
                            </label>
                            <p className="text-xs text-muted-foreground mt-0.5">{scope.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    {selectedScopes.length > 0 && (
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs text-muted-foreground">Selected:</span>
                        {selectedScopes.map((scope) => (
                          <Badge key={scope} variant="secondary" className="text-xs">
                            {AVAILABLE_SCOPES.find((s) => s.value === scope)?.label}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <DialogFooter>
                {createdKey ? (
                  <Button onClick={closeCreateDialog} className="w-full">
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Done
                  </Button>
                ) : (
                  <>
                    <Button variant="outline" onClick={closeCreateDialog}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateKey}>Create Key</Button>
                  </>
                )}
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Loading API keys...</div>
        ) : apiKeys.length === 0 ? (
          <div className="text-center py-8 space-y-2">
            <Key className="h-12 w-12 mx-auto text-muted-foreground" />
            <p className="text-muted-foreground">No API keys yet</p>
            <p className="text-xs text-muted-foreground">Create your first API key to start integrating</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Key Prefix</TableHead>
                  <TableHead>Scopes</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Last Used</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {apiKeys.map((key) => (
                  <TableRow key={key.id}>
                    <TableCell className="font-medium">{key.name}</TableCell>
                    <TableCell className="font-mono text-xs">{key.key_prefix}...</TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap max-w-xs">
                        {key.scopes && key.scopes.length > 0 ? (
                          key.scopes.map((scope) => (
                            <Badge key={scope} variant="outline" className="text-xs">
                              {AVAILABLE_SCOPES.find((s) => s.value === scope)?.label || scope}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-xs text-muted-foreground">No scopes</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={key.is_active ? "default" : "secondary"}>
                        {key.is_active ? "Active" : "Revoked"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs">{format(new Date(key.created_at), "MMM d, yyyy")}</TableCell>
                    <TableCell className="text-xs">
                      {key.last_used_at ? format(new Date(key.last_used_at), "MMM d, yyyy") : "Never"}
                    </TableCell>
                    <TableCell className="text-xs">
                      {key.expires_at ? format(new Date(key.expires_at), "MMM d, yyyy") : "Never"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {key.is_active && (
                          <Button variant="outline" size="sm" onClick={() => handleRevokeKey(key.id, key.name)}>
                            Revoke
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteKey(key.id, key.name)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Helper function to generate secure random API keys
function generateSecureKey(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return "rsk_" + Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("")
}
