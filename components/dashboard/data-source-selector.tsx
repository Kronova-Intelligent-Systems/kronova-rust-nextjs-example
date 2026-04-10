"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Database, Workflow, Bot, Table, Plus, X } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface DataSourceConfig {
  source_type: "table" | "agent_stream" | "workflow_output" | "external_api"
  source_id?: string
  table_name?: string
  columns?: string[]
  filters?: DataFilter[]
  agent_id?: string
  workflow_id?: string
  data_format?: "json" | "jsonb" | "text" | "binary" | "csv"
}

interface DataFilter {
  column: string
  operator: "eq" | "neq" | "gt" | "lt" | "gte" | "lte" | "like" | "in"
  value: string
}

interface DataSourceSelectorProps {
  value?: DataSourceConfig
  onChange: (config: DataSourceConfig) => void
}

export function DataSourceSelector({ value, onChange }: DataSourceSelectorProps) {
  const [sourceType, setSourceType] = useState<DataSourceConfig["source_type"]>(value?.source_type || "table")
  const [tableName, setTableName] = useState(value?.table_name || "")
  const [availableTables, setAvailableTables] = useState<string[]>([])
  const [availableColumns, setAvailableColumns] = useState<string[]>([])
  const [selectedColumns, setSelectedColumns] = useState<string[]>(value?.columns || [])
  const [filters, setFilters] = useState<DataFilter[]>(value?.filters || [])
  const [agents, setAgents] = useState<any[]>([])
  const [workflows, setWorkflows] = useState<any[]>([])
  const [dataFormat, setDataFormat] = useState<DataSourceConfig["data_format"]>(value?.data_format || "json")

  const supabase = createClient()

  useEffect(() => {
    loadAvailableTables()
    loadAgents()
    loadWorkflows()
  }, [])

  useEffect(() => {
    if (tableName) {
      loadTableColumns(tableName)
    }
  }, [tableName])

  useEffect(() => {
    // Update parent component with current configuration
    const config: DataSourceConfig = {
      source_type: sourceType,
      data_format: dataFormat,
    }

    if (sourceType === "table") {
      config.table_name = tableName
      config.columns = selectedColumns
      config.filters = filters
    } else if (sourceType === "agent_stream") {
      config.agent_id = value?.agent_id
    } else if (sourceType === "workflow_output") {
      config.workflow_id = value?.workflow_id
    }

    onChange(config)
  }, [sourceType, tableName, selectedColumns, filters, dataFormat])

  const loadAvailableTables = async () => {
    const tables = [
      "assets",
      "ai_agents",
      "ai_workflows",
      "ai_agent_executions",
      "workflow_executions",
      "asset_intelligence_insights",
      "asset_lifecycle_events",
      "iot_sensors",
      "iot_sensor_readings",
    ]
    setAvailableTables(tables)
  }

  const loadTableColumns = async (table: string) => {
    const columnMap: Record<string, string[]> = {
      assets: [
        "id",
        "name",
        "asset_type",
        "status",
        "current_value",
        "description",
        "metadata",
        "specifications",
        "current_location",
      ],
      ai_agents: ["id", "name", "description", "model_id", "system_prompt", "parameters", "is_active"],
      ai_workflows: ["id", "name", "description", "trigger_type", "is_active", "status"],
      ai_agent_executions: ["id", "agent_id", "input_data", "output_data", "status", "execution_time_ms"],
      workflow_executions: ["id", "workflow_id", "input_data", "output_data", "status", "step_results"],
      asset_intelligence_insights: ["id", "asset_id", "insight_type", "insight_data", "confidence_score"],
      asset_lifecycle_events: ["id", "asset_id", "event_type", "event_date", "description"],
      iot_sensors: ["id", "sensor_id", "sensor_type", "location", "status"],
      iot_sensor_readings: ["id", "sensor_id", "reading_type", "value", "unit", "timestamp"],
    }
    setAvailableColumns(columnMap[table] || [])
  }

  const loadAgents = async () => {
    const { data } = await supabase.from("ai_agents").select("id, name, description").eq("is_active", true)
    setAgents(data || [])
  }

  const loadWorkflows = async () => {
    const { data } = await supabase.from("ai_workflows").select("id, name, description").eq("is_active", true)
    setWorkflows(data || [])
  }

  const toggleColumn = (column: string) => {
    setSelectedColumns((prev) => (prev.includes(column) ? prev.filter((c) => c !== column) : [...prev, column]))
  }

  const addFilter = () => {
    setFilters([...filters, { column: "", operator: "eq", value: "" }])
  }

  const updateFilter = (index: number, field: keyof DataFilter, value: string) => {
    const newFilters = [...filters]
    newFilters[index] = { ...newFilters[index], [field]: value }
    setFilters(newFilters)
  }

  const removeFilter = (index: number) => {
    setFilters(filters.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-[2dvw]">
      {/* Source Type Selection */}
      <div className="space-y-[1dvw]">
        <Label>Data Source Type</Label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-[1.5dvw]">
          <Card
            className={`p-[2dvw] cursor-pointer transition-all ${
              sourceType === "table" ? "border-primary bg-primary/5" : "hover:border-primary/50"
            }`}
            onClick={() => setSourceType("table")}
          >
            <div className="flex flex-col items-center gap-[1dvw] text-center">
              <Database className="h-[4dvw] w-[4dvw] md:h-6 md:w-6" />
              <div className="text-sm font-medium">Database Table</div>
            </div>
          </Card>

          <Card
            className={`p-[2dvw] cursor-pointer transition-all ${
              sourceType === "agent_stream" ? "border-primary bg-primary/5" : "hover:border-primary/50"
            }`}
            onClick={() => setSourceType("agent_stream")}
          >
            <div className="flex flex-col items-center gap-[1dvw] text-center">
              <Bot className="h-[4dvw] w-[4dvw] md:h-6 md:w-6" />
              <div className="text-sm font-medium">AI Agent Stream</div>
            </div>
          </Card>

          <Card
            className={`p-[2dvw] cursor-pointer transition-all ${
              sourceType === "workflow_output" ? "border-primary bg-primary/5" : "hover:border-primary/50"
            }`}
            onClick={() => setSourceType("workflow_output")}
          >
            <div className="flex flex-col items-center gap-[1dvw] text-center">
              <Workflow className="h-[4dvw] w-[4dvw] md:h-6 md:w-6" />
              <div className="text-sm font-medium">Workflow Output</div>
            </div>
          </Card>

          <Card
            className={`p-[2dvw] cursor-pointer transition-all ${
              sourceType === "external_api" ? "border-primary bg-primary/5" : "hover:border-primary/50"
            }`}
            onClick={() => setSourceType("external_api")}
          >
            <div className="flex flex-col items-center gap-[1dvw] text-center">
              <Table className="h-[4dvw] w-[4dvw] md:h-6 md:w-6" />
              <div className="text-sm font-medium">External API</div>
            </div>
          </Card>
        </div>
      </div>

      {/* Data Format Selection */}
      <div className="space-y-[1dvw]">
        <Label>Data Format</Label>
        <Select value={dataFormat} onValueChange={(v: any) => setDataFormat(v)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="json">JSON</SelectItem>
            <SelectItem value="jsonb">JSONB (Binary)</SelectItem>
            <SelectItem value="text">Plain Text</SelectItem>
            <SelectItem value="binary">Binary</SelectItem>
            <SelectItem value="csv">CSV</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table Configuration */}
      {sourceType === "table" && (
        <div className="space-y-[2dvw]">
          <div className="space-y-[1dvw]">
            <Label>Select Table</Label>
            <Select value={tableName} onValueChange={setTableName}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a table" />
              </SelectTrigger>
              <SelectContent>
                {availableTables.map((table) => (
                  <SelectItem key={table} value={table}>
                    {table}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {tableName && (
            <>
              <div className="space-y-[1dvw]">
                <Label>Select Columns</Label>
                <div className="flex flex-wrap gap-[1dvw]">
                  {availableColumns.map((column) => (
                    <div key={column} className="flex items-center gap-[0.5dvw]">
                      <Checkbox
                        id={column}
                        checked={selectedColumns.includes(column)}
                        onCheckedChange={() => toggleColumn(column)}
                      />
                      <label htmlFor={column} className="text-sm cursor-pointer">
                        {column}
                      </label>
                    </div>
                  ))}
                </div>
                {selectedColumns.length > 0 && (
                  <div className="flex flex-wrap gap-[0.5dvw] mt-[1dvw]">
                    {selectedColumns.map((col) => (
                      <Badge key={col} variant="secondary">
                        {col}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-[1dvw]">
                <div className="flex items-center justify-between">
                  <Label>Filters</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addFilter}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Filter
                  </Button>
                </div>
                {filters.map((filter, index) => (
                  <div key={index} className="flex gap-[1dvw] items-end">
                    <div className="flex-1">
                      <Select value={filter.column} onValueChange={(v) => updateFilter(index, "column", v)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Column" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableColumns.map((col) => (
                            <SelectItem key={col} value={col}>
                              {col}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex-1">
                      <Select value={filter.operator} onValueChange={(v) => updateFilter(index, "operator", v)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="eq">Equals</SelectItem>
                          <SelectItem value="neq">Not Equals</SelectItem>
                          <SelectItem value="gt">Greater Than</SelectItem>
                          <SelectItem value="lt">Less Than</SelectItem>
                          <SelectItem value="gte">Greater or Equal</SelectItem>
                          <SelectItem value="lte">Less or Equal</SelectItem>
                          <SelectItem value="like">Contains</SelectItem>
                          <SelectItem value="in">In List</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex-1">
                      <Input
                        placeholder="Value"
                        value={filter.value}
                        onChange={(e) => updateFilter(index, "value", e.target.value)}
                      />
                    </div>
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeFilter(index)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* AI Agent Stream Configuration */}
      {sourceType === "agent_stream" && (
        <div className="space-y-[1dvw]">
          <Label>Select AI Agent</Label>
          <Select value={value?.agent_id} onValueChange={(v) => onChange({ ...value!, agent_id: v })}>
            <SelectTrigger>
              <SelectValue placeholder="Choose an AI agent" />
            </SelectTrigger>
            <SelectContent>
              {agents.map((agent) => (
                <SelectItem key={agent.id} value={agent.id}>
                  <div>
                    <div className="font-medium">{agent.name}</div>
                    {agent.description && <div className="text-xs text-muted-foreground">{agent.description}</div>}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">Connect to real-time output stream from AI agent executions</p>
        </div>
      )}

      {/* Workflow Output Configuration */}
      {sourceType === "workflow_output" && (
        <div className="space-y-[1dvw]">
          <Label>Select Workflow</Label>
          <Select value={value?.workflow_id} onValueChange={(v) => onChange({ ...value!, workflow_id: v })}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a workflow" />
            </SelectTrigger>
            <SelectContent>
              {workflows.map((workflow) => (
                <SelectItem key={workflow.id} value={workflow.id}>
                  <div>
                    <div className="font-medium">{workflow.name}</div>
                    {workflow.description && (
                      <div className="text-xs text-muted-foreground">{workflow.description}</div>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">Use output data from completed workflow executions</p>
        </div>
      )}

      {/* External API Configuration */}
      {sourceType === "external_api" && (
        <div className="space-y-[1dvw]">
          <Label>API Endpoint</Label>
          <Input placeholder="https://api.example.com/data" />
          <p className="text-xs text-muted-foreground">Connect to external APIs with secure credential management</p>
        </div>
      )}
    </div>
  )
}
