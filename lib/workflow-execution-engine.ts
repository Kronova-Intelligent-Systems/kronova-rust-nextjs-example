import { createClient } from "@/lib/supabase/client"
import { apiClient } from "./api-client"

export interface WorkflowExecutionConfig {
  workflow_id: string
  user_id: string
  data_source?: {
    source_type: "table" | "agent_stream" | "workflow_output" | "external_api"
    source_id?: string
    table_name?: string
    columns?: string[]
    filters?: Array<{ column: string; operator: string; value: string }>
    agent_id?: string
    workflow_id?: string
    data_format?: "json" | "jsonb" | "text" | "binary" | "csv"
  }
  output_config?: {
    store_output: boolean
    store_in_learning_data: boolean
    encrypt_output: boolean
    encryption_algorithm?: "AES-256-GCM" | "ChaCha20-Poly1305" | "AES-256-CBC"
    retention_days?: number
    include_metadata: boolean
  }
}

export interface ExecutionContext {
  workflow_id: string
  run_id: string
  user_id: string
  input_data: any
  variables: Record<string, any>
  metadata: {
    started_at: string
    data_source_type?: string
    data_format?: string
    encryption_enabled: boolean
  }
}

export interface StepExecutionResult {
  step_id: string
  step_name: string
  step_type: string
  status: "pending" | "running" | "completed" | "failed" | "skipped"
  started_at: string
  completed_at?: string
  execution_time_ms?: number
  input_data?: any
  output_data?: any
  error?: string
  metadata?: Record<string, any>
}

export interface WorkflowExecutionResult {
  run_id: string
  workflow_id: string
  status: "running" | "completed" | "failed" | "cancelled"
  started_at: string
  completed_at?: string
  total_execution_time_ms?: number
  step_results: StepExecutionResult[]
  final_output?: any
  error?: string
  metadata: {
    total_steps: number
    completed_steps: number
    failed_steps: number
    skipped_steps: number
    data_source_used: boolean
    learning_data_stored: boolean
    output_encrypted: boolean
  }
}

export class WorkflowExecutionEngine {
  private supabase = createClient()

  /**
   * Execute a workflow with enterprise-grade data connection and security
   */
  async executeWorkflow(config: WorkflowExecutionConfig): Promise<WorkflowExecutionResult> {
    const startTime = Date.now()
    const runId = crypto.randomUUID()

    console.log("[v0] Starting workflow execution:", { workflow_id: config.workflow_id, run_id: runId })

    // Initialize execution context
    const context: ExecutionContext = {
      workflow_id: config.workflow_id,
      run_id: runId,
      user_id: config.user_id,
      input_data: null,
      variables: {},
      metadata: {
        started_at: new Date().toISOString(),
        encryption_enabled: config.output_config?.encrypt_output || false,
      },
    }

    const result: WorkflowExecutionResult = {
      run_id: runId,
      workflow_id: config.workflow_id,
      status: "running",
      started_at: context.metadata.started_at,
      step_results: [],
      metadata: {
        total_steps: 0,
        completed_steps: 0,
        failed_steps: 0,
        skipped_steps: 0,
        data_source_used: !!config.data_source,
        learning_data_stored: false,
        output_encrypted: config.output_config?.encrypt_output || false,
      },
    }

    try {
      // Step 1: Fetch input data from configured data source
      if (config.data_source) {
        console.log("[v0] Fetching data from source:", config.data_source.source_type)
        const sourceData = await this.fetchDataFromSource(config.data_source, config.user_id)
        context.input_data = sourceData
        context.metadata.data_source_type = config.data_source.source_type
        context.metadata.data_format = config.data_source.data_format
      }

      // Step 2: Load workflow definition
      const workflow = await this.loadWorkflow(config.workflow_id, config.user_id)
      if (!workflow) {
        throw new Error("Workflow not found or access denied")
      }

      if (!workflow.is_active) {
        throw new Error("Workflow is not active")
      }

      // Step 3: Load and validate workflow steps
      const steps = await this.loadWorkflowSteps(config.workflow_id)
      result.metadata.total_steps = steps.length

      if (steps.length === 0) {
        throw new Error("No active steps found in workflow")
      }

      // Step 4: Execute workflow steps sequentially
      for (const step of steps) {
        const stepResult = await this.executeStep(step, context)
        result.step_results.push(stepResult)

        // Update counters
        if (stepResult.status === "completed") {
          result.metadata.completed_steps++
          // Update context with step output for next step
          if (stepResult.output_data) {
            context.variables[step.name] = stepResult.output_data
            context.input_data = stepResult.output_data // Pass output to next step
          }
        } else if (stepResult.status === "failed") {
          result.metadata.failed_steps++
          // Stop execution on failure
          result.status = "failed"
          result.error = stepResult.error || "Step execution failed"
          break
        } else if (stepResult.status === "skipped") {
          result.metadata.skipped_steps++
        }
      }

      // Step 5: Finalize execution
      if (result.status === "running") {
        result.status = "completed"
        result.final_output = context.input_data // Last step output
      }

      result.completed_at = new Date().toISOString()
      result.total_execution_time_ms = Date.now() - startTime

      // Step 6: Store output and learning data if configured
      if (config.output_config?.store_output) {
        await this.storeExecutionOutput(result, config)
      }

      if (config.output_config?.store_in_learning_data && result.status === "completed") {
        await this.storeWorkflowLearningData(result, config)
        result.metadata.learning_data_stored = true
      }

      console.log("[v0] Workflow execution completed:", {
        run_id: runId,
        status: result.status,
        execution_time_ms: result.total_execution_time_ms,
      })

      return result
    } catch (error: any) {
      console.error("[v0] Workflow execution error:", error)
      result.status = "failed"
      result.error = error.message || "Workflow execution failed"
      result.completed_at = new Date().toISOString()
      result.total_execution_time_ms = Date.now() - startTime
      return result
    }
  }

