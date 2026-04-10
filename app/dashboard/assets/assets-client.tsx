"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AddAssetDialog } from "@/components/dashboard/add-asset-dialog"
import {
  Database,
  Search,
  Filter,
  Plus,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Edit,
  Trash2,
  Eye,
} from "lucide-react"
import { AssetManagement } from "@/components/dashboard/asset-management"
import type { Database as DatabaseType } from "@/lib/database.types"

type Asset = DatabaseType["public"]["Tables"]["assets"]["Row"]

interface AssetsPageClientProps {
  assets: Asset[]
  stats: {
    total: number
    active: number
    pending: number
    critical: number
  }
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
}

export function AssetsPageClient({ assets, stats }: AssetsPageClientProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [filteredAssets, setFilteredAssets] = useState(assets)
  const [addAssetOpen, setAddAssetOpen] = useState(false)

  const handleSearch = (term: string) => {
    setSearchTerm(term)
    const filtered = assets.filter(
      (asset) =>
        asset.name.toLowerCase().includes(term.toLowerCase()) ||
        asset.asset_type.toLowerCase().includes(term.toLowerCase()) ||
        (asset.description && asset.description.toLowerCase().includes(term.toLowerCase())),
    )
    setFilteredAssets(filtered)
  }

  const formatCurrency = (amount: number | null) => {
    if (!amount) return "N/A"
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "inactive":
        return "bg-gray-100 text-gray-800"
      case "maintenance":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="flex-1 space-y-4 p-[4dvw] md:p-8 pt-6">
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
        <motion.div variants={itemVariants} className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Assets Management</h2>
            <p className="text-muted-foreground">Comprehensive asset intelligence and lifecycle management</p>
          </div>
          <Button className="gap-2" onClick={() => setAddAssetOpen(true)}>
            <Plus className="h-4 w-4" />
            Add Asset
          </Button>
        </motion.div>

        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-[2dvw] md:gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search assets..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>
          <Button variant="outline" className="gap-2 bg-transparent">
            <Filter className="h-4 w-4" />
            Filters
          </Button>
        </motion.div>

        <motion.div variants={itemVariants} className="grid gap-[2dvw] md:gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Assets</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Total registered assets</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Assets</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.active.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0}% operational status
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pending.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Awaiting approval</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Critical Issues</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.critical.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">High risk score assets</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="list">Asset List</TabsTrigger>
              <TabsTrigger value="management">Management</TabsTrigger>
              <TabsTrigger value="insights">AI Insights</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid gap-[2dvw] md:gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                  <CardHeader>
                    <CardTitle>Recent Assets</CardTitle>
                    <CardDescription>Latest registered assets</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-[2dvw] md:space-y-4">
                      {assets.slice(0, 5).map((asset) => (
                        <div key={asset.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex-1">
                            <h4 className="font-medium">{asset.name}</h4>
                            <p className="text-sm text-muted-foreground">{asset.asset_type}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={getStatusColor(asset.status)}>{asset.status}</Badge>
                            <span className="text-sm font-medium">{formatCurrency(asset.current_value)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                <Card className="col-span-3">
                  <CardHeader>
                    <CardTitle>Asset Categories</CardTitle>
                    <CardDescription>Distribution by type</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {Object.entries(
                        assets.reduce(
                          (acc, asset) => {
                            acc[asset.asset_type] = (acc[asset.asset_type] || 0) + 1
                            return acc
                          },
                          {} as Record<string, number>,
                        ),
                      )
                        .slice(0, 5)
                        .map(([type, count]) => (
                          <div key={type} className="flex items-center justify-between">
                            <span className="text-sm capitalize">{type}</span>
                            <Badge variant="secondary">{count}</Badge>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="list" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>All Assets ({filteredAssets.length})</CardTitle>
                  <CardDescription>Complete list of registered assets</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-[2dvw] md:space-y-4">
                    {filteredAssets.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        {searchTerm ? "No assets found matching your search." : "No assets registered yet."}
                      </div>
                    ) : (
                      <div className="grid gap-[2dvw] md:gap-4">
                        {filteredAssets.map((asset) => (
                          <Card key={asset.id} className="p-[3dvw] md:p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex-1 space-y-[1.5dvw] md:space-y-2">
                                <div className="flex items-center gap-3">
                                  <h3 className="font-semibold">{asset.name}</h3>
                                  <Badge className={getStatusColor(asset.status)}>{asset.status}</Badge>
                                  {asset.risk_score && asset.risk_score > 7 && (
                                    <Badge variant="destructive">High Risk</Badge>
                                  )}
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-[2dvw] md:gap-4 text-sm">
                                  <div>
                                    <span className="text-muted-foreground">Type:</span>
                                    <p className="font-medium capitalize">{asset.asset_type}</p>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Value:</span>
                                    <p className="font-medium">{formatCurrency(asset.current_value)}</p>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Asset ID:</span>
                                    <p className="font-medium font-mono text-xs">{asset.asset_id}</p>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Created:</span>
                                    <p className="font-medium">
                                      {asset.created_at ? new Date(asset.created_at).toLocaleDateString() : "N/A"}
                                    </p>
                                  </div>
                                </div>
                                {asset.description && (
                                  <p className="text-sm text-muted-foreground">{asset.description}</p>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <Button variant="ghost" size="sm">
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm">
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="management">
              <AssetManagement />
            </TabsContent>

            <TabsContent value="insights" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>AI-Powered Asset Insights</CardTitle>
                  <CardDescription>Intelligent recommendations and predictions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {stats.critical > 0 && (
                      <div className="p-4 border rounded-lg border-red-200 bg-red-50">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertTriangle className="h-4 w-4 text-red-600" />
                          <span className="font-medium text-red-800">Critical Assets Alert</span>
                        </div>
                        <p className="text-sm text-red-700">
                          {stats.critical} assets have high risk scores and require immediate attention
                        </p>
                      </div>
                    )}

                    {stats.pending > 0 && (
                      <div className="p-4 border rounded-lg border-yellow-200 bg-yellow-50">
                        <div className="flex items-center gap-2 mb-2">
                          <Clock className="h-4 w-4 text-yellow-600" />
                          <span className="font-medium text-yellow-800">Pending Reviews</span>
                        </div>
                        <p className="text-sm text-yellow-700">
                          {stats.pending} assets are pending review and approval
                        </p>
                      </div>
                    )}

                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="h-4 w-4 text-green-600" />
                        <span className="font-medium">Portfolio Health</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0}% of your assets are
                        currently active and operational
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </motion.div>
      <AddAssetDialog open={addAssetOpen} onOpenChange={setAddAssetOpen} />
    </div>
  )
}
