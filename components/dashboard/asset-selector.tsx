"use client"

import { useState, useEffect } from "react"
import { Search, Check, Building2, Package, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { apiClient } from "@/lib/api-client"

interface Asset {
  id: string
  asset_id: string
  name: string
  asset_type: string
  category: string | null
  status: string
  current_value: number | null
  description: string | null
  metadata: any
}

interface AssetSelectorProps {
  selectedAssets: string[]
  onSelectionChange: (assetIds: string[]) => void
  multiSelect?: boolean
  className?: string
}

export function AssetSelector({
  selectedAssets,
  onSelectionChange,
  multiSelect = true,
  className = "",
}: AssetSelectorProps) {
  const [assets, setAssets] = useState<Asset[]>([])
  const [filteredAssets, setFilteredAssets] = useState<Asset[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  useEffect(() => {
    loadAssets()
  }, [])

  useEffect(() => {
    filterAssets()
  }, [searchQuery, typeFilter, statusFilter, assets])

  const loadAssets = async () => {
    try {
      setLoading(true)
      const response = await apiClient.getAssets({})
      setAssets(response.data || [])
      setFilteredAssets(response.data || [])
    } catch (error) {
      console.error("Failed to load assets:", error)
      setAssets([])
      setFilteredAssets([])
    } finally {
      setLoading(false)
    }
  }

  const filterAssets = () => {
    if (!Array.isArray(assets)) {
      setFilteredAssets([])
      return
    }

    let filtered = [...assets]

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (asset) =>
          asset.name.toLowerCase().includes(query) ||
          asset.asset_id.toLowerCase().includes(query) ||
          asset.description?.toLowerCase().includes(query),
      )
    }

    // Type filter
    if (typeFilter !== "all") {
      filtered = filtered.filter((asset) => asset.asset_type === typeFilter)
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((asset) => asset.status === statusFilter)
    }

    setFilteredAssets(filtered)
  }

  const handleAssetToggle = (assetId: string) => {
    if (multiSelect) {
      if (selectedAssets.includes(assetId)) {
        onSelectionChange(selectedAssets.filter((id) => id !== assetId))
      } else {
        onSelectionChange([...selectedAssets, assetId])
      }
    } else {
      onSelectionChange([assetId])
    }
  }

  const handleSelectAll = () => {
    if (selectedAssets.length === filteredAssets.length) {
      onSelectionChange([])
    } else {
      onSelectionChange(filteredAssets.map((asset) => asset.id))
    }
  }

  const uniqueTypes = Array.from(new Set(assets.map((a) => a.asset_type)))
  const uniqueStatuses = Array.from(new Set(assets.map((a) => a.status)))

  return (
    <div className={`space-y-[2dvw] md:space-y-4 ${className}`}>
      {/* Header with selection count */}
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">
          Target Assets {selectedAssets.length > 0 && `(${selectedAssets.length} selected)`}
        </Label>
        {multiSelect && filteredAssets.length > 0 && (
          <Button type="button" variant="ghost" size="sm" onClick={handleSelectAll} className="h-8 text-xs">
            {selectedAssets.length === filteredAssets.length ? "Deselect All" : "Select All"}
          </Button>
        )}
      </div>

      {/* Search and Filters */}
      <div className="space-y-[2dvw] md:space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search assets by name, ID, or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-10"
          />
        </div>

        <div className="grid grid-cols-2 gap-[2dvw] md:gap-3">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="h-10">
              <SelectValue placeholder="Asset Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {uniqueTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-10">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {uniqueStatuses.map((status) => (
                <SelectItem key={status} value={status}>
                  {status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Asset List */}
      <ScrollArea className="h-[40dvh] md:h-[300px] rounded-lg border bg-muted/30">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : filteredAssets.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-[4dvw] md:p-6">
            <Package className="h-12 w-12 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              {searchQuery || typeFilter !== "all" || statusFilter !== "all"
                ? "No assets match your filters"
                : "No assets available"}
            </p>
          </div>
        ) : (
          <div className="p-[2dvw] md:p-4 space-y-[1.5dvw] md:space-y-2">
            {filteredAssets.map((asset) => {
              const isSelected = selectedAssets.includes(asset.id)
              return (
                <div
                  key={asset.id}
                  onClick={() => handleAssetToggle(asset.id)}
                  className={`
                    flex items-start gap-[2dvw] md:gap-3 p-[2dvw] md:p-3 rounded-lg border cursor-pointer
                    transition-all duration-200 hover:border-primary/50 hover:bg-accent/50
                    ${isSelected ? "border-primary bg-accent" : "border-border bg-background"}
                  `}
                >
                  <Checkbox checked={isSelected} onCheckedChange={() => handleAssetToggle(asset.id)} className="mt-1" />

                  <div className="flex-1 min-w-0 space-y-[1dvw] md:space-y-1">
                    <div className="flex items-start justify-between gap-[2dvw] md:gap-2">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm truncate">{asset.name}</h4>
                        <p className="text-xs text-muted-foreground truncate">ID: {asset.asset_id}</p>
                      </div>
                      {asset.current_value && (
                        <Badge variant="secondary" className="shrink-0 text-xs">
                          ${asset.current_value.toLocaleString()}
                        </Badge>
                      )}
                    </div>

                    {asset.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">{asset.description}</p>
                    )}

                    <div className="flex flex-wrap gap-[1.5dvw] md:gap-2">
                      <Badge variant="outline" className="text-xs">
                        <Building2 className="h-3 w-3 mr-1" />
                        {asset.asset_type}
                      </Badge>
                      <Badge variant={asset.status === "active" ? "default" : "secondary"} className="text-xs">
                        {asset.status}
                      </Badge>
                      {asset.category && (
                        <Badge variant="outline" className="text-xs">
                          {asset.category}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </ScrollArea>

      {/* Selected Assets Summary */}
      {selectedAssets.length > 0 && (
        <div className="p-[2dvw] md:p-3 rounded-lg bg-primary/5 border border-primary/20">
          <div className="flex items-center gap-[1.5dvw] md:gap-2">
            <Check className="h-4 w-4 text-primary shrink-0" />
            <p className="text-xs text-muted-foreground">
              {selectedAssets.length} {selectedAssets.length === 1 ? "asset" : "assets"} selected and will be passed as
              context to the execution
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
