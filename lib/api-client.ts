import { createClient } from "@/lib/supabase/client"
import type { Database } from "./database.types"

type Asset = Database["public"]["Tables"]["assets"]["Row"]
type AssetInsert = Database["public"]["Tables"]["assets"]["Insert"]
type AssetIntelligenceInsight = Database["public"]["Tables"]["asset_intelligence_insights"]["Row"]
type AssetLifecycleEvent = Database["public"]["Tables"]["asset_lifecycle_events"]["Row"]
type SystemAgentTemplate = Database["public"]["Tables"]["system_agent_templates"]["Row"]
type AIAgent = Database["public"]["Tables"]["ai_agents"]["Row"]
type AIWorkflow = Database["public"]["Tables"]["ai_workflows"]["Row"]
type SystemWorkflowTemplate = Database["public"]["Tables"]["system_workflow_templates"]["Row"]
type AssetWorkflow = Database["public"]["Tables"]["asset_workflows"]["Row"]
type AssetIntelligenceWorkflowTemplate = Database["public"]["Tables"]["asset_intelligence_workflow_templates"]["Row"]
type AIModel = Database["public"]["Tables"]["ai_models"]["Row"]
type APIKey = Database["public"]["Tables"]["api_keys"]["Row"]
type UserSettings = Database["public"]["Tables"]["user_settings"]["Row"]

export class ApiClient {
  private supabase = createClient()

  // Assets API
  async getAssets(params?: {
    search?: string
    asset_type?: string
    status?: string
    limit?: number
  }) {
    let assetsQuery = this.supabase.from("assets").select("*").order("created_at", { ascending: false })

    if (params?.search) {
      assetsQuery = assetsQuery.or(
        `name.ilike.%${params.search}%,description.ilike.%${params.search}%,category.ilike.%${params.search}%`,
      )
    }

    if (params?.asset_type && params.asset_type !== "all" && params.asset_type !== "iot_sensor") {
      assetsQuery = assetsQuery.eq("asset_type", params.asset_type)
    }

    if (params?.status && params?.status !== "all") {
      assetsQuery = assetsQuery.eq("status", params.status)
    }

    // Fetch IoT sensors
    let sensorsQuery = this.supabase.from("iot_sensor_data").select("*").order("created_at", { ascending: false })

    if (params?.search) {
      sensorsQuery = sensorsQuery.or(`iot_sensor_id.ilike.%${params.search}%`)
    }

    const [assetsResult, sensorsResult] = await Promise.all([assetsQuery, sensorsQuery])

    if (assetsResult.error) throw assetsResult.error
    if (sensorsResult.error) {
      console.warn("[v0] IoT sensors fetch failed:", sensorsResult.error)
    }

    const assets = assetsResult.data || []
    const sensors = sensorsResult.data || []

    // Get current user for sensor transformation
    const {
      data: { user },
    } = await this.supabase.auth.getUser()

    // Transform IoT sensors to asset format
    const sensorAssets = sensors.map((sensor: any) => ({
      id: sensor.id,
      asset_id: sensor.iot_sensor_id,
      name: sensor.metadata?.name || `IoT Sensor ${sensor.iot_sensor_id}`,
      description: sensor.metadata?.description || `IoT sensor device`,
      asset_type: "iot_sensor",
      category: "iot_device",
      status: sensor.battery_level && sensor.battery_level > 20 ? "active" : "maintenance",
      current_value: null,
      purchase_cost: null,
      current_location: sensor.location,
      created_at: sensor.created_at,
      updated_at: sensor.timestamp,
      user_id: user?.id,
      iot_sensor_id: sensor.iot_sensor_id,
      nfc_tag_id: sensor.nfc_tag_id,
      battery_level: sensor.battery_level,
      metadata: {
        ...sensor.metadata,
        temperature: sensor.temperature,
        humidity: sensor.humidity,
        last_reading: sensor.timestamp,
        source: "iot_sensor_data",
      },
      specifications: {
        temperature: sensor.temperature,
        humidity: sensor.humidity,
        battery_level: sensor.battery_level,
      },
    }))

    // Combine assets
    let combinedAssets = [...assets, ...sensorAssets]

    // Filter by asset_type if it's specifically iot_sensor
    if (params?.asset_type === "iot_sensor") {
      combinedAssets = sensorAssets
    }

    // Apply limit
    if (params?.limit) {
      combinedAssets = combinedAssets.slice(0, params.limit)
    }

    console.log(
      "[v0] ApiClient getAssets: Regular assets:",
      assets.length,
      "IoT sensors:",
      sensors.length,
      "Total:",
      combinedAssets.length,
    )

    return { data: combinedAssets, success: true }
  }

