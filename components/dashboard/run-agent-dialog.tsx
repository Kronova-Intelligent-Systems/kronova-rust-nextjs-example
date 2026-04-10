"use client"

import { useState, useEffect, useRef } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Loader2, Play, CheckCircle, XCircle, AlertCircle, Settings } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { apiClient } from "@/lib/api-client"
import { toast } from "sonner"
import { DataSourceSelector } from "./data-source-selector"
import { OutputStorageConfig as OutputStorageConfigComponent } from "./output-storage-config"
import { AssetSelector } from "./asset-selector"
import { ScrollArea } from "@/components/ui/scroll-area"

interface RunAgentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  agent: {
    id: string
    name: string
    description?: string
  }
}

type ExecutionStatus = "idle" | "running" | "completed" | "failed"

interface ExecutionResult {
  execution_id: string
  status: string
  response?: string
  execution_time_ms?: number
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
  confidence_score?: number
  sources?: string[]
  metadata?: any
  error?: string
}

interface DataSourceConfig {
  type: "database" | "agent_stream" | "workflow_output" | "api" | "manual"
  config: any
}

interface OutputStorageConfig {
  enabled: boolean
  encrypt: boolean
  encryptionAlgorithm?: string
  retentionDays?: number
  tags?: string[]
}

export function RunAgentDialog({ open, onOpenChange, agent }: RunAgentDialogProps) {
  const [useAPIMode, setUseAPIMode] = useState(false)
  const [prompt, setPrompt] = useState("")
  const [context, setContext] = useState("")
  const [selectedAssets, setSelectedAssets] = useState<string[]>([])
  const [dataSource, setDataSource] = useState<DataSourceConfig>({
    type: "manual",
    config: {},
  })
  const [outputStorage, setOutputStorage] = useState<OutputStorageConfig>({
    enabled: false,
    encrypt: false,
    retentionDays: 90,
    tags: [],
  })
  const [status, setStatus] = useState<ExecutionStatus>("idle")
  const [result, setResult] = useState<ExecutionResult | null>(null)
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const pollExecutionStatus = async (executionId: string) => {
    try {
      const response = await apiClient.getAgentExecutionById(executionId)

      if (response.success && response.data) {
        const executionData = response.data

        const outputData = executionData.output_data as any
        const responseText = outputData?.response || null

        console.log("[v0] Polling execution status:", executionData.status)
        console.log("[v0] Output data:", outputData)
        console.log("[v0] Response text:", responseText)

        setResult({
          execution_id: executionData.id,
          status: executionData.status,
          response: responseText,
          execution_time_ms: executionData.execution_time_ms,
          usage: outputData?.usage,
          confidence_score: outputData?.confidence_score,
          sources: outputData?.sources,
          metadata: executionData.metadata,
          error: executionData.error,
        })

        if (executionData.status === "completed" || executionData.status === "failed") {
          setStatus(executionData.status === "completed" ? "completed" : "failed")
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current)
            pollingIntervalRef.current = null
          }

          if (executionData.status === "completed") {
            toast.success("Agent execution completed")
          } else {
            toast.error("Agent execution failed")
          }
        }
      }
    } catch (error) {
      console.error("[v0] Error polling execution status:", error)
    }
  }

  const startPolling = (executionId: string) => {
    pollingIntervalRef.current = setInterval(() => {
      pollExecutionStatus(executionId)
    }, 2000)
  }

  const stopPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current)
      pollingIntervalRef.current = null
    }
  }

  useEffect(() => {
    return () => {
      stopPolling()
    }
  }, [])

  useEffect(() => {
    if (!open) {
      stopPolling()
    }
  }, [open])

  const handleRun = async () => {
    if (!prompt.trim() && dataSource.type === "manual") {
      toast.error("Please enter a prompt or configure a data source")
      return
    }

    setStatus("running")
    setResult(null)

    try {
      console.log("[v0] Starting agent execution for agent:", agent.id)
      console.log("[v0] Using API mode:", useAPIMode)

      let inputData: any = {
        prompt: prompt.trim(),
        context: context.trim() ? JSON.parse(context) : undefined,
      }

      if (selectedAssets.length > 0) {
        console.log("[v0] Fetching selected assets:", selectedAssets)
        const response = await apiClient.getAssets({})
        const assetsData = response.data || []
        const targetedAssets = assetsData.filter((asset: any) => selectedAssets.includes(asset.id))
        inputData.targetAssets = targetedAssets
        inputData.assetContext = {
          count: targetedAssets.length,
          types: [...new Set(targetedAssets.map((a: any) => a.asset_type))],
          totalValue: targetedAssets.reduce((sum: number, a: any) => sum + (a.current_value || 0), 0),
        }
        console.log("[v0] Added asset context:", inputData.assetContext)
      }

      if (dataSource.type !== "manual") {
        console.log("[v0] Fetching data from source:", dataSource.type)
        const sourceData = await fetchDataFromSource(dataSource)
        inputData = {
          ...inputData,
          sourceData,
          dataSourceType: dataSource.type,
        }
        console.log("[v0] Added source data")
      }

      if (outputStorage.enabled) {
        inputData.outputStorage = outputStorage
        console.log("[v0] Output storage enabled")
      }

      let response: any

      if (useAPIMode) {
        console.log("[v0] Executing agent via REST API")

        const { ResendItAPIClient } = await import("@/lib/resendit-api-client")
        const apiClientInstance = new ResendItAPIClient()

        const dataStreamIds = dataSource.type !== "manual" && dataSource.config?.id ? [dataSource.config.id] : []

        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin
        const webhookUrl = `${siteUrl}/api/webhooks/agent-execution`

        response = await apiClientInstance.executeAgent(agent.id, {
          prompt: prompt.trim(),
          assetIds: selectedAssets,
          dataStreamIds,
          webhookUrl,
        })

        if (response.executionId) {
          const executionId = response.executionId
          console.log("[v0] Agent execution started with ID:", executionId)
          console.log("[v0] Webhook configured at:", webhookUrl)

          setResult({
            execution_id: executionId,
            status: "running",
          })

          startPolling(executionId)
        } else {
          throw new Error("Execution failed: No execution ID returned")
        }
      } else {
        console.log("[v0] Executing agent via Supabase")
        response = await apiClient.executeAIAgent(agent.id, inputData)

        if (response.success && response.data) {
          const executionId = response.data.id
          console.log("[v0] Agent execution started with ID:", executionId)

          setResult({
            execution_id: executionId,
            status: "running",
          })

          startPolling(executionId)

          if (outputStorage.enabled && response.data.response) {
            await storeExecutionOutput(executionId, response.data.response)
          }
        } else {
          throw new Error("Execution failed: No data returned")
        }
      }
    } catch (error: any) {
      console.error("[v0] Error executing agent:")
      console.error("[v0] Error object:", error)
      console.error("[v0] Error message:", error?.message)
      console.error("[v0] Error stack:", error?.stack)
      console.error("[v0] Error name:", error?.name)

      const errorMessage =
        error?.message || error?.toString() || "Failed to execute agent. Please check the console for details."

      setStatus("failed")
      setResult({
        execution_id: "",
        status: "failed",
        error: errorMessage,
      })
      toast.error(errorMessage)
    }
  }

  const fetchDataFromSource = async (source: DataSourceConfig) => {
    try {
      switch (source.type) {
        case "database":
          return await apiClient.fetchDataFromSource({
            type: "database",
            config: source.config,
          })
        case "agent_stream":
          return await apiClient.fetchDataFromSource({
            type: "agent_execution",
            config: source.config,
          })
        case "workflow_output":
          return await apiClient.fetchDataFromSource({
            type: "workflow_run",
            config: source.config,
          })
        case "api":
          return await apiClient.fetchDataFromSource({
            type: "external_api",
            config: source.config,
          })
        default:
          return null
      }
    } catch (error) {
      console.error("[v0] Error fetching data from source:", error)
      throw error
    }
  }

  const storeExecutionOutput = async (executionId: string, output: any) => {
    try {
      await apiClient.storeWorkflowLearningData({
        execution_id: executionId,
        execution_type: "agent",
        output_data: output,
        encrypt: outputStorage.encrypt,
        encryption_algorithm: outputStorage.encryptionAlgorithm,
        retention_days: outputStorage.retentionDays,
        tags: outputStorage.tags,
      })
    } catch (error) {
      console.error("[v0] Error storing execution output:", error)
    }
  }

  const handleClose = () => {
    stopPolling()
    setPrompt("")
    setContext("")
    setSelectedAssets([])
    setDataSource({ type: "manual", config: {} })
    setOutputStorage({ enabled: false, encrypt: false, retentionDays: 90, tags: [] })
    setUseAPIMode(false)
    setStatus("idle")
    setResult(null)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-[95dvw] md:max-w-5xl h-[90dvh] md:h-auto md:max-h-[85dvh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-[4dvw] md:px-6 pt-[4dvw] md:pt-6 pb-[3dvw] md:pb-4 border-b sticky top-0 bg-background z-10">
          <DialogTitle className="flex items-center gap-[2dvw] md:gap-2 text-[4dvw] md:text-lg">
            <Play className="h-[4dvw] w-[4dvw] md:h-5 md:w-5 flex-shrink-0" />
            <span className="line-clamp-2 text-balance">Run Agent: {agent.name}</span>
          </DialogTitle>
          <DialogDescription className="text-[3dvw] md:text-sm line-clamp-2">
            {agent.description || "Configure and execute this AI agent"}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 overflow-y-auto">
          <div className="px-[4dvw] md:px-6 py-[3dvw] md:py-4 space-y-[3dvw] md:space-y-4">
            {status === "idle" && (
              <>
                <Card className="border-[0.5dvw] md:border">
                  <CardHeader className="p-[3dvw] md:p-4">
                    <CardTitle className="text-[3.5dvw] md:text-base">Agent Configuration</CardTitle>
                  </CardHeader>
                  <CardContent className="p-[3dvw] md:p-4 pt-0">
                    <div className="flex items-center justify-between gap-4 p-3 bg-muted/50 rounded-lg">
                      <div className="space-y-0.5">
                        <Label htmlFor="api-mode" className="text-sm font-medium">
                          REST API Mode
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          Use Resend-It REST API for programmatic execution
                        </p>
                      </div>
                      <Switch id="api-mode" checked={useAPIMode} onCheckedChange={setUseAPIMode} />
                    </div>
                  </CardContent>
                </Card>

                <Tabs defaultValue="input" className="w-full">
                  <TabsList className="flex w-full overflow-x-auto h-auto gap-[1dvw] md:gap-1 p-[1dvw] md:p-1 scrollbar-hide">
                    <TabsTrigger
                      value="input"
                      className="flex-shrink-0 text-[2.8dvw] md:text-sm px-[3dvw] md:px-3 py-[2dvw] md:py-2 whitespace-nowrap"
                    >
                      Input
                    </TabsTrigger>
                    <TabsTrigger
                      value="target-assets"
                      className="flex-shrink-0 text-[2.8dvw] md:text-sm px-[3dvw] md:px-3 py-[2dvw] md:py-2 whitespace-nowrap"
                    >
                      <span className="md:hidden">Assets</span>
                      <span className="hidden md:inline">Target Assets</span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="data-source"
                      className="flex-shrink-0 text-[2.8dvw] md:text-sm px-[3dvw] md:px-3 py-[2dvw] md:py-2 whitespace-nowrap"
                    >
                      <span className="md:hidden">Source</span>
                      <span className="hidden md:inline">Data Source</span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="output-storage"
                      className="flex-shrink-0 text-[2.8dvw] md:text-sm px-[3dvw] md:px-3 py-[2dvw] md:py-2 whitespace-nowrap flex items-center gap-[1.5dvw] md:gap-1"
                    >
                      <Settings className="h-[3.5dvw] w-[3.5dvw] md:h-4 md:w-4 flex-shrink-0" />
                      <span className="md:hidden">Output</span>
                      <span className="hidden md:inline">Output & Storage</span>
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="input" className="space-y-[3dvw] md:space-y-3 mt-[3dvw] md:mt-3">
                    <Card className="border-[0.5dvw] md:border">
                      <CardHeader className="p-[3dvw] md:p-4">
                        <CardTitle className="text-[3.5dvw] md:text-base">Agent Input</CardTitle>
                        <p className="text-[2.8dvw] md:text-sm text-muted-foreground mt-[1dvw] md:mt-1">
                          Provide instructions and context for the AI agent
                        </p>
                      </CardHeader>
                      <CardContent className="p-[3dvw] md:p-4 pt-0 space-y-[3dvw] md:space-y-4">
                        <div className="space-y-[2dvw] md:space-y-2">
                          <Label htmlFor="prompt">Prompt *</Label>
                          <Textarea
                            id="prompt"
                            placeholder="Enter your prompt or question for the agent..."
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            rows={4}
                            className="resize-none text-sm md:text-base"
                          />
                        </div>

                        <div className="space-y-[2dvw] md:space-y-2">
                          <Label htmlFor="context">Additional Context (JSON, optional)</Label>
                          <Textarea
                            id="context"
                            placeholder='{"key": "value"}'
                            value={context}
                            onChange={(e) => setContext(e.target.value)}
                            rows={3}
                            className="resize-none font-mono text-xs md:text-sm"
                          />
                          <p className="text-xs text-muted-foreground">Provide additional context as JSON object</p>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="target-assets" className="space-y-[3dvw] md:space-y-3 mt-[3dvw] md:mt-3">
                    <Card className="border-[0.5dvw] md:border">
                      <CardHeader className="p-[3dvw] md:p-4">
                        <CardTitle className="text-[3.5dvw] md:text-base">Target Specific Assets</CardTitle>
                        <p className="text-[2.8dvw] md:text-sm text-muted-foreground mt-[1dvw] md:mt-1">
                          Select assets to process with this agent
                        </p>
                      </CardHeader>
                      <CardContent className="p-[3dvw] md:p-4 pt-0">
                        <AssetSelector
                          selectedAssets={selectedAssets}
                          onSelectionChange={setSelectedAssets}
                          multiSelect={true}
                        />
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="data-source" className="space-y-[3dvw] md:space-y-3 mt-[3dvw] md:mt-3">
                    <Card className="border-[0.5dvw] md:border">
                      <CardHeader className="p-[3dvw] md:p-4">
                        <CardTitle className="text-[3.5dvw] md:text-base">Connect Data Source</CardTitle>
                        <p className="text-[2.8dvw] md:text-sm text-muted-foreground mt-[1dvw] md:mt-1">
                          Connect this agent to assets, other agents, workflows, or external data sources
                        </p>
                      </CardHeader>
                      <CardContent className="p-[3dvw] md:p-4 pt-0">
                        <DataSourceSelector
                          value={dataSource}
                          onChange={setDataSource}
                          description="Connect this agent to assets, other agents, workflows, or external data sources"
                        />
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="output-storage" className="space-y-[3dvw] md:space-y-3 mt-[3dvw] md:mt-3">
                    <OutputStorageConfigComponent value={outputStorage} onChange={setOutputStorage} />
                  </TabsContent>
                </Tabs>
              </>
            )}

            {status === "running" && (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-[8dvw] md:py-12">
                  <Loader2 className="h-[10dvw] md:h-12 w-[10dvw] md:w-12 animate-spin text-primary mb-[3dvw] md:mb-4" />
                  <p className="text-base md:text-lg font-medium">Executing agent...</p>
                  <p className="text-xs md:text-sm text-muted-foreground">This may take a few moments</p>
                  {result?.execution_id && (
                    <Badge variant="outline" className="mt-[2dvw] md:mt-2 text-xs">
                      ID: {result.execution_id}
                    </Badge>
                  )}
                </CardContent>
              </Card>
            )}

            {(status === "completed" || status === "failed") && result && (
              <div className="space-y-[3dvw] md:space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-[2dvw] md:gap-2 text-sm md:text-base">
                      {status === "completed" ? (
                        <>
                          <CheckCircle className="h-4 w-4 md:h-5 md:w-5 text-green-500 flex-shrink-0" />
                          <span>Execution Completed</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="h-4 w-4 md:h-5 md:w-5 text-red-500 flex-shrink-0" />
                          <span>Execution Failed</span>
                        </>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-[2dvw] md:space-y-2">
                    <div className="flex flex-wrap gap-[2dvw] md:gap-2">
                      <Badge variant="outline" className="text-xs">
                        ID: {result.execution_id || "N/A"}
                      </Badge>
                      {result.execution_time_ms && (
                        <Badge variant="outline" className="text-xs">
                          {result.execution_time_ms}ms
                        </Badge>
                      )}
                      {result.confidence_score && (
                        <Badge variant="outline" className="text-xs">
                          Confidence: {(result.confidence_score * 100).toFixed(1)}%
                        </Badge>
                      )}
                      {outputStorage.enabled && (
                        <Badge variant="outline" className="text-xs bg-green-500/10 text-green-700">
                          Stored {outputStorage.encrypt ? "& Encrypted" : ""}
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {result.response && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm md:text-base">Response</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="prose prose-sm max-w-none">
                        <p className="whitespace-pre-wrap text-xs md:text-sm break-words">{result.response}</p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {result.error && (
                  <Card className="border-red-500/50">
                    <CardHeader>
                      <CardTitle className="text-sm md:text-base flex items-center gap-[2dvw] md:gap-2 text-red-500">
                        <AlertCircle className="h-4 w-4 flex-shrink-0" />
                        Error
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xs md:text-sm text-red-600 break-words">{result.error}</p>
                    </CardContent>
                  </Card>
                )}

                {result.usage && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm md:text-base">Token Usage</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 gap-[3dvw] md:gap-4 text-xs md:text-sm">
                        <div>
                          <p className="text-muted-foreground">Prompt</p>
                          <p className="font-medium">{result.usage.prompt_tokens}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Completion</p>
                          <p className="font-medium">{result.usage.completion_tokens}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Total</p>
                          <p className="font-medium">{result.usage.total_tokens}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {result.sources && result.sources.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm md:text-base">Sources</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="list-disc list-inside space-y-1">
                        {result.sources.map((source, index) => (
                          <li key={index} className="text-xs md:text-sm break-words">
                            {source}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="px-[4dvw] md:px-6 py-[3dvw] md:py-4 border-t bg-background sticky bottom-0 z-10">
          <div className="flex justify-end gap-[2dvw] md:gap-2">
            {status === "idle" && (
              <>
                <Button
                  variant="outline"
                  onClick={handleClose}
                  className="h-[10dvw] md:h-10 px-[4dvw] md:px-4 text-[3dvw] md:text-sm bg-transparent"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleRun}
                  disabled={!prompt.trim() && dataSource.type === "manual"}
                  className="h-[10dvw] md:h-10 px-[4dvw] md:px-4 text-[3dvw] md:text-sm"
                >
                  <Play className="mr-[1.5dvw] md:mr-2 h-[3.5dvw] w-[3.5dvw] md:h-4 md:w-4" />
                  Run Agent
                </Button>
              </>
            )}
            {(status === "completed" || status === "failed") && (
              <>
                <Button
                  variant="outline"
                  onClick={() => setStatus("idle")}
                  className="h-[10dvw] md:h-10 px-[4dvw] md:px-4 text-[3dvw] md:text-sm"
                >
                  Run Again
                </Button>
                <Button onClick={handleClose} className="h-[10dvw] md:h-10 px-[4dvw] md:px-4 text-[3dvw] md:text-sm">
                  Close
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
