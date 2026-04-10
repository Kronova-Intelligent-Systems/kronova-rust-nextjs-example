"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Lock, Database, Shield, Key } from "lucide-react"

interface OutputStorageConfig {
  store_output: boolean
  store_in_learning_data: boolean
  encrypt_output: boolean
  encryption_algorithm?: "AES-256-GCM" | "ChaCha20-Poly1305" | "AES-256-CBC"
  retention_days?: number
  include_metadata: boolean
  metadata_fields?: string[]
}

interface OutputStorageConfigProps {
  value?: OutputStorageConfig
  onChange: (config: OutputStorageConfig) => void
}

export function OutputStorageConfig({ value, onChange }: OutputStorageConfigProps) {
  const [config, setConfig] = useState<OutputStorageConfig>(
    value || {
      store_output: true,
      store_in_learning_data: false,
      encrypt_output: false,
      retention_days: 90,
      include_metadata: true,
      metadata_fields: ["execution_time", "status", "workflow_id"],
    },
  )

  const updateConfig = (updates: Partial<OutputStorageConfig>) => {
    const newConfig = { ...config, ...updates }
    setConfig(newConfig)
    onChange(newConfig)
  }

  return (
    <div className="space-y-[2dvw]">
      {/* Store Output Toggle */}
      <Card className="p-[2dvw]">
        <div className="flex items-center justify-between">
          <div className="space-y-[0.5dvw]">
            <div className="flex items-center gap-[1dvw]">
              <Database className="h-5 w-5 text-primary" />
              <Label className="text-base font-semibold">Store Workflow Output</Label>
            </div>
            <p className="text-sm text-muted-foreground">Save workflow execution results for analysis and auditing</p>
          </div>
          <Switch
            checked={config.store_output}
            onCheckedChange={(checked) => updateConfig({ store_output: checked })}
          />
        </div>
      </Card>

      {config.store_output && (
        <>
          {/* Learning Data Storage */}
          <Card className="p-[2dvw]">
            <div className="space-y-[2dvw]">
              <div className="flex items-center justify-between">
                <div className="space-y-[0.5dvw]">
                  <div className="flex items-center gap-[1dvw]">
                    <Shield className="h-5 w-5 text-primary" />
                    <Label className="text-base font-semibold">Store in Learning Data Table</Label>
                  </div>
                  <p className="text-sm text-muted-foreground">Enable ML model training and optimization insights</p>
                </div>
                <Switch
                  checked={config.store_in_learning_data}
                  onCheckedChange={(checked) => updateConfig({ store_in_learning_data: checked })}
                />
              </div>

              {config.store_in_learning_data && (
                <div className="pl-[3dvw] space-y-[1.5dvw] border-l-2 border-primary/20">
                  <div className="space-y-[1dvw]">
                    <Label>Retention Period (Days)</Label>
                    <Input
                      type="number"
                      value={config.retention_days}
                      onChange={(e) => updateConfig({ retention_days: Number.parseInt(e.target.value) })}
                      min={1}
                      max={365}
                    />
                    <p className="text-xs text-muted-foreground">Data will be automatically purged after this period</p>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Include Execution Metadata</Label>
                      <p className="text-xs text-muted-foreground">Store performance metrics and context</p>
                    </div>
                    <Switch
                      checked={config.include_metadata}
                      onCheckedChange={(checked) => updateConfig({ include_metadata: checked })}
                    />
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Encryption Configuration */}
          <Card className="p-[2dvw]">
            <div className="space-y-[2dvw]">
              <div className="flex items-center justify-between">
                <div className="space-y-[0.5dvw]">
                  <div className="flex items-center gap-[1dvw]">
                    <Lock className="h-5 w-5 text-primary" />
                    <Label className="text-base font-semibold">Encrypt Output Data</Label>
                    <Badge variant="secondary" className="text-xs">
                      Enterprise
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">End-to-end encryption for sensitive workflow outputs</p>
                </div>
                <Switch
                  checked={config.encrypt_output}
                  onCheckedChange={(checked) => updateConfig({ encrypt_output: checked })}
                />
              </div>

              {config.encrypt_output && (
                <div className="pl-[3dvw] space-y-[2dvw] border-l-2 border-primary/20">
                  <div className="space-y-[1dvw]">
                    <Label>Encryption Algorithm</Label>
                    <Select
                      value={config.encryption_algorithm}
                      onValueChange={(v: any) => updateConfig({ encryption_algorithm: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select algorithm" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="AES-256-GCM">
                          <div>
                            <div className="font-medium">AES-256-GCM</div>
                            <div className="text-xs text-muted-foreground">
                              Industry standard, authenticated encryption
                            </div>
                          </div>
                        </SelectItem>
                        <SelectItem value="ChaCha20-Poly1305">
                          <div>
                            <div className="font-medium">ChaCha20-Poly1305</div>
                            <div className="text-xs text-muted-foreground">High performance, mobile-optimized</div>
                          </div>
                        </SelectItem>
                        <SelectItem value="AES-256-CBC">
                          <div>
                            <div className="font-medium">AES-256-CBC</div>
                            <div className="text-xs text-muted-foreground">Legacy compatibility mode</div>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Card className="p-[1.5dvw] bg-muted/50">
                    <div className="flex items-start gap-[1dvw]">
                      <Key className="h-4 w-4 text-primary mt-0.5" />
                      <div className="space-y-[0.5dvw]">
                        <p className="text-sm font-medium">Encryption Key Management</p>
                        <p className="text-xs text-muted-foreground">
                          Keys are automatically generated and stored in Supabase Vault with hardware-backed security.
                          Each workflow uses a unique encryption key with automatic rotation every 90 days.
                        </p>
                      </div>
                    </div>
                  </Card>

                  <div className="space-y-[1dvw]">
                    <Label>Security Features</Label>
                    <div className="space-y-[0.5dvw]">
                      <div className="flex items-center gap-[1dvw] text-sm">
                        <Badge variant="outline" className="text-xs">
                          ✓
                        </Badge>
                        <span>At-rest encryption with AES-256</span>
                      </div>
                      <div className="flex items-center gap-[1dvw] text-sm">
                        <Badge variant="outline" className="text-xs">
                          ✓
                        </Badge>
                        <span>In-transit encryption with TLS 1.3</span>
                      </div>
                      <div className="flex items-center gap-[1dvw] text-sm">
                        <Badge variant="outline" className="text-xs">
                          ✓
                        </Badge>
                        <span>Automatic key rotation and versioning</span>
                      </div>
                      <div className="flex items-center gap-[1dvw] text-sm">
                        <Badge variant="outline" className="text-xs">
                          ✓
                        </Badge>
                        <span>Audit logging for all decrypt operations</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </>
      )}
    </div>
  )
}

export type { OutputStorageConfig as OutputStorageConfigComponent }