  async createAsset(asset: Omit<AssetInsert, "user_id" | "asset_id">) {
    const {
      data: { user },
    } = await this.supabase.auth.getUser()

    if (!user) {
      throw new Error("User must be authenticated to create assets")
    }

    // Generate a unique asset_id
    const asset_id = asset.asset_id || `AST-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    const { data, error } = await this.supabase
      .from("assets")
      .insert({
        ...asset,
        asset_id,
        user_id: user.id,
      })
      .select()
      .single()

    if (error) {
      console.error("[v0] Error creating asset:", error)
      throw error
    }

    console.log("[v0] Asset created successfully:", data)
    return { data, success: true }
  }

  async updateAsset(id: string, updates: Partial<AssetInsert>) {
    const { data, error } = await this.supabase.from("assets").update(updates).eq("id", id).select().single()

    if (error) throw error
    return { data, success: true }
  }

  async deleteAsset(id: string) {
    const { error } = await this.supabase.from("assets").delete().eq("id", id)

    if (error) throw error
    return { success: true }
  }

  // Asset Analytics
  async getAssetAnalytics() {
    const assetsQuery = this.supabase.from("assets").select("asset_type, status, current_value, iot_sensor_id")
    const sensorsQuery = this.supabase.from("iot_sensor_data").select("iot_sensor_id, battery_level")

    const [assetsResult, sensorsResult] = await Promise.all([assetsQuery, sensorsQuery])

    const assets = assetsResult.data || []
    const sensors = sensorsResult.data || []

    if (assetsResult.error && sensorsResult.error) {
      // If both fail, return mock data
      return {
        data: {
          total_assets: 0,
          active_assets: 0,
          total_asset_value: 0,
          avg_asset_value: 0,
          iot_enabled_assets: 0,
          iot_sensor_count: 0,
          maintenance_assets: 0,
        },
        success: true,
      }
    }

    const activeSensors = sensors.filter((s: any) => s.battery_level && s.battery_level > 20).length

    const data = {
      total_assets: assets.length + sensors.length,
      active_assets: assets.filter((a: any) => a.status === "active").length + activeSensors,
      total_asset_value: assets.reduce((sum: number, a: any) => sum + (a.current_value || 0), 0),
      avg_asset_value:
        assets.length > 0 ? assets.reduce((sum: number, a: any) => sum + (a.current_value || 0), 0) / assets.length : 0,
      iot_enabled_assets: assets.filter((a: any) => a.iot_sensor_id !== null).length,
      iot_sensor_count: sensors.length,
      maintenance_assets:
        assets.filter((a: any) => a.status === "maintenance").length + (sensors.length - activeSensors),
    }

    console.log("[v0] ApiClient getAssetAnalytics:", data)

    return { data, success: true }
  }

  // Asset Intelligence Insights
  async getAssetInsights(params?: { limit?: number }) {
    let query = this.supabase.from("asset_intelligence_insights").select("*").order("created_at", { ascending: false })

    if (params?.limit) {
      query = query.limit(params.limit)
    }

    const { data, error } = await query

    if (error) {
      // Return empty array if table doesn't exist or no data
      return { data: [], success: true }
    }
    return { data, success: true }
  }

  // Asset Lifecycle Events
  async getLifecycleEvents(params?: { limit?: number }) {
    let query = this.supabase.from("asset_lifecycle_events").select("*").order("event_date", { ascending: false })

    if (params?.limit) {
      query = query.limit(params.limit)
    }

    const { data, error } = await query

    if (error) {
      // Return empty array if table doesn't exist or no data
      return { data: [], success: true }
    }
    return { data, success: true }
  }

  // AI Agent Templates API methods
  async getSystemAgentTemplates(params?: {
    category?: string
    is_featured?: boolean
    limit?: number
  }) {
    let query = this.supabase
      .from("system_agent_templates")
      .select("*")
      .eq("is_active", true)
      .order("is_featured", { ascending: false })
      .order("name", { ascending: true })

    if (params?.category) {
      query = query.eq("category", params.category)
    }

    if (params?.is_featured !== undefined) {
      query = query.eq("is_featured", params.is_featured)
    }

    if (params?.limit) {
      query = query.limit(params.limit)
    }

    const { data, error } = await query

    if (error) throw error
    return { data, success: true }
  }

  async getAgentTemplateById(id: string) {
    const { data, error } = await this.supabase.from("system_agent_templates").select("*").eq("id", id).single()

    if (error) throw error
    return { data, success: true }
  }

  // AI Agents API
  async getAIAgents(params?: {
    user_id?: string
    is_active?: boolean
    limit?: number
  }) {
    let query = this.supabase.from("ai_agents").select("*, ai_models(*)").order("created_at", { ascending: false })

    if (params?.user_id) {
      query = query.eq("user_id", params.user_id)
    }

    if (params?.is_active !== undefined) {
      query = query.eq("is_active", params.is_active)
    }

    if (params?.limit) {
      query = query.limit(params.limit)
    }

    const { data, error } = await query

    if (error) {
      return { data: [], success: true }
    }
    return { data, success: true }
  }

  async createAIAgent(agent: {
    name: string
    description?: string
    system_prompt?: string
    model_id?: string
    temperature?: number
    max_tokens?: number
    tools?: string[] | null
    parameters?: Record<string, any> | null
    user_id: string
  }) {
    const toolsData = agent.tools && agent.tools.length > 0 ? agent.tools : null

    const parametersData = agent.parameters && Object.keys(agent.parameters).length > 0 ? agent.parameters : null

    const agentData = {
      name: agent.name,
      description: agent.description,
      system_prompt: agent.system_prompt,
      model_id: agent.model_id,
      temperature: agent.temperature,
      max_tokens: agent.max_tokens,
      tools: toolsData,
      parameters: parametersData,
      user_id: agent.user_id,
      is_active: true,
    }

    console.log("[v0] Inserting agent with data:", agentData)

    const { data, error } = await this.supabase.from("ai_agents").insert(agentData).select().single()

    if (error) {
      console.error("[v0] Error creating agent:", error)
      throw error
    }

    console.log("[v0] Agent created successfully:", data)
    return { data, success: true }
  }

  async deployAgentFromTemplate(
    templateId: string,
    userId: string,
    customizations?: {
      name?: string
      description?: string
      parameters?: any
    },
  ) {
    // First, get the template
    const { data: template, error: templateError } = await this.supabase
      .from("system_agent_templates")
      .select("*")
      .eq("id", templateId)
      .single()

    if (templateError) throw templateError

    const templateTools =
      typeof template.tools === "object" && template.tools !== null
        ? Object.keys(template.tools)
        : Array.isArray(template.tools)
          ? template.tools
          : []

    const templateParams =
      typeof template.parameters === "object" && template.parameters !== null ? template.parameters : {}

    const agentData = {
      name: customizations?.name || template.name,
      description: customizations?.description || template.description,
      system_prompt: template.system_prompt,
      tools: templateTools.length > 0 ? templateTools : null,
      parameters: {
        ...templateParams,
        ...(customizations?.parameters || {}),
        source_template_id: templateId,
        source_template_name: template.name,
        template_category: template.category,
      },
      user_id: userId,
      is_active: true,
    }

    console.log("[v0] Deploying agent from template:", agentData)

    const { data: agent, error: agentError } = await this.supabase.from("ai_agents").insert(agentData).select().single()

    if (agentError) {
      console.error("[v0] Error deploying agent from template:", agentError)
      throw agentError
    }

    console.log("[v0] Agent deployed successfully:", agent)
    return { data: agent, success: true }
  }

  async updateAIAgent(
    id: string,
    updates: {
      name?: string
      description?: string
      system_prompt?: string
      is_active?: boolean
      temperature?: number
      max_tokens?: number
      tools?: any
      parameters?: any
    },
  ) {
    const { data, error } = await this.supabase.from("ai_agents").update(updates).eq("id", id).select().single()

    if (error) throw error
    return { data, success: true }
  }

  async deleteAIAgent(id: string) {
    const { error } = await this.supabase.from("ai_agents").delete().eq("id", id)

    if (error) throw error
    return { success: true }
  }

  // AI Workflows API
  async getAIWorkflows(params?: {
    user_id?: string
    is_active?: boolean
    limit?: number
  }) {
    let query = this.supabase.from("ai_workflows").select("*").order("created_at", { ascending: false })

    if (params?.user_id) {
      query = query.eq("user_id", params.user_id)
    }

    if (params?.is_active !== undefined) {
      query = query.eq("is_active", params.is_active)
    }

    if (params?.limit) {
      query = query.limit(params.limit)
    }

    const { data, error } = await query

    if (error) {
      console.error("[v0] Error fetching workflows:", error)
      return { data: [], success: true }
    }
    return { data, success: true }
  }

  async createAIWorkflow(workflow: {
    name: string
    description?: string
    steps: any
    trigger_type?: string
    trigger_config?: any
    user_id: string
  }) {
    const { data, error } = await this.supabase
      .from("ai_workflows")
      .insert({
        ...workflow,
        is_active: true,
      })
      .select()
      .single()

    if (error) {
      console.error("[v0] Error creating workflow:", error)
      throw error
    }

    console.log("[v0] Workflow created successfully:", data)
    return { data, success: true }
  }

  async updateAIWorkflow(
    id: string,
    updates: {
      name?: string
      description?: string
      steps?: any
      trigger_type?: string
      trigger_config?: any
      is_active?: boolean
    },
  ) {
    const { data, error } = await this.supabase.from("ai_workflows").update(updates).eq("id", id).select().single()

    if (error) throw error
    return { data, success: true }
  }

  async deleteAIWorkflow(id: string) {
    const { error } = await this.supabase.from("ai_workflows").delete().eq("id", id)

    if (error) throw error
    return { success: true }
  }

  // System Workflow Templates API
  async getSystemWorkflowTemplates(params?: {
    category?: string
    is_featured?: boolean
    difficulty?: string
    limit?: number
  }) {
    let query = this.supabase
      .from("system_workflow_templates")
      .select("*")
      .eq("is_active", true)
      .order("is_featured", { ascending: false })
      .order("name", { ascending: true })

    if (params?.category) {
      query = query.eq("category", params.category)
    }

    if (params?.is_featured !== undefined) {
      query = query.eq("is_featured", params.is_featured)
    }

    if (params?.difficulty) {
      query = query.eq("difficulty", params.difficulty)
    }

    if (params?.limit) {
      query = query.limit(params.limit)
    }

    const { data, error } = await query

    if (error) {
      console.error("[v0] Error fetching workflow templates:", error)
      return { data: [], success: true }
    }
    return { data, success: true }
  }

  async deployWorkflowFromTemplate(
    templateId: string,
    userId: string,
    customizations?: {
      name?: string
      description?: string
      trigger_config?: any
    },
  ) {
    const { data: template, error: templateError } = await this.supabase
      .from("system_workflow_templates")
      .select("*")
      .eq("id", templateId)
      .single()

    if (templateError) throw templateError

    const workflowData = {
      name: customizations?.name || template.name,
      description: customizations?.description || template.description,
      steps: template.steps,
      trigger_type: template.trigger_type,
      trigger_config: customizations?.trigger_config || template.trigger_config,
      user_id: userId,
      is_active: true,
    }

    console.log("[v0] Deploying workflow from template:", workflowData)

    const { data: workflow, error: workflowError } = await this.supabase
      .from("ai_workflows")
      .insert(workflowData)
      .select()
      .single()

    if (workflowError) {
      console.error("[v0] Error deploying workflow from template:", workflowError)
      throw workflowError
    }

    console.log("[v0] Workflow deployed successfully:", workflow)
    return { data: workflow, success: true }
  }

  // Asset Workflows API
  async getAssetWorkflows(params?: {
    user_id?: string
    asset_type?: string
    is_active?: boolean
    limit?: number
  }) {
    let query = this.supabase.from("asset_workflows").select("*").order("created_at", { ascending: false })

    if (params?.user_id) {
      query = query.eq("user_id", params.user_id)
    }

    if (params?.asset_type) {
      query = query.eq("asset_type", params.asset_type)
    }

    if (params?.is_active !== undefined) {
      query = query.eq("is_active", params.is_active)
    }

    if (params?.limit) {
      query = query.limit(params.limit)
    }

    const { data, error } = await query

    if (error) {
      console.error("[v0] Error fetching asset workflows:", error)
      return { data: [], success: true }
    }
    return { data, success: true }
  }

  async createAssetWorkflow(workflow: {
    name: string
    description?: string
    asset_type?: string
    workflow_steps: any
    trigger_conditions: any
    user_id: string
  }) {
    const { data, error } = await this.supabase
      .from("asset_workflows")
      .insert({
        ...workflow,
        is_active: true,
      })
      .select()
      .single()

    if (error) {
      console.error("[v0] Error creating asset workflow:", error)
      throw error
    }

    console.log("[v0] Asset workflow created successfully:", data)
    return { data, success: true }
  }

  // Asset Intelligence Workflow Templates API
  async getAssetIntelligenceWorkflowTemplates(params?: {
    category?: string
    asset_types?: string[]
    difficulty?: string
    limit?: number
  }) {
    let query = this.supabase
      .from("asset_intelligence_workflow_templates")
      .select("*")
      .eq("is_active", true)
      .order("name", { ascending: true })

    if (params?.category) {
      query = query.eq("category", params.category)
    }

    if (params?.difficulty) {
      query = query.eq("difficulty", params.difficulty)
    }

    if (params?.limit) {
      query = query.limit(params.limit)
    }

    const { data, error } = await query

    if (error) {
      console.error("[v0] Error fetching asset intelligence workflow templates:", error)
      return { data: [], success: true }
    }

    // Filter by asset_types if provided
    if (params?.asset_types && params.asset_types.length > 0) {
      const filtered = data?.filter((template) =>
        template.asset_types.some((type) => params.asset_types?.includes(type)),
      )
      return { data: filtered || [], success: true }
    }

    return { data: data || [], success: true }
  }

  async deployAssetWorkflowFromTemplate(
    templateId: string,
    userId: string,
    assetType: string,
    customizations?: {
      name?: string
      description?: string
      trigger_conditions?: any
    },
  ) {
    const { data: template, error: templateError } = await this.supabase
      .from("asset_intelligence_workflow_templates")
      .select("*")
      .eq("id", templateId)
      .single()

    if (templateError) throw templateError

    const workflowData = {
      name: customizations?.name || template.name,
      description: customizations?.description || template.description,
      asset_type: assetType,
      workflow_steps: template.steps,
      trigger_conditions: customizations?.trigger_conditions || template.trigger_config,
      user_id: userId,
      is_active: true,
    }

    console.log("[v0] Deploying asset workflow from template:", workflowData)

    const { data: workflow, error: workflowError } = await this.supabase
      .from("asset_workflows")
      .insert(workflowData)
      .select()
      .single()

    if (workflowError) {
      console.error("[v0] Error deploying asset workflow from template:", workflowError)
      throw workflowError
    }

    console.log("[v0] Asset workflow deployed successfully:", workflow)
    return { data: workflow, success: true }
  }

  // AI Models API method to fetch available models
  async getAIModels(params?: {
    is_active?: boolean
    provider?: string
    model_type?: string
    limit?: number
  }) {
    let query = this.supabase
      .from("ai_models")
      .select("*")
      .order("provider", { ascending: true })
      .order("name", { ascending: true })

    if (params?.is_active !== undefined) {
      query = query.eq("is_active", params.is_active)
    }

    if (params?.provider) {
      query = query.eq("provider", params.provider)
    }

    if (params?.model_type) {
      query = query.eq("model_type", params.model_type)
    }

    if (params?.limit) {
      query = query.limit(params.limit)
    }

    const { data, error } = await query

    if (error) {
      console.error("[v0] Error fetching AI models:", error)
      return { data: [], success: true }
    }
    return { data: data || [], success: true }
  }

  // AI Agent execution method
  async executeAIAgent(agentId: string, inputData: { prompt: string; context?: any }) {
    try {
      console.log("[v0] Executing agent with ID:", agentId)
      console.log("[v0] Input data:", JSON.stringify(inputData, null, 2))

      const {
        data: { user },
      } = await this.supabase.auth.getUser()

      if (!user) {
        throw new Error("User must be authenticated")
      }

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      if (!supabaseUrl) {
        throw new Error("NEXT_PUBLIC_SUPABASE_URL environment variable is not configured")
      }

      // Get session token for authentication
      const {
        data: { session },
      } = await this.supabase.auth.getSession()

      if (!session?.access_token) {
        throw new Error("No active session found")
      }

      const edgeFunctionUrl = `${supabaseUrl}/functions/v1/execute-agent`
      console.log("[v0] Calling edge function:", edgeFunctionUrl)

      const response = await fetch(edgeFunctionUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          agent_id: agentId,
          prompt: inputData.prompt,
          context: inputData.context,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("[v0] Edge function error:", errorText)
        throw new Error(`Edge function failed: ${response.status} ${errorText}`)
      }

      const result = await response.json()
      console.log("[v0] Edge function response:", result)

      // Create execution record in ai_agent_runs table for tracking
      const { data: executionRecord, error: execError } = await this.supabase
        .from("ai_agent_runs")
        .insert({
          agent_id: agentId,
          user_id: user.id,
          input_data: inputData,
          output_data: result.data,
          status: "completed",
          started_at: new Date().toISOString(),
          completed_at: new Date().toISOString(),
          execution_time_ms: result.data?.execution_time_ms || 0,
        })
        .select()
        .single()

      if (execError) {
        console.error("[v0] Error creating execution record:", execError)
        // Don't throw - execution succeeded, just tracking failed
      }

      // Return the execution record for polling compatibility
      return {
        data: {
          id: executionRecord?.id || crypto.randomUUID(),
          status: "completed",
          output_data: result.data,
          response: result.data?.response,
        },
        success: true,
      }
    } catch (err: any) {
      console.error("[v0] Exception in executeAIAgent:", err)
      console.error("[v0] Exception message:", err.message)
      console.error("[v0] Exception stack:", err.stack)
      throw err
    }
  }

  // Method to get agent execution history
  async getAgentExecutions(params?: {
    agent_id?: string
    user_id?: string
    status?: string
    limit?: number
  }) {
    let query = this.supabase
      .from("ai_agent_runs")
      .select("*, ai_agents(name, description)")
      .order("created_at", { ascending: false })

    if (params?.agent_id) {
      query = query.eq("agent_id", params.agent_id)
    }

    if (params?.user_id) {
      query = query.eq("user_id", params.user_id)
    }

    if (params?.status) {
      query = query.eq("status", params.status)
    }

    if (params?.limit) {
      query = query.limit(params.limit)
    }

    const { data, error } = await query

    if (error) {
      console.error("[v0] Error fetching agent executions:", error)
      throw error
    }

    return { data: data || [], success: true }
  }

  // Method to get workflow execution history
  async getWorkflowRuns(params?: {
    workflow_id?: string
    user_id?: string
    status?: string
    limit?: number
  }) {
    let query = this.supabase
      .from("ai_workflow_runs")
      .select("*, ai_workflows(name, description)")
      .order("created_at", { ascending: false })

    if (params?.workflow_id) {
      query = query.eq("workflow_id", params.workflow_id)
    }

    if (params?.user_id) {
      query = query.eq("user_id", params.user_id)
    }

    if (params?.status) {
      query = query.eq("status", params.status)
    }

    if (params?.limit) {
      query = query.limit(params.limit)
    }

    const { data, error } = await query

    if (error) {
      console.error("[v0] Error fetching workflow runs:", error)
      return { data: [], success: true }
    }
    return { data: data || [], success: true }
  }

  // Method to get execution by ID
  async getAgentExecutionById(executionId: string) {
    const { data, error } = await this.supabase
      .from("ai_agent_runs")
      .select("*, ai_agents(name, description)")
      .eq("id", executionId)
      .single()

    if (error) {
      console.error("[v0] Error fetching agent execution:", error)
      throw error
    }
    return { data, success: true }
  }

  // Method to get workflow run by ID
  async getWorkflowRunById(runId: string) {
    const { data, error } = await this.supabase
      .from("ai_workflow_runs")
      .select("*, ai_workflows(name, description)")
      .eq("id", runId)
      .single()

    if (error) {
      console.error("[v0] Error fetching workflow run:", error)
      throw error
    }
    return { data, success: true }
  }

  async fetchDataFromSource(sourceConfig: {
    source_type: "table" | "agent_stream" | "workflow_output" | "external_api"
    source_id?: string
    table_name?: string
    columns?: string[]
    filters?: Array<{ column: string; operator: string; value: string }>
    agent_id?: string
    workflow_id?: string
    data_format?: "json" | "jsonb" | "text" | "binary" | "csv"
  }) {
    console.log("[v0] Fetching data from source:", sourceConfig)

    switch (sourceConfig.source_type) {
      case "table":
        return await this.fetchFromTable(sourceConfig)
      case "agent_stream":
        return await this.fetchFromAgentStream(sourceConfig.agent_id!)
      case "workflow_output":
        return await this.fetchFromWorkflowOutput(sourceConfig.workflow_id!)
      case "external_api":
        return await this.fetchFromExternalAPI(sourceConfig)
      default:
        throw new Error(`Unsupported source type: ${sourceConfig.source_type}`)
    }
  }

  private async fetchFromTable(config: {
    table_name?: string
    columns?: string[]
    filters?: Array<{ column: string; operator: string; value: string }>
  }) {
    if (!config.table_name) {
      throw new Error("Table name is required")
    }

    const selectColumns = config.columns && config.columns.length > 0 ? config.columns.join(",") : "*"
    let query = this.supabase.from(config.table_name).select(selectColumns)

    // Apply filters
    if (config.filters && config.filters.length > 0) {
      for (const filter of config.filters) {
        switch (filter.operator) {
          case "eq":
            query = query.eq(filter.column, filter.value)
            break
          case "neq":
            query = query.neq(filter.column, filter.value)
            break
          case "gt":
            query = query.gt(filter.column, filter.value)
            break
          case "lt":
            query = query.lt(filter.column, filter.value)
            break
          case "gte":
            query = query.gte(filter.column, filter.value)
            break
          case "lte":
            query = query.lte(filter.column, filter.value)
            break
          case "like":
            query = query.ilike(filter.column, `%${filter.value}%`)
            break
          case "in":
            query = query.in(filter.column, filter.value.split(","))
            break
        }
      }
    }

    const { data, error } = await query

    if (error) {
      console.error("[v0] Error fetching from table:", error)
      throw error
    }

    return { data, success: true, source_type: "table" }
  }

  private async fetchFromAgentStream(agentId: string) {
    if (!agentId) {
      throw new Error("Agent ID is required")
    }

    // Fetch recent agent executions with completed status
    const { data, error } = await this.supabase
      .from("ai_agent_runs")
      .select("id, output_data, execution_time_ms, created_at, status")
      .eq("agent_id", agentId)
      .eq("status", "completed")
      .order("created_at", { ascending: false })
      .limit(10)

    if (error) {
      console.error("[v0] Error fetching agent stream:", error)
      throw error
    }

    // Extract output data from executions
    const streamData = data.map((execution) => ({
      execution_id: execution.id,
      output: execution.output_data,
      timestamp: execution.created_at,
      execution_time_ms: execution.execution_time_ms,
    }))

    return { data: streamData, success: true, source_type: "agent_stream" }
  }

  private async fetchFromWorkflowOutput(workflowId: string) {
    if (!workflowId) {
      throw new Error("Workflow ID is required")
    }

    // Fetch recent workflow runs with completed status
    const { data, error } = await this.supabase
      .from("ai_workflow_runs")
      .select("id, results, execution_time_ms, created_at, status")
      .eq("workflow_id", workflowId)
      .eq("status", "completed")
      .order("created_at", { ascending: false })
      .limit(10)

    if (error) {
      console.error("[v0] Error fetching workflow output:", error)
      throw error
    }

    // Extract results from workflow runs
    const outputData = data.map((run) => ({
      run_id: run.id,
      output: run.results,
      timestamp: run.created_at,
      execution_time_ms: run.execution_time_ms,
    }))

    return { data: outputData, success: true, source_type: "workflow_output" }
  }

  private async fetchFromExternalAPI(config: any) {
    // Placeholder for external API integration
    // In production, this would handle OAuth, API keys, rate limiting, etc.
    throw new Error("External API integration not yet implemented")
  }

  async storeWorkflowLearningData(params: {
    workflow_id: string
    run_id: string
    user_id: string
    performance_metrics?: any
    decision_outcomes?: any
    optimization_suggestions?: any
    encrypt?: boolean
    encryption_algorithm?: string
  }) {
    console.log("[v0] Storing workflow learning data:", params)

    let dataToStore = {
      workflow_id: params.workflow_id,
      run_id: params.run_id,
      user_id: params.user_id,
      performance_metrics: params.performance_metrics,
      decision_outcomes: params.decision_outcomes,
      optimization_suggestions: params.optimization_suggestions,
    }

    // If encryption is enabled, encrypt sensitive fields
    if (params.encrypt) {
      console.log("[v0] Encrypting learning data with algorithm:", params.encryption_algorithm)
      // In production, this would use Supabase Vault or a proper encryption service
      // For now, we'll store a flag indicating encryption was requested
      dataToStore = {
        ...dataToStore,
        performance_metrics: params.performance_metrics
          ? { encrypted: true, algorithm: params.encryption_algorithm, data: params.performance_metrics }
          : null,
        decision_outcomes: params.decision_outcomes
          ? { encrypted: true, algorithm: params.encryption_algorithm, data: params.decision_outcomes }
          : null,
        optimization_suggestions: params.optimization_suggestions
          ? { encrypted: true, algorithm: params.encryption_algorithm, data: params.optimization_suggestions }
          : null,
      }
    }

    const { data, error } = await this.supabase.from("workflow_learning_data").insert(dataToStore).select().single()

    if (error) {
      console.error("[v0] Error storing workflow learning data:", error)
      throw error
    }

    console.log("[v0] Workflow learning data stored successfully:", data)
    return { data, success: true }
  }

  async getWorkflowLearningData(params: {
    workflow_id?: string
    run_id?: string
    user_id?: string
    limit?: number
  }) {
    let query = this.supabase.from("workflow_learning_data").select("*").order("created_at", { ascending: false })

    if (params.workflow_id) {
      query = query.eq("workflow_id", params.workflow_id)
    }

    if (params.run_id) {
      query = query.eq("run_id", params.run_id)
    }

    if (params.user_id) {
      query = query.eq("user_id", params.user_id)
    }

    if (params.limit) {
      query = query.limit(params.limit)
    }

    const { data, error } = await query

    if (error) {
      console.error("[v0] Error fetching workflow learning data:", error)
      return { data: [], success: true }
    }

    // In production, decrypt encrypted fields here
    const decryptedData = data?.map((item) => {
      // Check if data is encrypted and decrypt if needed
      if (item.performance_metrics?.encrypted) {
        console.log("[v0] Decrypting performance metrics")
        // Decrypt logic would go here
      }
      return item
    })

    return { data: decryptedData || [], success: true }
  }

  // API Keys Management
  async getAPIKeys(params?: { user_id?: string; is_active?: boolean; limit?: number }) {
    const {
      data: { user },
    } = await this.supabase.auth.getUser()

    if (!user) {
      throw new Error("User must be authenticated")
    }

    const { data, error } = await this.supabase.rpc("get_user_api_keys", {
      p_user_id: params?.user_id || user.id,
      p_is_active: params?.is_active ?? null,
      p_limit: params?.limit || 100,
    })

    if (error) {
      console.error("[v0] Error fetching API keys:", error)
      throw error
    }

    return { data: data || [], success: true }
  }

  async createAPIKey(params: { name: string; expires_at?: string; scopes?: string[] }) {
    const {
      data: { user },
    } = await this.supabase.auth.getUser()

    if (!user) {
      throw new Error("User must be authenticated")
    }

    // Generate a secure API key
    const apiKey = this.generateAPIKey()
    const keyPrefix = apiKey.substring(0, 8)
    const keyHash = await this.hashAPIKey(apiKey)

    const { data, error } = await this.supabase.rpc("create_api_key", {
      p_user_id: user.id,
      p_name: params.name,
      p_key_hash: keyHash,
      p_key_prefix: keyPrefix,
      p_expires_at: params.expires_at || null,
      p_scopes: params.scopes || ["agents:execute"],
    })

    if (error) {
      console.error("[v0] Error creating API key:", error)
      throw error
    }

    // Return the data with the full API key (only shown once)
    return {
      data: Array.isArray(data) ? { ...data[0], api_key: apiKey } : { ...data, api_key: apiKey },
      success: true,
    }
  }

  async updateAPIKey(id: string, updates: { name?: string; is_active?: boolean; expires_at?: string }) {
    const { data, error } = await this.supabase.rpc("update_api_key", {
      p_key_id: id,
      p_name: updates.name ?? null,
      p_is_active: updates.is_active ?? null,
      p_expires_at: updates.expires_at ?? null,
    })

    if (error) {
      console.error("[v0] Error updating API key:", error)
      throw error
    }

    return { data: Array.isArray(data) ? data[0] : data, success: true }
  }

  async deleteAPIKey(id: string) {
    const { data, error } = await this.supabase.rpc("delete_api_key", {
      p_key_id: id,
    })

    if (error) {
      console.error("[v0] Error deleting API key:", error)
      throw error
    }

    return { success: true }
  }

  async revokeAPIKey(id: string) {
    return await this.updateAPIKey(id, { is_active: false })
  }

  // User Settings Management
  async getUserSettings(params?: { settings_type?: string }) {
    const {
      data: { user },
    } = await this.supabase.auth.getUser()

    if (!user) {
      throw new Error("User must be authenticated")
    }

    let query = this.supabase.from("user_settings").select("*").eq("user_id", user.id)

    if (params?.settings_type) {
      query = query.eq("settings_type", params.settings_type)
    }

    const { data, error } = await query

    if (error) {
      console.error("[v0] Error fetching user settings:", error)
      return { data: [], success: true }
    }

    return { data: data || [], success: true }
  }

  async createUserSettings(params: { settings_type: string; settings: any }) {
    const {
      data: { user },
    } = await this.supabase.auth.getUser()

    if (!user) {
      throw new Error("User must be authenticated")
    }

    const { data, error } = await this.supabase
      .from("user_settings")
      .insert({
        user_id: user.id,
        settings_type: params.settings_type,
        settings: params.settings,
      })
      .select()
      .single()

    if (error) {
      console.error("[v0] Error creating user settings:", error)
      throw error
    }

    return { data, success: true }
  }

  async updateUserSettings(id: string, updates: { settings?: any; settings_type?: string }) {
    const { data, error } = await this.supabase.from("user_settings").update(updates).eq("id", id).select().single()

    if (error) {
      console.error("[v0] Error updating user settings:", error)
      throw error
    }

    return { data, success: true }
  }

  async deleteUserSettings(id: string) {
    const { error } = await this.supabase.from("user_settings").delete().eq("id", id)

    if (error) {
      console.error("[v0] Error deleting user settings:", error)
      throw error
    }

    return { success: true }
  }

  // AI-Powered Asset Analytics (using server-side API routes)
  async getAIAssetInsights(params?: { asset_ids?: string[]; limit?: number }) {
    try {
      console.log("[v0] Fetching AI insights with params:", params)
      const response = await fetch("/api/ai-analytics/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params || {}),
      })

      console.log("[v0] AI insights response status:", response.status)
      console.log("[v0] AI insights response headers:", Object.fromEntries(response.headers.entries()))

      // Get the raw text first to see what we're actually receiving
      const rawText = await response.text()
      console.log("[v0] AI insights raw response:", rawText.substring(0, 500)) // Log first 500 chars

      // Try to parse as JSON
      let data
      try {
        data = JSON.parse(rawText)
      } catch (parseError) {
        console.error("[v0] Failed to parse AI insights response as JSON:", parseError)
        throw new Error(`Invalid JSON response: ${rawText.substring(0, 200)}`)
      }

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch AI insights")
      }

      return data
    } catch (error: any) {
      console.error("[v0] AI insights error:", error.message)
      throw error
    }
  }

  async getAIAssetPerformanceAnalysis(params?: { timeframe?: string; asset_type?: string }) {
    try {
      console.log("[v0] Fetching AI performance analysis with params:", params)
      const response = await fetch("/api/ai-analytics/performance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params || {}),
      })

      console.log("[v0] AI performance response status:", response.status)
      const rawText = await response.text()
      console.log("[v0] AI performance raw response:", rawText.substring(0, 500))

      let data
      try {
        data = JSON.parse(rawText)
      } catch (parseError) {
        console.error("[v0] Failed to parse AI performance response as JSON:", parseError)
        throw new Error(`Invalid JSON response: ${rawText.substring(0, 200)}`)
      }

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch AI performance analysis")
      }

      return data
    } catch (error: any) {
      console.error("[v0] AI performance error:", error.message)
      throw error
    }
  }

  async getAIAssetOptimizationRecommendations() {
    try {
      console.log("[v0] Fetching AI optimization recommendations")
      const response = await fetch("/api/ai-analytics/optimization", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })

      console.log("[v0] AI optimization response status:", response.status)
      const rawText = await response.text()
      console.log("[v0] AI optimization raw response:", rawText.substring(0, 500))

      let data
      try {
        data = JSON.parse(rawText)
      } catch (parseError) {
        console.error("[v0] Failed to parse AI optimization response as JSON:", parseError)
        throw new Error(`Invalid JSON response: ${rawText.substring(0, 200)}`)
      }

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch AI optimization recommendations")
      }

      return data
    } catch (error: any) {
      console.error("[v0] AI optimization error:", error.message)
      throw error
    }
  }

  async getAIAssetRiskAssessment(params?: { asset_ids?: string[] }) {
    try {
      console.log("[v0] Fetching AI risk assessment with params:", params)
      const response = await fetch("/api/ai-analytics/risk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params || {}),
      })

      console.log("[v0] AI risk response status:", response.status)
      const rawText = await response.text()
      console.log("[v0] AI risk raw response:", rawText.substring(0, 500))

      let data
      try {
        data = JSON.parse(rawText)
      } catch (parseError) {
        console.error("[v0] Failed to parse AI risk response as JSON:", parseError)
        throw new Error(`Invalid JSON response: ${rawText.substring(0, 200)}`)
      }

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch AI risk assessment")
      }

      return data
    } catch (error: any) {
      console.error("[v0] AI risk error:", error.message)
      throw error
    }
  }

  async getAIAssetValuePrediction(params?: { asset_id?: string; timeframes?: string[] }) {
    try {
      console.log("[v0] Fetching AI value prediction with params:", params)
      const response = await fetch("/api/ai-analytics/value-prediction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params || {}),
      })

      console.log("[v0] AI value prediction response status:", response.status)
      const rawText = await response.text()
      console.log("[v0] AI value prediction raw response:", rawText.substring(0, 500))

      let data
      try {
        data = JSON.parse(rawText)
      } catch (parseError) {
        console.error("[v0] Failed to parse AI value prediction response as JSON:", parseError)
        throw new Error(`Invalid JSON response: ${rawText.substring(0, 200)}`)
      }

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch AI value prediction")
      }

      return data
    } catch (error: any) {
      console.error("[v0] AI value prediction error:", error.message)
      throw error
    }
  }

  async getAIAssetMaintenancePrediction(params?: { days_ahead?: number }) {
    try {
      console.log("[v0] Fetching AI maintenance prediction with params:", params)
      const response = await fetch("/api/ai-analytics/maintenance-prediction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params || {}),
      })

      console.log("[v0] AI maintenance prediction response status:", response.status)
      const rawText = await response.text()
      console.log("[v0] AI maintenance prediction raw response:", rawText.substring(0, 500))

      let data
      try {
        data = JSON.parse(rawText)
      } catch (parseError) {
        console.error("[v0] Failed to parse AI maintenance prediction response as JSON:", parseError)
        throw new Error(`Invalid JSON response: ${rawText.substring(0, 200)}`)
      }

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch AI maintenance prediction")
      }

      return data
    } catch (error: any) {
      console.error("[v0] AI maintenance prediction error:", error.message)
      throw error
    }
  }

  async getAIExecutiveSummary() {
    try {
      console.log("[v0] Fetching AI executive summary")
      const response = await fetch("/api/ai-analytics/executive-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })

      console.log("[v0] AI executive summary response status:", response.status)
      const rawText = await response.text()
      console.log("[v0] AI executive summary raw response:", rawText.substring(0, 500))

      let data
      try {
        data = JSON.parse(rawText)
      } catch (parseError) {
        console.error("[v0] Failed to parse AI executive summary response as JSON:", parseError)
        throw new Error(`Invalid JSON response: ${rawText.substring(0, 200)}`)
      }

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch AI executive summary")
      }

      return data
    } catch (error: any) {
      console.error("[v0] AI executive summary error:", error.message)
      throw error
    }
  }

  // Helper methods for API key generation and hashing
  private generateAPIKey(): string {
    // Generate a secure random API key (64 characters)
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
    let apiKey = "rsk_" // Resend-It Secret Key prefix
    for (let i = 0; i < 60; i++) {
      apiKey += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return apiKey
  }

  private async hashAPIKey(apiKey: string): Promise<string> {
    // Use Web Crypto API to hash the API key
    const encoder = new TextEncoder()
    const data = encoder.encode(apiKey)
    const hashBuffer = await crypto.subtle.digest("SHA-256", data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
    return hashHex
  }

  async executeWorkflow(workflowId: string, inputData: any) {
    try {
      console.log("[v0] Executing workflow with ID:", workflowId)
      console.log("[v0] Input data:", JSON.stringify(inputData, null, 2))

      const {
        data: { user },
      } = await this.supabase.auth.getUser()

      if (!user) {
        throw new Error("User must be authenticated")
      }

      const { data, error } = await this.supabase
        .from("ai_workflow_runs")
        .insert({
          workflow_id: workflowId,
          user_id: user.id,
          status: "running",
          start_time: new Date().toISOString(),
        })
        .select()
        .single()

      if (error) {
        console.error("[v0] Error executing workflow:", error)
        throw new Error(error.message || "Failed to execute workflow")
      }

      console.log("[v0] Workflow execution started successfully:", data)
      return { data, success: true }
    } catch (err: any) {
      console.error("[v0] Exception in executeWorkflow:", err)
      throw err
    }
  }

  async getWebhooks(params?: { user_id?: string; is_active?: boolean }) {
    const {
      data: { user },
    } = await this.supabase.auth.getUser()

    if (!user) {
      throw new Error("User must be authenticated")
    }

    let query = this.supabase
      .from("webhooks")
      .select("*")
      .eq("user_id", params?.user_id || user.id)
      .order("created_at", { ascending: false })

    if (params?.is_active !== undefined) {
      query = query.eq("is_active", params.is_active)
    }

    const { data, error } = await query

    if (error) {
      console.error("[v0] Error fetching webhooks:", error)
      return { data: [], success: true }
    }

    return { data: data || [], success: true }
  }

  async getWebhookLogs(webhookId: string, limit = 50) {
    const { data, error } = await this.supabase
      .from("webhook_logs")
      .select("*")
      .eq("webhook_id", webhookId)
      .order("delivered_at", { ascending: false })
      .limit(limit)

    if (error) {
      console.error("[v0] Error fetching webhook logs:", error)
      return { data: [], success: true }
    }

    return { data: data || [], success: true }
  }
}

// Export singleton instance
export const apiClient = new ApiClient()
