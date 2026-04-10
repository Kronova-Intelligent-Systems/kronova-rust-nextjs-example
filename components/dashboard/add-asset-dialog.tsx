"use client"

import type React from "react"
import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Loader2, Plus, X, MapPin, Info, DollarSign, Scan, Brain, Shield } from "lucide-react"
import { ApiClient } from "@/lib/api-client"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"

interface AddAssetDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AddAssetDialog({ open, onOpenChange }: AddAssetDialogProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  // Basic Information
  const [name, setName] = useState("")
  const [assetType, setAssetType] = useState<
    "equipment" | "vehicle" | "building" | "infrastructure" | "technology" | "inventory" | "digital"
  >("equipment")
  const [category, setCategory] = useState("")
  const [description, setDescription] = useState("")
  const [status, setStatus] = useState("active")

  // Financial Data
  const [purchaseCost, setPurchaseCost] = useState("")
  const [currentValue, setCurrentValue] = useState("")
  const [depreciationRate, setDepreciationRate] = useState("")
  const [purchaseDate, setPurchaseDate] = useState("")

  // Location Data
  const [locationAddress, setLocationAddress] = useState("")
  const [locationCity, setLocationCity] = useState("")
  const [locationState, setLocationState] = useState("")
  const [locationZip, setLocationZip] = useState("")
  const [locationCountry, setLocationCountry] = useState("")
  const [latitude, setLatitude] = useState("")
  const [longitude, setLongitude] = useState("")

  // Tracking & IoT
  const [qrCode, setQrCode] = useState("")
  const [nfcTagId, setNfcTagId] = useState("")
  const [iotSensorId, setIotSensorId] = useState("")

  // Specifications (key-value pairs)
  const [specifications, setSpecifications] = useState<Array<{ key: string; value: string }>>([{ key: "", value: "" }])

  // AI Configuration
  const [aiEnabled, setAiEnabled] = useState(false)
  const [aiModel, setAiModel] = useState("")
  const [aiUpdateFrequency, setAiUpdateFrequency] = useState("daily")

  // Predictive Analytics
  const [predictiveEnabled, setPredictiveEnabled] = useState(false)
  const [predictiveModel, setPredictiveModel] = useState("")
  const [maintenancePrediction, setMaintenancePrediction] = useState(false)

  // Workflow Settings
  const [workflowEnabled, setWorkflowEnabled] = useState(false)
  const [autoApproval, setAutoApproval] = useState(false)
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)

  // Maintenance Schedule
  const [maintenanceFrequency, setMaintenanceFrequency] = useState("monthly")
  const [nextMaintenanceDate, setNextMaintenanceDate] = useState("")
  const [maintenanceProvider, setMaintenanceProvider] = useState("")

  // Compliance & Risk
  const [complianceStandards, setComplianceStandards] = useState<string[]>([])
  const [complianceInput, setComplianceInput] = useState("")
  const [riskScore, setRiskScore] = useState("")
  const [insuranceRequired, setInsuranceRequired] = useState(false)

  // ESG Metrics
  const [carbonFootprint, setCarbonFootprint] = useState("")
  const [energyEfficiency, setEnergyEfficiency] = useState("")
  const [sustainabilityRating, setSustainabilityRating] = useState("")

  // Metadata (key-value pairs)
  const [metadata, setMetadata] = useState<Array<{ key: string; value: string }>>([{ key: "", value: "" }])

  const addSpecification = () => {
    setSpecifications([...specifications, { key: "", value: "" }])
  }

  const removeSpecification = (index: number) => {
    setSpecifications(specifications.filter((_, i) => i !== index))
  }

  const updateSpecification = (index: number, field: "key" | "value", value: string) => {
    const updated = [...specifications]
    updated[index][field] = value
    setSpecifications(updated)
  }

  const addMetadata = () => {
    setMetadata([...metadata, { key: "", value: "" }])
  }

  const removeMetadata = (index: number) => {
    setMetadata(metadata.filter((_, i) => i !== index))
  }

  const updateMetadata = (index: number, field: "key" | "value", value: string) => {
    const updated = [...metadata]
    updated[index][field] = value
    setMetadata(updated)
  }

  const addComplianceStandard = () => {
    if (complianceInput.trim()) {
      setComplianceStandards([...complianceStandards, complianceInput.trim()])
      setComplianceInput("")
    }
  }

  const removeComplianceStandard = (index: number) => {
    setComplianceStandards(complianceStandards.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      console.log("[v0] Creating asset with asset_type:", assetType)
      console.log("[v0] Creating asset with comprehensive data")

      const apiClient = new ApiClient()

      // Build location JSON
      const currentLocation = locationAddress
        ? {
            address: locationAddress,
            city: locationCity,
            state: locationState,
            zip: locationZip,
            country: locationCountry,
            coordinates:
              latitude && longitude ? { lat: Number.parseFloat(latitude), lng: Number.parseFloat(longitude) } : null,
          }
        : null

      // Build specifications JSON
      const specificationsJson = specifications
        .filter((spec) => spec.key && spec.value)
        .reduce((acc, spec) => ({ ...acc, [spec.key]: spec.value }), {})

      // Build AI agent config JSON
      const aiAgentConfig = aiEnabled
        ? {
            enabled: true,
            model: aiModel,
            updateFrequency: aiUpdateFrequency,
            features: {
              predictiveMaintenance: maintenancePrediction,
              anomalyDetection: true,
              performanceOptimization: true,
            },
          }
        : null

      // Build predictive data JSON
      const predictiveData = predictiveEnabled
        ? {
            enabled: true,
            model: predictiveModel,
            predictions: {
              maintenanceRequired: maintenancePrediction,
              estimatedLifespan: null,
              failureRisk: null,
            },
          }
        : null

      // Build workflow settings JSON
      const workflowSettings = workflowEnabled
        ? {
            enabled: true,
            autoApproval,
            notifications: notificationsEnabled,
            approvalChain: [],
          }
        : null

      // Build maintenance schedule JSON
      const maintenanceSchedule = nextMaintenanceDate
        ? {
            frequency: maintenanceFrequency,
            nextDate: nextMaintenanceDate,
            provider: maintenanceProvider,
            tasks: [],
          }
        : null

      // Build compliance data JSON
      const complianceData =
        complianceStandards.length > 0
          ? {
              standards: complianceStandards,
              insuranceRequired,
              certifications: [],
              lastAudit: null,
            }
          : null

      // Build ESG metrics JSON
      const esgMetrics =
        carbonFootprint || energyEfficiency || sustainabilityRating
          ? {
              carbonFootprint: carbonFootprint ? Number.parseFloat(carbonFootprint) : null,
              energyEfficiency: energyEfficiency ? Number.parseFloat(energyEfficiency) : null,
              sustainabilityRating: sustainabilityRating || null,
              renewableEnergy: false,
            }
          : null

      // Build metadata JSON
      const metadataJson = metadata
        .filter((meta) => meta.key && meta.value)
        .reduce((acc, meta) => ({ ...acc, [meta.key]: meta.value }), {})

      const assetData = {
        name,
        asset_type: assetType,
        category: category || null,
        description: description || null,
        status,
        current_value: currentValue ? Number.parseFloat(currentValue) : null,
        purchase_cost: purchaseCost ? Number.parseFloat(purchaseCost) : null,
        purchase_date: purchaseDate || null,
        depreciation_rate: depreciationRate ? Number.parseFloat(depreciationRate) : null,
        current_location: currentLocation,
        qr_code: qrCode || null,
        nfc_tag_id: nfcTagId || null,
        iot_sensor_id: iotSensorId || null,
        specifications: Object.keys(specificationsJson).length > 0 ? specificationsJson : null,
        ai_agent_config: aiAgentConfig,
        predictive_data: predictiveData,
        workflow_settings: workflowSettings,
        maintenance_schedule: maintenanceSchedule,
        compliance_data: complianceData,
        esg_metrics: esgMetrics,
        risk_score: riskScore ? Number.parseFloat(riskScore) : null,
        metadata: Object.keys(metadataJson).length > 0 ? metadataJson : null,
      }

      console.log("[v0] Asset data being sent:", JSON.stringify(assetData, null, 2))

      const result = await apiClient.createAsset(assetData)
      console.log("[v0] Asset created successfully:", result)

      // Reset form
      resetForm()
      onOpenChange(false)
      router.refresh()
    } catch (error) {
      console.error("[v0] Error creating asset:", error)
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
      alert(`Failed to create asset: ${errorMessage}`)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setName("")
    setAssetType("equipment")
    setCategory("")
    setDescription("")
    setStatus("active")
    setPurchaseCost("")
    setCurrentValue("")
    setDepreciationRate("")
    setPurchaseDate("")
    setLocationAddress("")
    setLocationCity("")
    setLocationState("")
    setLocationZip("")
    setLocationCountry("")
    setLatitude("")
    setLongitude("")
    setQrCode("")
    setNfcTagId("")
    setIotSensorId("")
    setSpecifications([{ key: "", value: "" }])
    setAiEnabled(false)
    setAiModel("")
    setAiUpdateFrequency("daily")
    setPredictiveEnabled(false)
    setPredictiveModel("")
    setMaintenancePrediction(false)
    setWorkflowEnabled(false)
    setAutoApproval(false)
    setNotificationsEnabled(true)
    setMaintenanceFrequency("monthly")
    setNextMaintenanceDate("")
    setMaintenanceProvider("")
    setComplianceStandards([])
    setComplianceInput("")
    setRiskScore("")
    setInsuranceRequired(false)
    setCarbonFootprint("")
    setEnergyEfficiency("")
    setSustainabilityRating("")
    setMetadata([{ key: "", value: "" }])
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95dvw] md:max-w-4xl max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Asset</DialogTitle>
          <DialogDescription>
            Create a comprehensive asset profile with AI-powered intelligence and tracking
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-6 h-auto md:h-10">
              <TabsTrigger value="basic" className="flex items-center justify-center gap-1 px-[1dvw] md:px-3">
                <Info className="h-4 w-4" />
                <span className="hidden md:inline text-sm">Basic</span>
              </TabsTrigger>
              <TabsTrigger value="financial" className="flex items-center justify-center gap-1 px-[1dvw] md:px-3">
                <DollarSign className="h-4 w-4" />
                <span className="hidden md:inline text-sm">Financial</span>
              </TabsTrigger>
              <TabsTrigger value="location" className="flex items-center justify-center gap-1 px-[1dvw] md:px-3">
                <MapPin className="h-4 w-4" />
                <span className="hidden md:inline text-sm">Location</span>
              </TabsTrigger>
              <TabsTrigger value="tracking" className="flex items-center justify-center gap-1 px-[1dvw] md:px-3">
                <Scan className="h-4 w-4" />
                <span className="hidden md:inline text-sm">Tracking</span>
              </TabsTrigger>
              <TabsTrigger value="ai" className="flex items-center justify-center gap-1 px-[1dvw] md:px-3">
                <Brain className="h-4 w-4" />
                <span className="hidden md:inline text-sm">AI & Analytics</span>
              </TabsTrigger>
              <TabsTrigger value="compliance" className="flex items-center justify-center gap-1 px-[1dvw] md:px-3">
                <Shield className="h-4 w-4" />
                <span className="hidden md:inline text-sm">Compliance</span>
              </TabsTrigger>
            </TabsList>

            {/* Basic Information Tab */}
            <TabsContent value="basic" className="space-y-[2dvw] md:space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Asset Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder="e.g., Office Building A, Forklift #123"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-[2dvw] md:gap-4">
                <div className="space-y-2">
                  <Label htmlFor="asset_type">
                    Asset Type <span className="text-red-500">*</span>
                  </Label>
                  <Select value={assetType} onValueChange={setAssetType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="equipment">Equipment</SelectItem>
                      <SelectItem value="vehicle">Vehicle</SelectItem>
                      <SelectItem value="building">Building</SelectItem>
                      <SelectItem value="infrastructure">Infrastructure</SelectItem>
                      <SelectItem value="technology">Technology</SelectItem>
                      <SelectItem value="inventory">Inventory</SelectItem>
                      <SelectItem value="digital">Digital</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                      <SelectItem value="retired">Retired</SelectItem>
                      <SelectItem value="disposed">Disposed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  placeholder="e.g., Heavy Machinery, Commercial Real Estate"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Detailed description of the asset..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                />
              </div>

              <div className="space-y-3">
                <Label>Specifications</Label>
                {specifications.map((spec, index) => (
                  <div key={index} className="flex gap-[1dvw] md:gap-2">
                    <Input
                      placeholder="Property name"
                      value={spec.key}
                      onChange={(e) => updateSpecification(index, "key", e.target.value)}
                    />
                    <Input
                      placeholder="Value"
                      value={spec.value}
                      onChange={(e) => updateSpecification(index, "value", e.target.value)}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => removeSpecification(index)}
                      disabled={specifications.length === 1}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={addSpecification}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Specification
                </Button>
              </div>
            </TabsContent>

            {/* Financial Tab */}
            <TabsContent value="financial" className="space-y-[2dvw] md:space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-[2dvw] md:gap-4">
                <div className="space-y-2">
                  <Label htmlFor="purchase_cost">Purchase Cost ($)</Label>
                  <Input
                    id="purchase_cost"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={purchaseCost}
                    onChange={(e) => setPurchaseCost(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="current_value">Current Value ($)</Label>
                  <Input
                    id="current_value"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={currentValue}
                    onChange={(e) => setCurrentValue(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-[2dvw] md:gap-4">
                <div className="space-y-2">
                  <Label htmlFor="purchase_date">Purchase Date</Label>
                  <Input
                    id="purchase_date"
                    type="date"
                    value={purchaseDate}
                    onChange={(e) => setPurchaseDate(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="depreciation_rate">Depreciation Rate (%)</Label>
                  <Input
                    id="depreciation_rate"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={depreciationRate}
                    onChange={(e) => setDepreciationRate(e.target.value)}
                  />
                </div>
              </div>

              <Card>
                <CardContent className="pt-[3dvw] md:pt-6">
                  <h4 className="font-medium mb-[2dvw] md:mb-4">Maintenance Schedule</h4>
                  <div className="space-y-[2dvw] md:space-y-4">
                    <div className="grid grid-cols-2 gap-[2dvw] md:gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="maintenance_frequency">Frequency</Label>
                        <Select value={maintenanceFrequency} onValueChange={setMaintenanceFrequency}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                            <SelectItem value="quarterly">Quarterly</SelectItem>
                            <SelectItem value="annually">Annually</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="next_maintenance">Next Maintenance Date</Label>
                        <Input
                          id="next_maintenance"
                          type="date"
                          value={nextMaintenanceDate}
                          onChange={(e) => setNextMaintenanceDate(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="maintenance_provider">Maintenance Provider</Label>
                      <Input
                        id="maintenance_provider"
                        placeholder="Provider name or contact"
                        value={maintenanceProvider}
                        onChange={(e) => setMaintenanceProvider(e.target.value)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Location Tab */}
            <TabsContent value="location" className="space-y-[2dvw] md:space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="location_address">
                  <MapPin className="inline h-4 w-4 mr-1" />
                  Street Address
                </Label>
                <Input
                  id="location_address"
                  placeholder="123 Main Street"
                  value={locationAddress}
                  onChange={(e) => setLocationAddress(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-[2dvw] md:gap-4">
                <div className="space-y-2">
                  <Label htmlFor="location_city">City</Label>
                  <Input
                    id="location_city"
                    placeholder="New York"
                    value={locationCity}
                    onChange={(e) => setLocationCity(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location_state">State/Province</Label>
                  <Input
                    id="location_state"
                    placeholder="NY"
                    value={locationState}
                    onChange={(e) => setLocationState(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-[2dvw] md:gap-4">
                <div className="space-y-2">
                  <Label htmlFor="location_zip">ZIP/Postal Code</Label>
                  <Input
                    id="location_zip"
                    placeholder="10001"
                    value={locationZip}
                    onChange={(e) => setLocationZip(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location_country">Country</Label>
                  <Input
                    id="location_country"
                    placeholder="United States"
                    value={locationCountry}
                    onChange={(e) => setLocationCountry(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-[2dvw] md:gap-4">
                <div className="space-y-2">
                  <Label htmlFor="latitude">Latitude</Label>
                  <Input
                    id="latitude"
                    type="number"
                    step="any"
                    placeholder="40.7128"
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="longitude">Longitude</Label>
                  <Input
                    id="longitude"
                    type="number"
                    step="any"
                    placeholder="-74.0060"
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value)}
                  />
                </div>
              </div>
            </TabsContent>

            {/* Tracking Tab */}
            <TabsContent value="tracking" className="space-y-[2dvw] md:space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="qr_code">QR Code</Label>
                <Input
                  id="qr_code"
                  placeholder="QR code identifier"
                  value={qrCode}
                  onChange={(e) => setQrCode(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="nfc_tag_id">NFC Tag ID</Label>
                <Input
                  id="nfc_tag_id"
                  placeholder="NFC tag identifier"
                  value={nfcTagId}
                  onChange={(e) => setNfcTagId(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="iot_sensor_id">IoT Sensor ID</Label>
                <Input
                  id="iot_sensor_id"
                  placeholder="IoT sensor identifier"
                  value={iotSensorId}
                  onChange={(e) => setIotSensorId(e.target.value)}
                />
              </div>

              <div className="space-y-3 pt-[2dvw] md:pt-4">
                <Label>Custom Metadata</Label>
                {metadata.map((meta, index) => (
                  <div key={index} className="flex gap-[1dvw] md:gap-2">
                    <Input
                      placeholder="Key"
                      value={meta.key}
                      onChange={(e) => updateMetadata(index, "key", e.target.value)}
                    />
                    <Input
                      placeholder="Value"
                      value={meta.value}
                      onChange={(e) => updateMetadata(index, "value", e.target.value)}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => removeMetadata(index)}
                      disabled={metadata.length === 1}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={addMetadata}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Metadata
                </Button>
              </div>
            </TabsContent>

            {/* AI & Analytics Tab */}
            <TabsContent value="ai" className="space-y-[2dvw] md:space-y-4 mt-4">
              <Card>
                <CardContent className="pt-[3dvw] md:pt-6">
                  <div className="flex items-center justify-between mb-[2dvw] md:mb-4">
                    <div>
                      <h4 className="font-medium">AI Agent Configuration</h4>
                      <p className="text-sm text-muted-foreground">Enable AI-powered asset intelligence</p>
                    </div>
                    <Switch checked={aiEnabled} onCheckedChange={setAiEnabled} />
                  </div>

                  {aiEnabled && (
                    <div className="space-y-[2dvw] md:space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="ai_model">AI Model</Label>
                        <Input
                          id="ai_model"
                          placeholder="e.g., gpt-4, claude-3"
                          value={aiModel}
                          onChange={(e) => setAiModel(e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="ai_frequency">Update Frequency</Label>
                        <Select value={aiUpdateFrequency} onValueChange={setAiUpdateFrequency}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="realtime">Real-time</SelectItem>
                            <SelectItem value="hourly">Hourly</SelectItem>
                            <SelectItem value="daily">Daily</SelectItem>
                            <SelectItem value="weekly">Weekly</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-[3dvw] md:pt-6">
                  <div className="flex items-center justify-between mb-[2dvw] md:mb-4">
                    <div>
                      <h4 className="font-medium">Predictive Analytics</h4>
                      <p className="text-sm text-muted-foreground">Enable predictive maintenance and forecasting</p>
                    </div>
                    <Switch checked={predictiveEnabled} onCheckedChange={setPredictiveEnabled} />
                  </div>

                  {predictiveEnabled && (
                    <div className="space-y-[2dvw] md:space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="predictive_model">Predictive Model</Label>
                        <Input
                          id="predictive_model"
                          placeholder="Model identifier"
                          value={predictiveModel}
                          onChange={(e) => setPredictiveModel(e.target.value)}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <Label htmlFor="maintenance_prediction">Maintenance Prediction</Label>
                        <Switch
                          id="maintenance_prediction"
                          checked={maintenancePrediction}
                          onCheckedChange={setMaintenancePrediction}
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-[3dvw] md:pt-6">
                  <div className="flex items-center justify-between mb-[2dvw] md:mb-4">
                    <div>
                      <h4 className="font-medium">Workflow Automation</h4>
                      <p className="text-sm text-muted-foreground">Configure automated workflows</p>
                    </div>
                    <Switch checked={workflowEnabled} onCheckedChange={setWorkflowEnabled} />
                  </div>

                  {workflowEnabled && (
                    <div className="space-y-[2dvw] md:space-y-4">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="auto_approval">Auto-approval</Label>
                        <Switch id="auto_approval" checked={autoApproval} onCheckedChange={setAutoApproval} />
                      </div>

                      <div className="flex items-center justify-between">
                        <Label htmlFor="notifications">Notifications</Label>
                        <Switch
                          id="notifications"
                          checked={notificationsEnabled}
                          onCheckedChange={setNotificationsEnabled}
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Compliance Tab */}
            <TabsContent value="compliance" className="space-y-[2dvw] md:space-y-4 mt-4">
              <Card>
                <CardContent className="pt-[3dvw] md:pt-6">
                  <h4 className="font-medium mb-[2dvw] md:mb-4">Compliance Standards</h4>
                  <div className="space-y-[2dvw] md:space-y-4">
                    <div className="flex gap-[1dvw] md:gap-2">
                      <Input
                        placeholder="Add compliance standard (e.g., ISO 9001)"
                        value={complianceInput}
                        onChange={(e) => setComplianceInput(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault()
                            addComplianceStandard()
                          }
                        }}
                      />
                      <Button type="button" onClick={addComplianceStandard}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>

                    {complianceStandards.length > 0 && (
                      <div className="flex flex-wrap gap-[1dvw] md:gap-2">
                        {complianceStandards.map((standard, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-1 bg-secondary text-secondary-foreground px-3 py-1 rounded-md"
                          >
                            <span className="text-sm">{standard}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-4 w-4 p-0"
                              onClick={() => removeComplianceStandard(index)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2">
                      <Label htmlFor="insurance_required">Insurance Required</Label>
                      <Switch
                        id="insurance_required"
                        checked={insuranceRequired}
                        onCheckedChange={setInsuranceRequired}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="risk_score">Risk Score (0-100)</Label>
                      <Input
                        id="risk_score"
                        type="number"
                        min="0"
                        max="100"
                        placeholder="50"
                        value={riskScore}
                        onChange={(e) => setRiskScore(e.target.value)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-[3dvw] md:pt-6">
                  <h4 className="font-medium mb-[2dvw] md:mb-4">ESG Metrics</h4>
                  <div className="space-y-[2dvw] md:space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="carbon_footprint">Carbon Footprint (kg CO₂)</Label>
                      <Input
                        id="carbon_footprint"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={carbonFootprint}
                        onChange={(e) => setCarbonFootprint(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="energy_efficiency">Energy Efficiency Rating (0-100)</Label>
                      <Input
                        id="energy_efficiency"
                        type="number"
                        min="0"
                        max="100"
                        placeholder="75"
                        value={energyEfficiency}
                        onChange={(e) => setEnergyEfficiency(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="sustainability_rating">Sustainability Rating</Label>
                      <Select value={sustainabilityRating} onValueChange={setSustainabilityRating}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select rating" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="A+">A+ (Excellent)</SelectItem>
                          <SelectItem value="A">A (Very Good)</SelectItem>
                          <SelectItem value="B">B (Good)</SelectItem>
                          <SelectItem value="C">C (Fair)</SelectItem>
                          <SelectItem value="D">D (Poor)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-[3dvw] md:mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !name}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Asset
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