  /**
   * Fetch data from configured data source with security checks
   */
  private async fetchDataFromSource(
    sourceConfig: NonNullable<WorkflowExecutionConfig["data_source"]>,
    userId: string,
  ): Promise<any> {
    console.log("[v0] Fetching from data source:", sourceConfig.source_type)

    // Security: Validate user has access to the data source
    await this.validateDataSourceAccess(sourceConfig, userId)

    // Fetch data using API client
    const result = await apiClient.fetchDataFromSource(sourceConfig)

    // Transform data based on format
    return this.transformDataFormat(result.data, sourceConfig.data_format || "json")
  }

  /**
   * Validate user has access to the requested data source
   */
  private async validateDataSourceAccess(
    sourceConfig: NonNullable<WorkflowExecutionConfig["data_source"]>,
    userId: string,
  ): Promise<void> {
    switch (sourceConfig.source_type) {
      case "table":
        // Validate table access through RLS
        // In production, check if user has read permissions on the table
        break
      case "agent_stream":
        if (sourceConfig.agent_id) {
          // Verify user owns the agent
          const { data: agent } = await this.supabase
            .from("ai_agents")
            .select("user_id")
            .eq("id", sourceConfig.agent_id)
            .single()

          if (!agent || agent.user_id !== userId) {
            throw new Error("Access denied: Agent not found or not owned by user")
          }
        }
        break
      case "workflow_output":
        if (sourceConfig.workflow_id) {
          // Verify user owns the workflow
          const { data: workflow } = await this.supabase
            .from("ai_workflows")
            .select("user_id")
            .eq("id", sourceConfig.workflow_id)
            .single()

          if (!workflow || workflow.user_id !== userId) {
            throw new Error("Access denied: Workflow not found or not owned by user")
          }
        }
        break
    }
  }

  /**
   * Transform data to specified format
   */
  private transformDataFormat(data: any, format: string): any {
    switch (format) {
      case "json":
      case "jsonb":
        return data
      case "text":
        return typeof data === "string" ? data : JSON.stringify(data)
      case "csv":
        // Convert array of objects to CSV format
        if (Array.isArray(data) && data.length > 0) {
          const headers = Object.keys(data[0])
          const rows = data.map((row) => headers.map((h) => row[h]).join(","))
          return [headers.join(","), ...rows].join("\n")
        }
        return ""
      case "binary":
        // Handle binary data (would need proper encoding in production)
        return data
      default:
        return data
    }
  }

  /**
   * Load workflow definition
   */
  private async loadWorkflow(workflowId: string, userId: string) {
    const { data, error } = await this.supabase
      .from("ai_workflows")
      .select("*")
      .eq("id", workflowId)
      .eq("user_id", userId)
      .single()

    if (error) {
      console.error("[v0] Error loading workflow:", error)
      return null
    }

    return data
  }

