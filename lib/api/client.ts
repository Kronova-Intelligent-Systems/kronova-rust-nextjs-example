import { createClient } from "@/lib/supabase/client"

export class APIClient {
  private supabase = createClient()

  async getAssets(params?: {
    asset_type?: string
    status?: string
    search?: string
    limit?: number
  }) {
    let query = this.supabase.from("assets").select(`
        *,
        asset_intelligence_insights(
          id,
          insight_type,
          insight_data,
          confidence_score,
          priority,
          created_at
        ),
        asset_lifecycle_events(
          id,
          event_type,
          event_date,
          description,
          event_status
        )
      `)

    if (params?.asset_type && params.asset_type !== "all") {
      query = query.eq("asset_type", params.asset_type)
    }

    if (params?.status && params.status !== "all") {
      query = query.eq("status", params.status)
    }

    if (params?.search) {
      query = query.or(`name.ilike.%${params.search}%,description.ilike.%${params.search}%`)
    }

    if (params?.limit) {
      query = query.limit(params.limit)
    }

    const { data, error } = await query.order("created_at", { ascending: false })

    if (error) throw error
    return { data, success: true }
  }

  async createAsset(asset: {
    name: string
    description?: string
    asset_type: string
    category?: string
    current_location?: any
    purchase_cost?: number
    current_value?: number
    status?: string
    specifications?: any
    maintenance_schedule?: any
    metadata?: any
    asset_id: string
    user_id: string
  }) {
    const { data, error } = await this.supabase.from("assets").insert([asset]).select().single()

    if (error) throw error
    return { data, success: true }
  }

  async updateAsset(id: string, updates: any) {
    const { data, error } = await this.supabase.from("assets").update(updates).eq("id", id).select().single()

    if (error) throw error
    return { data, success: true }
  }

  async deleteAsset(id: string) {
    const { error } = await this.supabase.from("assets").delete().eq("id", id)

    if (error) throw error
    return { success: true }
  }

  async getAssetAnalytics() {
    const { data: assets, error } = await this.supabase
      .from("assets")
      .select("asset_type, status, current_value, iot_sensor_id")

    if (error) throw error

    const analytics = {
      total_assets: assets.length,
      active_assets: assets.filter((a) => a.status === "active").length,
      total_asset_value: assets.reduce((sum, a) => sum + (a.current_value || 0), 0),
      avg_asset_value:
        assets.length > 0 ? assets.reduce((sum, a) => sum + (a.current_value || 0), 0) / assets.length : 0,
      iot_enabled_assets: assets.filter((a) => a.iot_sensor_id !== null).length,
      vehicle_count: assets.filter((a) => a.asset_type === "vehicle").length,
      equipment_count: assets.filter((a) => a.asset_type === "equipment").length,
      property_count: assets.filter((a) => a.asset_type === "property").length,
      iot_device_count: assets.filter((a) => a.asset_type === "iot_device").length,
      maintenance_assets: assets.filter((a) => a.status === "maintenance").length,
    }

    return { data: analytics, success: true }
  }

  async getAIAgents() {
    const { data, error } = await this.supabase.from("ai_agents").select("*").order("created_at", { ascending: false })

    if (error) throw error
    return { data, success: true }
  }

  async createAIAgent(agent: {
    name: string
    description?: string
    agent_type: string
    configuration?: any
    system_prompt?: string
    model_id?: string
    parameters?: any
    tools?: string[]
    max_tokens?: number
    is_active?: boolean
  }) {
    const { data, error } = await this.supabase.from("ai_agents").insert([agent]).select().single()

    if (error) throw error
    return { data, success: true }
  }

  async executeAIAgent(agentId: string, inputData: any) {
    const { data, error } = await this.supabase
      .from("ai_agent_executions")
      .insert([
        {
          agent_id: agentId,
          input_data: inputData,
          status: "running",
        },
      ])
      .select()
      .single()

    if (error) throw error
    return { data, success: true }
  }

  async getAIWorkflows() {
    const { data, error } = await this.supabase
      .from("ai_workflows")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) throw error
    return { data, success: true }
  }

  async createAIWorkflow(workflow: {
    name: string
    description?: string
    steps: any[]
    trigger_type?: string
    trigger_config?: any
    is_active?: boolean
  }) {
    const { data, error } = await this.supabase.from("ai_workflows").insert([workflow]).select().single()

    if (error) throw error
    return { data, success: true }
  }

  async getAssetInsights(params?: { limit?: number }) {
    const { data, error } = await this.supabase
      .from("asset_intelligence_insights")
      .select(`
        *,
        assets(name, asset_type)
      `)
      .order("created_at", { ascending: false })
      .limit(params?.limit || 10)

    if (error) throw error
    return { data, success: true }
  }

  async getLifecycleEvents(params?: { limit?: number }) {
    const { data, error } = await this.supabase
      .from("asset_lifecycle_events")
      .select(`
        *,
        assets(name, asset_type)
      `)
      .order("event_date", { ascending: false })
      .limit(params?.limit || 20)

    if (error) throw error
    return { data, success: true }
  }
}

export const apiClient = new APIClient()
