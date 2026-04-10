"use client"

import type React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import type { Asset } from "@/lib/database.types"
import { getExplorerName } from "@/lib/blockchain-explorer"
import {
  X,
  Edit,
  MapPin,
  DollarSign,
  Calendar,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap,
  BarChart3,
  Shield,
  ExternalLink,
  Cpu,
  Battery,
  TrendingUp,
  Wrench,
  FileText,
  Leaf,
  QrCode,
  Radio,
  Brain,
  Workflow,
  Package,
} from "lucide-react"

interface AssetDetailViewProps {
  asset: Asset
  onClose: () => void
  onEdit?: () => void
}

export function AssetDetailView({ asset, onClose, onEdit }: AssetDetailViewProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "maintenance":
        return <Clock className="h-4 w-4 text-yellow-500" />
      case "inactive":
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      default:
        return <Activity className="h-4 w-4 text-gray-500" />
    }
  }

  const formatDate = (date: string | null) => {
    if (!date) return "N/A"
    return new Date(date).toLocaleDateString()
  }

  const formatCurrency = (value: number | null) => {
    if (!value) return "$0.00"
    return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
      <div className="fixed inset-4 z-50 overflow-y-auto">
        <Card className="max-w-6xl mx-auto">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <CardTitle className="text-2xl">{asset.name}</CardTitle>
                  <div className="flex items-center gap-1">
                    {getStatusIcon(asset.status)}
                    <Badge
                      variant={
                        asset.status === "active"
                          ? "default"
                          : asset.status === "maintenance"
                            ? "secondary"
                            : "destructive"
                      }
                    >
                      {asset.status}
                    </Badge>
                  </div>
                </div>
                <CardDescription className="flex items-center gap-2">
                  <Badge variant="secondary">{asset.asset_type}</Badge>
                  {asset.category && <Badge variant="outline">{asset.category}</Badge>}
                  {asset.metadata?.blockchain && (
                    <Badge
                      variant="outline"
                      className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/20"
                    >
                      {(asset.metadata.blockchain as string).toUpperCase()}
                    </Badge>
                  )}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                {onEdit && (
                  <Button variant="outline" size="sm" onClick={onEdit}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={onClose}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-7">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="financial">Financial</TabsTrigger>
                <TabsTrigger value="location">Location</TabsTrigger>
                <TabsTrigger value="operations">Operations</TabsTrigger>
                <TabsTrigger value="ai">AI & Analytics</TabsTrigger>
                <TabsTrigger value="compliance">Compliance</TabsTrigger>
                <TabsTrigger value="technical">Technical</TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <InfoField icon={<FileText className="h-4 w-4" />} label="Asset ID" value={asset.asset_id} />
                  <InfoField icon={<Package className="h-4 w-4" />} label="Category" value={asset.category || "N/A"} />
                  <InfoField
                    icon={<Calendar className="h-4 w-4" />}
                    label="Created"
                    value={formatDate(asset.created_at)}
                  />
                  <InfoField
                    icon={<Calendar className="h-4 w-4" />}
                    label="Updated"
                    value={formatDate(asset.updated_at)}
                  />
                </div>

                <Separator />

                <div>
                  <h4 className="font-medium mb-2">Description</h4>
                  <p className="text-sm text-muted-foreground">{asset.description || "No description provided"}</p>
                </div>

                {asset.specifications && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="font-medium mb-3">Specifications</h4>
                      <div className="grid grid-cols-2 gap-3">
                        {Object.entries(asset.specifications as Record<string, any>).map(([key, value]) => (
                          <div key={key} className="text-sm">
                            <span className="font-medium">{key}:</span>{" "}
                            <span className="text-muted-foreground">{String(value)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {asset.metadata && Object.keys(asset.metadata as Record<string, any>).length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="font-medium mb-3">Metadata</h4>
                      <div className="grid grid-cols-2 gap-3">
                        {Object.entries(asset.metadata as Record<string, any>).map(([key, value]) => (
                          <div key={key} className="text-sm">
                            <span className="font-medium">{key}:</span>{" "}
                            <span className="text-muted-foreground">{String(value)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </TabsContent>

              {/* Financial Tab */}
              <TabsContent value="financial" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <InfoField
                    icon={<DollarSign className="h-4 w-4" />}
                    label="Current Value"
                    value={formatCurrency(asset.current_value)}
                  />
                  <InfoField
                    icon={<DollarSign className="h-4 w-4" />}
                    label="Purchase Cost"
                    value={formatCurrency(asset.purchase_cost)}
                  />
                  <InfoField
                    icon={<Calendar className="h-4 w-4" />}
                    label="Purchase Date"
                    value={formatDate(asset.purchase_date)}
                  />
                  <InfoField
                    icon={<TrendingUp className="h-4 w-4" />}
                    label="Depreciation Rate"
                    value={asset.depreciation_rate ? `${asset.depreciation_rate}%` : "N/A"}
                  />
                </div>

                {asset.maintenance_schedule && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <Wrench className="h-4 w-4" />
                        Maintenance Schedule
                      </h4>
                      <div className="grid grid-cols-2 gap-3">
                        <InfoField label="Last Maintenance" value={formatDate(asset.last_maintenance_date)} />
                        <InfoField label="Next Maintenance" value={formatDate(asset.next_maintenance_date)} />
                      </div>
                      <div className="mt-3 p-3 bg-muted rounded-lg">
                        <pre className="text-xs overflow-auto">
                          {JSON.stringify(asset.maintenance_schedule, null, 2)}
                        </pre>
                      </div>
                    </div>
                  </>
                )}
              </TabsContent>

              {/* Location Tab */}
              <TabsContent value="location" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <InfoField
                    icon={<MapPin className="h-4 w-4" />}
                    label="Location ID"
                    value={asset.location_id || "N/A"}
                  />
                </div>

                {asset.current_location && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="font-medium mb-3">Current Location</h4>
                      <div className="p-3 bg-muted rounded-lg">
                        <pre className="text-xs overflow-auto">{JSON.stringify(asset.current_location, null, 2)}</pre>
                      </div>
                    </div>
                  </>
                )}

                {asset.location && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="font-medium mb-3">Location Data</h4>
                      <div className="p-3 bg-muted rounded-lg">
                        <pre className="text-xs overflow-auto">{JSON.stringify(asset.location, null, 2)}</pre>
                      </div>
                    </div>
                  </>
                )}

                <Separator />
                <div className="grid grid-cols-3 gap-4">
                  <InfoField icon={<QrCode className="h-4 w-4" />} label="QR Code" value={asset.qr_code || "N/A"} />
                  <InfoField icon={<Radio className="h-4 w-4" />} label="NFC Tag" value={asset.nfc_tag_id || "N/A"} />
                  <InfoField
                    icon={<Zap className="h-4 w-4" />}
                    label="IoT Sensor"
                    value={asset.iot_sensor_id || "N/A"}
                  />
                </div>
              </TabsContent>

              {/* Operations Tab */}
              <TabsContent value="operations" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <InfoField
                    icon={<Activity className="h-4 w-4" />}
                    label="Operational Status"
                    value={asset.operational_status || "N/A"}
                  />
                  <InfoField
                    icon={<Battery className="h-4 w-4" />}
                    label="Battery Level"
                    value={asset.battery_level ? `${asset.battery_level}%` : "N/A"}
                  />
                  <InfoField
                    icon={<Zap className="h-4 w-4" />}
                    label="Speed"
                    value={asset.speed ? `${asset.speed} units` : "N/A"}
                  />
                  <InfoField
                    icon={<Package className="h-4 w-4" />}
                    label="Payload Capacity"
                    value={asset.payload_capacity ? `${asset.payload_capacity} kg` : "N/A"}
                  />
                  <InfoField
                    icon={<Clock className="h-4 w-4" />}
                    label="Total Runtime"
                    value={asset.total_runtime_hours ? `${asset.total_runtime_hours} hrs` : "N/A"}
                  />
                  <InfoField
                    icon={<AlertTriangle className="h-4 w-4" />}
                    label="Error Count"
                    value={asset.error_count?.toString() || "0"}
                  />
                  <InfoField
                    icon={<TrendingUp className="h-4 w-4" />}
                    label="Task Progress"
                    value={asset.task_progress ? `${asset.task_progress}%` : "N/A"}
                  />
                </div>

                {asset.current_task && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="font-medium mb-3">Current Task</h4>
                      <div className="p-3 bg-muted rounded-lg">
                        <pre className="text-xs overflow-auto">{JSON.stringify(asset.current_task, null, 2)}</pre>
                      </div>
                    </div>
                  </>
                )}

                {asset.task_queue && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="font-medium mb-3">Task Queue</h4>
                      <div className="p-3 bg-muted rounded-lg">
                        <pre className="text-xs overflow-auto">{JSON.stringify(asset.task_queue, null, 2)}</pre>
                      </div>
                    </div>
                  </>
                )}

                {asset.capabilities && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="font-medium mb-3">Capabilities</h4>
                      <div className="p-3 bg-muted rounded-lg">
                        <pre className="text-xs overflow-auto">{JSON.stringify(asset.capabilities, null, 2)}</pre>
                      </div>
                    </div>
                  </>
                )}

                {asset.sensors && asset.sensors.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="font-medium mb-3">Sensors</h4>
                      <div className="flex flex-wrap gap-2">
                        {asset.sensors.map((sensor, idx) => (
                          <Badge key={idx} variant="outline">
                            {sensor}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {asset.special_tools && asset.special_tools.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="font-medium mb-3">Special Tools</h4>
                      <div className="flex flex-wrap gap-2">
                        {asset.special_tools.map((tool, idx) => (
                          <Badge key={idx} variant="outline">
                            {tool}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </TabsContent>

              {/* AI & Analytics Tab */}
              <TabsContent value="ai" className="space-y-4">
                {asset.ai_agent_config && (
                  <div>
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <Brain className="h-4 w-4" />
                      AI Agent Configuration
                    </h4>
                    <div className="p-3 bg-muted rounded-lg">
                      <pre className="text-xs overflow-auto">{JSON.stringify(asset.ai_agent_config, null, 2)}</pre>
                    </div>
                  </div>
                )}

                {asset.predictive_data && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <BarChart3 className="h-4 w-4" />
                        Predictive Analytics
                      </h4>
                      <div className="p-3 bg-muted rounded-lg">
                        <pre className="text-xs overflow-auto">{JSON.stringify(asset.predictive_data, null, 2)}</pre>
                      </div>
                    </div>
                  </>
                )}

                {asset.workflow_settings && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <Workflow className="h-4 w-4" />
                        Workflow Settings
                      </h4>
                      <div className="p-3 bg-muted rounded-lg">
                        <pre className="text-xs overflow-auto">{JSON.stringify(asset.workflow_settings, null, 2)}</pre>
                      </div>
                    </div>
                  </>
                )}

                {!asset.ai_agent_config && !asset.predictive_data && !asset.workflow_settings && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Brain className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No AI or analytics configuration available</p>
                  </div>
                )}
              </TabsContent>

              {/* Compliance Tab */}
              <TabsContent value="compliance" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <InfoField
                    icon={<Shield className="h-4 w-4" />}
                    label="Risk Score"
                    value={asset.risk_score?.toString() || "N/A"}
                  />
                </div>

                {asset.compliance_data && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        Compliance Data
                      </h4>
                      <div className="p-3 bg-muted rounded-lg">
                        <pre className="text-xs overflow-auto">{JSON.stringify(asset.compliance_data, null, 2)}</pre>
                      </div>
                    </div>
                  </>
                )}

                {asset.esg_metrics && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <Leaf className="h-4 w-4" />
                        ESG Metrics
                      </h4>
                      <div className="p-3 bg-muted rounded-lg">
                        <pre className="text-xs overflow-auto">{JSON.stringify(asset.esg_metrics, null, 2)}</pre>
                      </div>
                    </div>
                  </>
                )}

                {!asset.compliance_data && !asset.esg_metrics && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Shield className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No compliance or ESG data available</p>
                  </div>
                )}
              </TabsContent>

              {/* Technical Tab */}
              <TabsContent value="technical" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <InfoField icon={<Cpu className="h-4 w-4" />} label="System ID" value={asset.id} />
                  <InfoField icon={<FileText className="h-4 w-4" />} label="User ID" value={asset.user_id} />
                </div>

                {asset.embedding_vector && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="font-medium mb-3">Embedding Vector</h4>
                      <div className="p-3 bg-muted rounded-lg">
                        <p className="text-xs font-mono break-all">{asset.embedding_vector.substring(0, 200)}...</p>
                      </div>
                    </div>
                  </>
                )}

                {asset.metadata?.blockchain && asset.metadata?.explorer_url && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="font-medium mb-3">Blockchain Information</h4>
                      <div className="space-y-3">
                        <InfoField label="Blockchain" value={(asset.metadata.blockchain as string).toUpperCase()} />
                        {asset.metadata.address && (
                          <InfoField label="Address" value={asset.metadata.address as string} />
                        )}
                        {asset.metadata.transaction_hash && (
                          <InfoField label="Transaction Hash" value={asset.metadata.transaction_hash as string} />
                        )}
                        <a
                          href={asset.metadata.explorer_url as string}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                        >
                          <ExternalLink className="h-4 w-4" />
                          View on {getExplorerName(asset.metadata.blockchain as string)}
                        </a>
                      </div>
                    </div>
                  </>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function InfoField({ icon, label, value }: { icon?: React.ReactNode; label: string; value: string }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        {icon}
        <span>{label}</span>
      </div>
      <p className="text-sm font-medium break-all">{value}</p>
    </div>
  )
}