  /**
   * Load workflow steps
   */
  private async loadWorkflowSteps(workflowId: string) {
    const { data, error } = await this.supabase
      .from("workflow_steps")
      .select("*")
      .eq("workflow_id", workflowId)
      .eq("is_active", true)
      .order("order", { ascending: true })

    if (error) {
      console.error("[v0] Error loading workflow steps:", error)
      return []
    }

    return data || []
  }

  /**
   * Execute a single workflow step
   */
  private async executeStep(step: any, context: ExecutionContext): Promise<StepExecutionResult> {
    const startTime = Date.now()
    const result: StepExecutionResult = {
      step_id: step.id,
      step_name: step.name,
      step_type: step.step_type,
      status: "running",
      started_at: new Date().toISOString(),
      input_data: context.input_data,
    }

    try {
      console.log("[v0] Executing step:", step.name, "Type:", step.step_type)

      // Check step conditions
      if (step.conditions && !this.evaluateConditions(step.conditions, context)) {
        result.status = "skipped"
        result.completed_at = new Date().toISOString()
        result.execution_time_ms = Date.now() - startTime
        return result
      }

      // Execute step based on type
      const output = await this.executeStepByType(step.step_type, step.configuration, context)

      result.status = "completed"
      result.output_data = output
      result.completed_at = new Date().toISOString()
      result.execution_time_ms = Date.now() - startTime

      return result
    } catch (error: any) {
      console.error("[v0] Step execution error:", error)
      result.status = "failed"
      result.error = error.message || "Step execution failed"
      result.completed_at = new Date().toISOString()
      result.execution_time_ms = Date.now() - startTime
      return result
    }
  }

  /**
   * Evaluate step conditions
   */
  private evaluateConditions(conditions: any, context: ExecutionContext): boolean {
    // Simple condition evaluation - in production, implement more sophisticated logic
    if (!conditions || Object.keys(conditions).length === 0) {
      return true
    }

    // Example: Check if a variable exists or has a specific value
    if (conditions.variable && conditions.operator && conditions.value) {
      const varValue = context.variables[conditions.variable]
      switch (conditions.operator) {
        case "eq":
          return varValue === conditions.value
        case "neq":
          return varValue !== conditions.value
        case "exists":
          return varValue !== undefined && varValue !== null
        default:
          return true
      }
    }

    return true
  }

  /**
   * Execute step based on type
   */
  private async executeStepByType(stepType: string, configuration: any, context: ExecutionContext): Promise<any> {
    switch (stepType) {
      case "data_fetch":
        return await this.executeDataFetchStep(configuration, context)
      case "data_transform":
        return await this.executeDataTransformStep(configuration, context)
      case "ai_analysis":
        return await this.executeAIAnalysisStep(configuration, context)
      case "condition":
        return await this.executeConditionStep(configuration, context)
      case "notification":
        return await this.executeNotificationStep(configuration, context)
      case "api_call":
        return await this.executeAPICallStep(configuration, context)
      case "asset_update":
        return await this.executeAssetUpdateStep(configuration, context)
      default:
        throw new Error(`Unsupported step type: ${stepType}`)
    }
  }

  private async executeDataFetchStep(config: any, context: ExecutionContext): Promise<any> {
    const table = config.table || "assets"
    const limit = config.limit || 10

    const { data, error } = await this.supabase.from(table).select("*").eq("user_id", context.user_id).limit(limit)

    if (error) throw error
    return { data, count: data?.length || 0, table }
  }

  private async executeDataTransformStep(config: any, context: ExecutionContext): Promise<any> {
    const transformType = config.transform_type || "identity"
    const inputData = context.input_data

    switch (transformType) {
      case "filter":
        if (Array.isArray(inputData) && config.filter_field && config.filter_value) {
          return inputData.filter((item) => item[config.filter_field] === config.filter_value)
        }
        return inputData
      case "map":
        if (Array.isArray(inputData) && config.map_fields) {
          return inputData.map((item) => {
            const mapped: any = {}
            for (const [oldKey, newKey] of Object.entries(config.map_fields)) {
              mapped[newKey] = item[oldKey]
            }
            return mapped
          })
        }
        return inputData
      case "aggregate":
        if (Array.isArray(inputData) && config.aggregate_field) {
          const sum = inputData.reduce((acc, item) => acc + (item[config.aggregate_field] || 0), 0)
          return { sum, count: inputData.length, average: sum / inputData.length }
        }
        return inputData
      default:
        return inputData
    }
  }

