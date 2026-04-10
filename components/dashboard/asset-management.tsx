"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { apiClient } from "@/lib/api-client"
import type { Asset, AssetIntelligenceInsight, AssetLifecycleEvent } from "@/lib/database.types"
import { AddAssetDialog } from "./add-asset-dialog"
import { AssetDetailView } from "./asset-detail-view"
import { getExplorerName } from "@/lib/blockchain-explorer"
import {
  Loader2,
  Plus,
  Search,
  Edit,
  Trash2,
  MapPin,
  DollarSign,
  Calendar,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap,
  BarChart3,
  Database,
  Settings,
  Eye,
  TrendingUp,
  Shield,
  ExternalLink,
} from "lucide-react"

export function AssetManagement() {
  const [searchTerm, setSearchTerm] = useState("")
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [selectedAssetType, setSelectedAssetType] = useState("all")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [loading, setLoading] = useState(true)
  const [assets, setAssets] = useState<Asset[]>([])
  const [assetAnalytics, setAssetAnalytics] = useState<any>(null)
  const [assetInsights, setAssetInsights] = useState<AssetIntelligenceInsight[]>([])
  const [lifecycleEvents, setLifecycleEvents] = useState<AssetLifecycleEvent[]>([])
  const [error, setError] = useState<string | null>(null)
  const [newAsset, setNewAsset] = useState({
    name: "",
    description: "",
    asset_type: "",
    category: "",
    current_location: "",
    purchase_cost: "",
    current_value: "",
    status: "active",
    specifications: "",
    maintenance_schedule: "",
  })
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null)

  useEffect(() => {
    loadData()
  }, [searchTerm, selectedAssetType, selectedStatus])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)

      const [assetsResult, analyticsResult, insightsResult, eventsResult] = await Promise.all([
        apiClient.getAssets({
          search: searchTerm || undefined,
          asset_type: selectedAssetType !== "all" ? selectedAssetType : undefined,
          status: selectedStatus !== "all" ? selectedStatus : undefined,
          limit: 50,
        }),
        apiClient.getAssetAnalytics(),
        apiClient.getAssetInsights({ limit: 10 }),
        apiClient.getLifecycleEvents({ limit: 20 }),
      ])

      setAssets(assetsResult.data || [])
      setAssetAnalytics(analyticsResult.data)
      setAssetInsights(insightsResult.data || [])
      setLifecycleEvents(eventsResult.data || [])
    } catch (err) {
      console.error("Error loading data:", err)
      setError(err instanceof Error ? err.message : "Failed to load data")
    } finally {
      setLoading(false)
    }
  }

  const handleCreateAsset = async () => {
    try {
      setLoading(true)
      await apiClient.createAsset({
        name: newAsset.name,
        description: newAsset.description,
        asset_type: newAsset.asset_type,
        category: newAsset.category,
        current_location: newAsset.current_location ? { address: newAsset.current_location } : null,
        purchase_cost: Number.parseFloat(newAsset.purchase_cost) || null,
        current_value: Number.parseFloat(newAsset.current_value) || null,
        status: newAsset.status,
        specifications: newAsset.specifications ? { notes: newAsset.specifications } : null,
        maintenance_schedule: newAsset.maintenance_schedule ? { schedule: newAsset.maintenance_schedule } : null,
        metadata: {},
        user_id: "current-user", // This should come from auth context
      })

      setShowCreateForm(false)
      setNewAsset({
        name: "",
        description: "",
        asset_type: "",
        category: "",
        current_location: "",
        purchase_cost: "",
        current_value: "",
        status: "active",
        specifications: "",
        maintenance_schedule: "",
      })
      await loadData()
    } catch (err) {
      console.error("Error creating asset:", err)
      setError(err instanceof Error ? err.message : "Failed to create asset")
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteAsset = async (assetId: string) => {
    if (confirm("Are you sure you want to delete this asset?")) {
      try {
        await apiClient.deleteAsset(assetId)
        await loadData()
      } catch (err) {
        console.error("Error deleting asset:", err)
        setError(err instanceof Error ? err.message : "Failed to delete asset")
      }
    }
  }

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

  const getAssetTypeIcon = (type: string) => {
    switch (type) {
      case "vehicle":
        return "🚗"
      case "equipment":
        return "⚙️"
      case "property":
        return "🏢"
      case "iot_device":
        return "📡"
      case "datacenter":
        return "🖥️"
      default:
        return "📦"
    }
  }

  if (loading && assets.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading assets...</span>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <AlertTriangle className="h-8 w-8 text-red-500" />
          <span className="ml-2">Error loading assets: {error}</span>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-[3dvw] md:space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-[2dvw] md:gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Assets</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assetAnalytics?.total_assets || assets?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+{assetAnalytics?.active_assets || 0}</span> active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${(assetAnalytics?.total_asset_value || 0).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Avg: ${(assetAnalytics?.avg_asset_value || 0).toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">IoT Enabled</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assetAnalytics?.iot_enabled_assets || 0}</div>
            <p className="text-xs text-muted-foreground">Smart monitoring active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Insights</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assetInsights?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Generated this month</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="assets" className="space-y-[3dvw] md:space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="assets">Assets</TabsTrigger>
          <TabsTrigger value="insights">AI Insights</TabsTrigger>
          <TabsTrigger value="lifecycle">Lifecycle</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="assets" className="space-y-[3dvw] md:space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Asset Management</CardTitle>
              <CardDescription>Manage your enterprise assets with AI-powered analytics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-[2dvw] md:gap-4 mb-[3dvw] md:mb-6">
                <div className="flex-1">
                  <Label htmlFor="search">Search Assets</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="search"
                      placeholder="Search by name, category, or location..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="asset-type">Asset Type</Label>
                  <Select value={selectedAssetType} onValueChange={setSelectedAssetType}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="vehicle">Vehicle</SelectItem>
                      <SelectItem value="equipment">Equipment</SelectItem>
                      <SelectItem value="property">Property</SelectItem>
                      <SelectItem value="iot_device">IoT Device</SelectItem>
                      <SelectItem value="datacenter">Data Center</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button onClick={() => setShowAddDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Asset
                  </Button>
                </div>
              </div>

              <div className="grid gap-[2dvw] md:gap-4">
                {assets?.map((asset: Asset) => (
                  <Card key={asset.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-[3dvw] md:p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-[2dvw] md:gap-3 mb-[2dvw] md:mb-3">
                            <span className="text-2xl">{getAssetTypeIcon(asset.asset_type)}</span>
                            <div>
                              <h3 className="font-semibold text-lg">{asset.name}</h3>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="secondary">{asset.asset_type}</Badge>
                                <Badge variant="outline">{asset.category}</Badge>
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
                                {asset.metadata?.blockchain && (
                                  <Badge
                                    variant="outline"
                                    className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/20"
                                  >
                                    {(asset.metadata.blockchain as string).toUpperCase()}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>

                          <p className="text-sm text-muted-foreground mb-[2dvw] md:mb-3">{asset.description}</p>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-[2dvw] md:gap-4 text-sm">
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-muted-foreground" />
                              <span>{(asset.current_location as any)?.address || "Unknown"}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <DollarSign className="h-4 w-4 text-muted-foreground" />
                              <span>${asset.current_value?.toLocaleString() || 0}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span>{new Date(asset.created_at || "").toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Shield className="h-4 w-4 text-muted-foreground" />
                              <span>Risk: {asset.risk_score || "Low"}</span>
                            </div>
                          </div>

                          {asset.metadata?.blockchain && asset.metadata?.explorer_url && (
                            <div className="mt-3 pt-3 border-t">
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
                          )}
                        </div>

                        <div className="flex gap-2 ml-4">
                          <Button variant="outline" size="sm" onClick={() => setSelectedAsset(asset)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Settings className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteAsset(asset.id)}
                            disabled={loading}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {assets?.length === 0 && (
                <div className="text-center py-12">
                  <Database className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg font-medium mb-2">No assets found</p>
                  <p className="text-muted-foreground mb-4">
                    Create your first asset to get started with intelligent asset management.
                  </p>
                  <Button onClick={() => setShowAddDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Asset
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-[3dvw] md:space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>AI-Generated Insights</CardTitle>
              <CardDescription>Intelligent analysis and recommendations for your assets</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-[2dvw] md:space-y-4">
                {assetInsights?.map((insight: AssetIntelligenceInsight) => (
                  <Card key={insight.id} className="border-l-4 border-l-blue-500">
                    <CardContent className="p-[3dvw] md:p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge
                              variant={
                                insight.priority === "high"
                                  ? "destructive"
                                  : insight.priority === "medium"
                                    ? "secondary"
                                    : "default"
                              }
                            >
                              {insight.priority} priority
                            </Badge>
                            <Badge variant="outline">{insight.insight_type}</Badge>
                            <span className="text-sm text-muted-foreground">
                              Confidence: {((insight.confidence_score || 0) * 100).toFixed(0)}%
                            </span>
                          </div>
                          <h4 className="font-medium mb-2">
                            {(insight.insight_data as any)?.title || "Asset Insight"}
                          </h4>
                          <p className="text-sm text-muted-foreground mb-2">
                            {(insight.insight_data as any)?.description}
                          </p>
                          {insight.recommendations && (
                            <div className="text-sm">
                              <span className="font-medium">Recommendations:</span>
                              <ul className="list-disc list-inside mt-1 text-muted-foreground">
                                {(insight.recommendations as string[]).map((rec: string, idx: number) => (
                                  <li key={idx}>{rec}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(insight.created_at || "").toLocaleDateString()}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )) || (
                  <div className="text-center py-8">
                    <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      No AI insights available yet. Insights will appear as your assets generate data.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="lifecycle" className="space-y-[3dvw] md:space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Asset Lifecycle Events</CardTitle>
              <CardDescription>Track important events and changes in your asset lifecycle</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-[2dvw] md:space-y-4">
                {lifecycleEvents?.map((event: AssetLifecycleEvent) => (
                  <Card key={event.id}>
                    <CardContent className="p-[3dvw] md:p-4">
                      <div className="flex items-start gap-[2dvw] md:gap-4">
                        <div className="flex-shrink-0">
                          {event.event_type === "maintenance" && <Settings className="h-5 w-5 text-blue-500" />}
                          {event.event_type === "purchase" && <DollarSign className="h-5 w-5 text-green-500" />}
                          {event.event_type === "inspection" && <Eye className="h-5 w-5 text-purple-500" />}
                          {event.event_type === "repair" && <AlertTriangle className="h-5 w-5 text-yellow-500" />}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-medium">
                              {event.event_type.charAt(0).toUpperCase() + event.event_type.slice(1)}
                            </h4>
                            <Badge variant={event.event_status === "completed" ? "default" : "secondary"}>
                              {event.event_status}
                            </Badge>
                            {event.severity && (
                              <Badge variant={event.severity === "high" ? "destructive" : "outline"}>
                                {event.severity}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{event.description}</p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>{new Date(event.event_date).toLocaleDateString()}</span>
                            {event.cost && <span>Cost: ${event.cost.toLocaleString()}</span>}
                            {event.performed_by && <span>By: {event.performed_by}</span>}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )) || (
                  <div className="text-center py-8">
                    <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      No lifecycle events recorded yet. Events will appear as you manage your assets.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-[3dvw] md:space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-[3dvw] md:gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Asset Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Vehicles</span>
                    <span className="font-medium">{assets.filter((a) => a.asset_type === "vehicle").length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Equipment</span>
                    <span className="font-medium">{assets.filter((a) => a.asset_type === "equipment").length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Properties</span>
                    <span className="font-medium">{assets.filter((a) => a.asset_type === "property").length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">IoT Devices</span>
                    <span className="font-medium">{assets.filter((a) => a.asset_type === "iot_device").length}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Value Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Total Asset Value</span>
                    <span className="font-medium">${(assetAnalytics?.total_asset_value || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Average Asset Value</span>
                    <span className="font-medium">${(assetAnalytics?.avg_asset_value || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Maintenance Assets</span>
                    <span className="font-medium">{assets.filter((a) => a.status === "maintenance").length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">IoT Enabled Assets</span>
                    <span className="font-medium">{assets.filter((a) => a.iot_sensor_id).length}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <AddAssetDialog open={showAddDialog} onOpenChange={setShowAddDialog} />

      {selectedAsset && (
        <AssetDetailView
          asset={selectedAsset}
          onClose={() => setSelectedAsset(null)}
          onEdit={() => {
            // TODO: Implement edit functionality
            console.log("Edit asset:", selectedAsset.id)
          }}
        />
      )}
    </div>
  )
}
