"use client"

import { useState, useEffect, useRef } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Loader2, Play, CheckCircle, XCircle, AlertCircle, WorkflowIcon, Settings } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { apiClient } from "@/lib/api-client"
import { toast } from "sonner"
import { ScrollArea } from "@/components/ui/scroll-area"
import { DataSourceSelector } from "./data-source-selector"
import { OutputStorageConfig } from "./output-storage-config"
import { AssetSelector } from "./asset-selector"

interface ExecuteWorkflowDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  workflow: {
    id: string
    name: string
    description?: string | null
    steps: any
  }
}

type ExecutionStatus = "idle" | "running" | "completed" | "failed"

interface WorkflowRunResult {
  execution_id: string
  status: string
  started_at: string
  completed_at?: string
  execution_time_ms?: number
  step_results?: Array<{
    step_id: string
    step_name: string
    status: string
    started_at: string
    completed_at?: string
    output?: any
    error?: string
  }>
  output_data?: any
  error?: string
}

export function ExecuteWorkflowDialog({ open, onOpenChange, workflow }: ExecuteWorkflowDialogProps) {
  const [dataSourceConfig, setDataSourceConfig] = useState<any>(null)
  const [selectedAssets, setSelectedAssets] = useState<string[]>([])
  const [outputStorageConfig, setOutputStorageConfig] = useState<any>({
    store_output: true,
    store_in_learning_data: false,
    encrypt_output: false,
    retention_days: 90,
    include_metadata: true,
  })
  const [status, setStatus] = useState<ExecutionStatus>("idle")
  const [result, setResult] = useState<WorkflowRunResult | null>(null)
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const stepCount = Array.isArray(workflow.steps) ? workflow.steps.length : Object.keys(workflow.steps || {}).length

  const pollWorkflowStatus = async (runId: string) => {
    try {
      const response = await apiClient.getWorkflowRunById(runId)

      if (response.success && response.data) {
        const runData = response.data

        setResult({
          execution_id: runData.id,
          status: runData.status,
          started_at: runData.start_time || runData.created_at,
          completed_at: runData.end_time,
          execution_time_ms: runData.execution_time_ms,
          step_results: runData.results?.step_results,
          output_data: runData.results?.output_data,
          error: runData.error,
        })

        if (runData.status === "completed" || runData.status === "failed") {
          setStatus(runData.status === "completed" ? "completed" : "failed")
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current)
            pollingIntervalRef.current = null
          }

          if (runData.status === "completed") {
            toast.success("Workflow execution completed")
            if (outputStorageConfig.store_in_learning_data) {
              await storeWorkflowLearningData(runData)
            }
          } else {
            toast.error("Workflow execution failed")
          }
        }
      }
    } catch (error) {
      console.error("[v0] Error polling workflow status:", error)
    }
  }

  const storeWorkflowLearningData = async (runData: any) => {
    try {
      const {
        data: { user },
      } = await apiClient["supabase"].auth.getUser()

      if (!user) return

      await apiClient.storeWorkflowLearningData({
        workflow_id: workflow.id,
        run_id: runData.id,
        user_id: user.id,
        performance_metrics: {
          execution_time_ms: runData.execution_time_ms,
          step_count: runData.results?.step_results?.length || 0,
          success_rate: runData.status === "completed" ? 1 : 0,
        },
        decision_outcomes: runData.results?.step_results,
        optimization_suggestions: null,
        encrypt: outputStorageConfig.encrypt_output,
        encryption_algorithm: outputStorageConfig.encryption_algorithm,
      })

      toast.success("Learning data stored successfully")
    } catch (error) {
      console.error("[v0] Error storing learning data:", error)
      toast.error("Failed to store learning data")
    }
  }

  const startPolling = (runId: string) => {
    pollingIntervalRef.current = setInterval(() => {
      pollWorkflowStatus(runId)
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

  const handleExecute = async () => {
    setStatus("running")
    setResult(null)

    try {
      let inputData = undefined

      if (selectedAssets.length > 0) {
        const { data: assetsData } = await apiClient.getAssets({})
        const targetedAssets = (assetsData || []).filter((asset) => selectedAssets.includes(asset.id))
        inputData = {
          targetAssets: targetedAssets,
          assetContext: {
            count: targetedAssets.length,
            types: [...new Set(targetedAssets.map((a) => a.asset_type))],
            totalValue: targetedAssets.reduce((sum, a) => sum + (a.current_value || 0), 0),
          },
        }
        toast.success(`Targeting ${targetedAssets.length} assets`)
      }

      if (dataSourceConfig) {
        const sourceData = await apiClient.fetchDataFromSource(dataSourceConfig)
        inputData = {
          ...inputData,
          sourceData: sourceData.data,
        }
        toast.success(`Loaded ${Array.isArray(sourceData.data) ? sourceData.data.length : 1} records from data source`)
      }

      const response = await apiClient.executeWorkflow(workflow.id, inputData)

      if (response.success && response.data) {
        const runId = response.data.id

        setResult({
          execution_id: runId,
          status: "running",
          started_at: response.data.start_time || new Date().toISOString(),
        })

        startPolling(runId)
      } else {
        throw new Error("Execution failed")
      }
    } catch (error: any) {
      console.error("[v0] Workflow execution error:", error)
      setStatus("failed")
      setResult({
        execution_id: "",
        status: "failed",
        started_at: new Date().toISOString(),
        error: error.message || "Failed to execute workflow",
      })
      toast.error("Failed to execute workflow")
    }
  }

  const handleClose = () => {
    stopPolling()
    setDataSourceConfig(null)
    setSelectedAssets([])
    setStatus("idle")
    setResult(null)
    onOpenChange(false)
  }

  const getStepStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500/10 text-green-500 border-green-500/20"
      case "failed":
        return "bg-red-500/10 text-red-500 border-red-500/20"
      case "skipped":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
      default:
        return "bg-gray-500/10 text-gray-500 border-gray-500/20"
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-[95dvw] md:max-w-5xl h-[90dvh] md:h-auto md:max-h-[85dvh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-[4dvw] md:px-6 pt-[4dvw] md:pt-6 pb-[3dvw] md:pb-4 border-b sticky top-0 bg-background z-10">
          <DialogTitle className="flex items-center gap-[2dvw] md:gap-2 text-[4dvw] md:text-lg">
            <Play className="h-[4dvw] w-[4dvw] md:h-5 md:w-5 flex-shrink-0" />
            <span className="line-clamp-2 text-balance">Execute Workflow: {workflow.name}</span>
          </DialogTitle>
          <DialogDescription className="text-[3dvw] md:text-sm line-clamp-2">
            {workflow.description || "Configure and run this workflow"}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 overflow-y-auto">
          <div className="px-[4dvw] md:px-6 py-[3dvw] md:py-4 space-y-[3dvw] md:space-y-4">
            {status === "idle" && (
              <>
                <Card className="border-[0.5dvw] md:border">
                  <CardHeader className="p-[3dvw] md:p-4">
                    <CardTitle className="text-[3.5dvw] md:text-base">Workflow Information</CardTitle>
                  </CardHeader>
                  <CardContent className="p-[3dvw] md:p-4 pt-0 space-y-[2dvw] md:space-y-2">
                    <div className="flex items-center gap-[2dvw] md:gap-2 text-[3dvw] md:text-sm">
                      <WorkflowIcon className="h-[3.5dvw] w-[3.5dvw] md:h-4 md:w-4 text-muted-foreground flex-shrink-0" />
                      <span className="text-muted-foreground">Steps:</span>
                      <Badge
                        variant="outline"
                        className="text-[2.5dvw] md:text-xs px-[2dvw] md:px-2 py-[0.5dvw] md:py-0.5"
                      >
                        {stepCount}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                <Tabs defaultValue="target-assets" className="w-full">
                  <TabsList className="flex w-full overflow-x-auto h-auto gap-[1dvw] md:gap-1 p-[1dvw] md:p-1 scrollbar-hide">
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

                  <TabsContent value="target-assets" className="space-y-[3dvw] md:space-y-3 mt-[3dvw] md:mt-3">
                    <Card className="border-[0.5dvw] md:border">
                      <CardHeader className="p-[3dvw] md:p-4">
                        <CardTitle className="text-[3.5dvw] md:text-base">Target Specific Assets</CardTitle>
                        <p className="text-[2.8dvw] md:text-sm text-muted-foreground mt-[1dvw] md:mt-1">
                          Select assets to process with this workflow
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
                          Connect this workflow to assets, AI agents, or other data sources
                        </p>
                      </CardHeader>
                      <CardContent className="p-[3dvw] md:p-4 pt-0">
                        <DataSourceSelector value={dataSourceConfig} onChange={setDataSourceConfig} />
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="output-storage" className="space-y-[3dvw] md:space-y-3 mt-[3dvw] md:mt-3">
                    <OutputStorageConfig value={outputStorageConfig} onChange={setOutputStorageConfig} />
                  </TabsContent>
                </Tabs>
              </>
            )}

            {status === "running" && (
              <Card className="border-[0.5dvw] md:border">
                <CardContent className="flex flex-col items-center justify-center py-[8dvw] md:py-12 px-[4dvw] md:px-4">
                  <Loader2 className="h-[10dvw] w-[10dvw] md:h-12 md:w-12 animate-spin text-primary mb-[3dvw] md:mb-4" />
                  <p className="text-[4dvw] md:text-lg font-medium text-center">Executing workflow...</p>
                  <p className="text-[3dvw] md:text-sm text-muted-foreground mt-[1dvw] md:mt-1">
                    Processing {stepCount} steps
                  </p>
                  {result?.execution_id && (
                    <Badge variant="outline" className="mt-[2dvw] md:mt-2 text-[2.5dvw] md:text-xs px-[2dvw] md:px-2">
                      ID: {result.execution_id}
                    </Badge>
                  )}
                </CardContent>
              </Card>
            )}

            {(status === "completed" || status === "failed") && result && (
              <div className="space-y-[3dvw] md:space-y-4">
                <Card className="border-[0.5dvw] md:border">
                  <CardHeader className="p-[3dvw] md:p-4">
                    <CardTitle className="flex items-center gap-[2dvw] md:gap-2 text-[3.5dvw] md:text-base">
                      {status === "completed" ? (
                        <>
                          <CheckCircle className="h-[4dvw] w-[4dvw] md:h-5 md:w-5 text-green-500 flex-shrink-0" />
                          <span>Execution Completed</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="h-[4dvw] w-[4dvw] md:h-5 md:w-5 text-red-500 flex-shrink-0" />
                          <span>Execution Failed</span>
                        </>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-[3dvw] md:p-4 pt-0 space-y-[2dvw] md:space-y-2">
                    <div className="flex flex-wrap gap-[2dvw] md:gap-2">
                      <Badge variant="outline" className="text-[2.5dvw] md:text-xs px-[2dvw] md:px-2">
                        ID: {result.execution_id || "N/A"}
                      </Badge>
                      {result.execution_time_ms && (
                        <Badge variant="outline" className="text-[2.5dvw] md:text-xs px-[2dvw] md:px-2">
                          {result.execution_time_ms}ms
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-[2.5dvw] md:text-xs px-[2dvw] md:px-2">
                        Started: {new Date(result.started_at).toLocaleTimeString()}
                      </Badge>
                      {result.completed_at && (
                        <Badge variant="outline" className="text-[2.5dvw] md:text-xs px-[2dvw] md:px-2">
                          Completed: {new Date(result.completed_at).toLocaleTimeString()}
                        </Badge>
                      )}
                    </div>
                    {outputStorageConfig.store_in_learning_data && status === "completed" && (
                      <div className="flex items-center gap-[2dvw] md:gap-2 text-[2.8dvw] md:text-sm text-green-600">
                        <CheckCircle className="h-[3.5dvw] w-[3.5dvw] md:h-4 md:w-4 flex-shrink-0" />
                        <span>Learning data stored successfully</span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {result.error && (
                  <Card className="border-red-500/50 border-[0.5dvw] md:border">
                    <CardHeader className="p-[3dvw] md:p-4">
                      <CardTitle className="text-[3.5dvw] md:text-base flex items-center gap-[2dvw] md:gap-2 text-red-500">
                        <AlertCircle className="h-[3.5dvw] w-[3.5dvw] md:h-4 md:w-4 flex-shrink-0" />
                        Error
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-[3dvw] md:p-4 pt-0">
                      <p className="text-[2.8dvw] md:text-sm text-red-600 break-words">{result.error}</p>
                    </CardContent>
                  </Card>
                )}

                {result.step_results && result.step_results.length > 0 && (
                  <Card className="border-[0.5dvw] md:border">
                    <CardHeader className="p-[3dvw] md:p-4">
                      <CardTitle className="text-[3.5dvw] md:text-base">Step Results</CardTitle>
                    </CardHeader>
                    <CardContent className="p-[3dvw] md:p-4 pt-0">
                      <div className="space-y-[2.5dvw] md:space-y-3">
                        {result.step_results.map((step, index) => (
                          <div
                            key={step.step_id || index}
                            className="border rounded-lg p-[2.5dvw] md:p-3 space-y-[2dvw] md:space-y-2 border-[0.5dvw] md:border"
                          >
                            <div className="flex items-center justify-between gap-[2dvw] md:gap-2">
                              <div className="flex items-center gap-[2dvw] md:gap-2 flex-1 min-w-0">
                                <span className="font-medium text-[3dvw] md:text-sm truncate">{step.step_name}</span>
                                <Badge
                                  className={`${getStepStatusColor(step.status)} text-[2.5dvw] md:text-xs px-[1.5dvw] md:px-1.5 flex-shrink-0`}
                                >
                                  {step.status}
                                </Badge>
                              </div>
                              {step.completed_at && (
                                <span className="text-[2.5dvw] md:text-xs text-muted-foreground flex-shrink-0">
                                  {new Date(step.completed_at).toLocaleTimeString()}
                                </span>
                              )}
                            </div>

                            {step.output && (
                              <div className="bg-muted/50 rounded p-[2.5dvw] md:p-2 overflow-hidden">
                                <pre className="text-[2.5dvw] md:text-xs overflow-x-auto whitespace-pre-wrap break-words">
                                  {JSON.stringify(step.output, null, 2)}
                                </pre>
                              </div>
                            )}

                            {step.error && (
                              <div className="bg-red-500/10 border border-red-500/20 rounded p-[2.5dvw] md:p-2 border-[0.5dvw] md:border">
                                <p className="text-[2.5dvw] md:text-xs text-red-600 break-words">{step.error}</p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {result.output_data && (
                  <Card className="border-[0.5dvw] md:border">
                    <CardHeader className="p-[3dvw] md:p-4">
                      <CardTitle className="text-[3.5dvw] md:text-base">Output Data</CardTitle>
                    </CardHeader>
                    <CardContent className="p-[3dvw] md:p-4 pt-0">
                      <div className="bg-muted/50 rounded p-[2.5dvw] md:p-3 overflow-hidden">
                        <pre className="text-[2.5dvw] md:text-xs overflow-x-auto whitespace-pre-wrap break-words">
                          {JSON.stringify(result.output_data, null, 2)}
                        </pre>
                      </div>
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
                <Button onClick={handleExecute} className="h-[10dvw] md:h-10 px-[4dvw] md:px-4 text-[3dvw] md:text-sm">
                  <Play className="mr-[1.5dvw] md:mr-2 h-[3.5dvw] w-[3.5dvw] md:h-4 md:w-4" />
                  Execute Workflow
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