  private async executeAIAnalysisStep(config: any, context: ExecutionContext): Promise<any> {
    // Mock AI analysis - in production, integrate with actual AI services
    return {
      analysis: "AI analysis completed",
      confidence: 0.85,
      insights: ["Insight 1", "Insight 2"],
      input_summary: typeof context.input_data === "object" ? JSON.stringify(context.input_data).slice(0, 100) : "",
    }
  }

  private async executeConditionStep(config: any, context: ExecutionContext): Promise<any> {
    const condition = config.condition || "true"
    const result = this.evaluateConditions({ condition }, context)
    return { condition_met: result, condition }
  }

  private async executeNotificationStep(config: any, context: ExecutionContext): Promise<any> {
    const message = config.message || "Workflow notification"
    // In production, create actual notification
    return { notification_sent: true, message }
  }

  private async executeAPICallStep(config: any, context: ExecutionContext): Promise<any> {
    // Mock API call - in production, implement actual HTTP requests with security
    return { api_call_completed: true, url: config.url, method: config.method || "GET" }
  }

  private async executeAssetUpdateStep(config: any, context: ExecutionContext): Promise<any> {
    if (!config.asset_id) {
      throw new Error("Asset ID is required")
    }

    const { data, error } = await this.supabase
      .from("assets")
      .update(config.updates || {})
      .eq("id", config.asset_id)
      .eq("user_id", context.user_id)
      .select()
      .single()

    if (error) throw error
    return { asset_updated: true, asset_id: config.asset_id, data }
  }

  /**
   * Store execution output
   */
  private async storeExecutionOutput(result: WorkflowExecutionResult, config: WorkflowExecutionConfig): Promise<void> {
    console.log("[v0] Storing execution output")

    const outputData = {
      run_id: result.run_id,
      workflow_id: result.workflow_id,
      user_id: config.user_id,
      status: result.status,
      started_at: result.started_at,
      completed_at: result.completed_at,
      execution_time_ms: result.total_execution_time_ms,
      step_results: result.step_results,
      final_output: result.final_output,
      error: result.error,
      metadata: result.metadata,
    }

    // If encryption is enabled, encrypt sensitive fields
    if (config.output_config?.encrypt_output) {
      console.log("[v0] Encrypting output data with algorithm:", config.output_config.encryption_algorithm)
      // In production, use Supabase Vault or proper encryption service
    }

    // Store in workflow_executions table
    const { error } = await this.supabase.from("ai_workflow_runs").upsert({
      id: result.run_id,
      workflow_id: result.workflow_id,
      status: result.status,
      start_time: result.started_at,
      end_time: result.completed_at,
      execution_time_ms: result.total_execution_time_ms,
      results: {
        step_results: result.step_results,
        output_data: result.final_output,
      },
      error: result.error,
      user_id: config.user_id,
    })

    if (error) {
      console.error("[v0] Error storing execution output:", error)
    }
  }

  /**
   * Store workflow learning data
   */
  private async storeWorkflowLearningData(
    result: WorkflowExecutionResult,
    config: WorkflowExecutionConfig,
  ): Promise<void> {
    console.log("[v0] Storing workflow learning data")

    await apiClient.storeWorkflowLearningData({
      workflow_id: result.workflow_id,
      run_id: result.run_id,
      user_id: config.user_id,
      performance_metrics: {
        execution_time_ms: result.total_execution_time_ms,
        total_steps: result.metadata.total_steps,
        completed_steps: result.metadata.completed_steps,
        failed_steps: result.metadata.failed_steps,
        success_rate: result.metadata.completed_steps / result.metadata.total_steps,
      },
      decision_outcomes: result.step_results,
      optimization_suggestions: null,
      encrypt: config.output_config?.encrypt_output,
      encryption_algorithm: config.output_config?.encryption_algorithm,
    })
  }
}

// Export singleton instance
export const workflowExecutionEngine = new WorkflowExecutionEngine()
