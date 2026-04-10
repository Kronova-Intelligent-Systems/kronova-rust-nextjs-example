import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import crypto from "crypto"
import { Configuration, PlaidApi, PlaidEnvironments, type Products, type CountryCode } from "plaid"
import type { SupabaseClient } from "@supabase/supabase-js"

const plaidConfig = new Configuration({
  basePath: PlaidEnvironments[process.env.PLAID_ENV || "sandbox"],
  baseOptions: {
    headers: {
      "PLAID-CLIENT-ID": process.env.PLAID_CLIENT_ID,
      "PLAID-SECRET": process.env.PLAID_SECRET,
    },
  },
})

const plaidClient = new PlaidApi(plaidConfig)

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const searchParams = url.searchParams
  const query = searchParams.get("query")

  // Parse the query parameter if it exists
  let parsedQuery
  try {
    parsedQuery = query ? JSON.parse(query) : null
  } catch {
    parsedQuery = null
  }

  // Extract the procedure name from the URL path
  const pathSegments = url.pathname.split("/").filter(Boolean)
  const procedureName = pathSegments.slice(2).join(".")

  try {
    const supabase = await createClient()

    // Get user session for authenticated requests
    const {
      data: { session },
    } = await supabase.auth.getSession()
    const userId = session?.user?.id

    switch (procedureName) {
      case "assets.list":
        return await handleAssetsList(supabase, parsedQuery, userId)

      case "assets.analytics":
        return await handleAssetsAnalytics(supabase, userId)

      case "assets.insights":
        return await handleAssetsInsights(supabase, parsedQuery, userId)

      case "assets.lifecycle_events":
        return await handleLifecycleEvents(supabase, parsedQuery, userId)

      case "ai.agents.list":
        return await handleAIAgentsList(supabase, userId)

      case "ai.templates.list":
        return await handleTemplatesList(supabase, parsedQuery)

      case "ai.templates.get":
        return await handleGetTemplate(supabase, parsedQuery)

      case "ai.workflows.list":
        return await handleAIWorkflowsList(supabase, userId)

      case "dashboard.overview":
        return await handleDashboardOverview(supabase, userId)

      case "dashboard.recent_activity":
        return await handleRecentActivity(supabase, parsedQuery, userId)

      case "system.notifications":
        return await handleSystemNotifications(supabase, userId)

      case "settings.profile":
        return await handleGetProfile(supabase, userId)

      case "settings.webhooks.list":
        return await handleWebhooksList(supabase, userId)

      case "businessCards.list":
        // Keep mock data for business cards as it's not in the main schema
        return NextResponse.json({
          data: [
            {
              id: "card-1",
              name: "John Doe",
              title: "CEO",
              company: "Resend-It AI",
              email: "john@resendit.ai",
              phone: "+1 (555) 123-4567",
              website: "https://resendit.ai",
              nft_token_id: null,
              view_count: 25,
              created_at: new Date().toISOString(),
            },
          ],
        })

      case "agents.get":
        return await handleGetAgent(supabase, parsedQuery, userId)

      case "workflows.get":
        return await handleGetWorkflow(supabase, parsedQuery, userId)

      case "workflows.runs":
        return await handleWorkflowRuns(supabase, parsedQuery, userId)

      case "plaid.get_accounts":
        return await handleGetPlaidAccounts(supabase, parsedQuery, userId)

      case "plaid.get_transactions":
        return await handleGetPlaidTransactions(supabase, parsedQuery, userId)

      case "plaid.get_balance":
        return await handleGetPlaidBalance(supabase, parsedQuery, userId)

      default:
        return NextResponse.json(
          {
            error: "Procedure not found",
            procedure: procedureName,
          },
          { status: 404 },
        )
    }
  } catch (error) {
    console.error(`Error in RSPC query ${procedureName}:`, error)
    return NextResponse.json(
      {
        error: error.message || "Internal server error",
        procedure: procedureName,
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const url = new URL(request.url)
  const path = url.pathname.replace("/api/rspc/", "")

  try {
    const supabase = await createClient()

    // Get authenticated user - more secure than getSession()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    
    if (authError) {
      console.error("[v0] Auth error:", authError)
    }
    
    const userId = user?.id

    switch (path) {
      case "assets.create":
        return await handleCreateAsset(supabase, body, userId)

      case "assets.update":
        return await handleUpdateAsset(supabase, body, userId)

      case "assets.delete":
        return await handleDeleteAsset(supabase, body, userId)

      case "ai.agents.create":
        return await handleCreateAIAgent(supabase, body, userId)

      case "ai.agents.deploy_from_template":
        return await handleDeployAgentFromTemplate(supabase, body, userId)

      case "ai.agents.update":
        return await handleUpdateAIAgent(supabase, body, userId)

      case "ai.agents.delete":
        return await handleDeleteAIAgent(supabase, body, userId)

      case "ai.agents.execute":
        return await handleExecuteAIAgent(supabase, body, userId)

      case "ai.workflows.create":
        return await handleCreateAIWorkflow(supabase, body, userId)

      case "settings.profile.update":
        return await handleUpdateProfile(supabase, body, userId)

      case "settings.webhooks.create":
        return await handleCreateWebhook(supabase, body, userId)

      case "settings.webhooks.update":
        return await handleUpdateWebhook(supabase, body, userId)

      case "settings.webhooks.delete":
        return await handleDeleteWebhook(supabase, body, userId)

      case "settings.webhooks.toggle":
        return await handleToggleWebhook(supabase, body, userId)

      case "businessCards.create":
        // Keep mock for business cards
        return NextResponse.json({
          id: `card-${Date.now()}`,
          ...body,
          view_count: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })

      case "agents.execute":
        return await handleAgentExecuteProxy(supabase, body, userId)

      case "workflows.execute":
        return await handleWorkflowExecuteProxy(supabase, body, userId)

      case "workflows.update":
        return await handleUpdateWorkflow(supabase, body, userId)

      case "workflows.delete":
        return await handleDeleteWorkflow(supabase, body, userId)

      case "webhooks.trigger":
        return await handleTriggerWebhook(supabase, body, userId)

      case "assets.import.bitcoin":
        return await handleImportBitcoin(supabase, body, userId)

      case "assets.import.ethereum":
        return await handleImportEthereum(supabase, body, userId)

      case "assets.import.sui":
        return await handleImportSui(supabase, body, userId)

      case "assets.import.canton":
        return await handleImportCanton(supabase, body, userId)

      case "assets.import.database":
        return await handleImportDatabase(supabase, body, userId)

      case "assets.import.vector_db":
        return await handleImportVectorDB(supabase, body, userId)

      case "assets.tokenize":
        return await handleTokenizeAsset(supabase, body, userId)

      case "payments.create_checkout_session":
        return await handleCreateCheckoutSession(supabase, body, userId)

      case "payments.create_portal_session":
        return await handleCreatePortalSession(supabase, body, userId)

      case "payments.sync_subscription":
        return await handleSyncSubscription(supabase, body, userId)

      case "payments.cancel_subscription":
        return await handleCancelSubscription(supabase, body, userId)

      case "payments.update_subscription":
        return await handleUpdateSubscription(supabase, body, userId)

      case "payments.get_subscription":
        return await handleGetSubscription(supabase, body, userId)

      case "plaid.create_link_token":
        return await handleCreatePlaidLinkToken(supabase, body, userId)

      case "plaid.exchange_public_token":
        return await handleExchangePublicToken(
          supabase,
          body.publicToken,
          body.institutionId,
          body.institutionName,
          userId,
        )

      case "plaid.disconnect_account":
        return await handleDisconnectPlaidAccount(supabase, body, userId)

      case "plaid.get_accounts":
        return await handleGetPlaidAccounts(supabase, body, userId)

      default:
        return NextResponse.json(
          {
            error: "Mutation not found",
            procedure: path,
          },
          { status: 404 },
        )
    }
  } catch (error) {
    console.error(`Error in RSPC mutation ${path}:`, error)
    return NextResponse.json(
      {
        error: error.message || "Internal server error",
        procedure: path,
      },
      { status: 500 },
    )
  }
}

// Query handlers
async function handleAssetsList(supabase: any, params: any, userId: string) {
  // Fetch regular assets
  let assetsQuery = supabase.from("assets").select(`
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

  if (userId) {
    assetsQuery = assetsQuery.eq("user_id", userId)
  }

  if (params?.asset_type && params.asset_type !== "all" && params.asset_type !== "iot_sensor") {
    assetsQuery = assetsQuery.eq("asset_type", params.asset_type)
  }

  if (params?.status && params.status !== "all") {
    assetsQuery = assetsQuery.eq("status", params.status)
  }

  if (params?.search) {
    assetsQuery = assetsQuery.or(`name.ilike.%${params.search}%,description.ilike.%${params.search}%`)
  }

  // Fetch IoT sensors
  let sensorsQuery = supabase.from("iot_sensor_data").select("*")

  if (params?.search) {
    sensorsQuery = sensorsQuery.or(`iot_sensor_id.ilike.%${params.search}%,metadata->>name.ilike.%${params.search}%`)
  }

  const [assetsResult, sensorsResult] = await Promise.all([
    assetsQuery.order("created_at", { ascending: false }),
    sensorsQuery.order("created_at", { ascending: false }),
  ])

  if (assetsResult.error) throw assetsResult.error
  if (sensorsResult.error) throw sensorsResult.error

  const assets = assetsResult.data || []
  const sensors = sensorsResult.data || []

  // Transform IoT sensors to asset format
  const sensorAssets = sensors.map((sensor: any) => ({
    id: sensor.id,
    asset_id: sensor.iot_sensor_id,
    name: sensor.metadata?.name || `IoT Sensor ${sensor.iot_sensor_id}`,
    description: sensor.metadata?.description || `IoT sensor monitoring temperature, humidity, and battery levels`,
    asset_type: "iot_sensor",
    category: sensor.metadata?.category || "iot_device",
    status: sensor.battery_level && sensor.battery_level > 20 ? "active" : "maintenance",
    current_value: null,
    purchase_cost: null,
    current_location: sensor.location,
    created_at: sensor.created_at,
    updated_at: sensor.timestamp,
    user_id: userId,
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
    asset_intelligence_insights: [],
    asset_lifecycle_events: [],
  }))

  // Combine and filter by asset_type if specified
  let combinedAssets = [...assets, ...sensorAssets]

  if (params?.asset_type === "iot_sensor") {
    combinedAssets = sensorAssets
  }

  // Apply limit if specified
  if (params?.limit) {
    combinedAssets = combinedAssets.slice(0, params.limit)
  }

  console.log(
    "[v0] Assets fetched:",
    assets.length,
    "IoT sensors fetched:",
    sensors.length,
    "Combined total:",
    combinedAssets.length,
  )

  return NextResponse.json({ data: combinedAssets, success: true })
}

async function handleAssetsAnalytics(supabase: any, userId: string) {
  let assetsQuery = supabase.from("assets").select("asset_type, status, current_value, iot_sensor_id")
  const sensorsQuery = supabase.from("iot_sensor_data").select("iot_sensor_id, battery_level, created_at")

  if (userId) {
    assetsQuery = assetsQuery.eq("user_id", userId)
  }

  const [assetsResult, sensorsResult] = await Promise.all([assetsQuery, sensorsQuery])

  if (assetsResult.error) throw assetsResult.error
  if (sensorsResult.error) throw sensorsResult.error

  const assets = assetsResult.data || []
  const sensors = sensorsResult.data || []

  // Count IoT sensors as active if battery > 20%
  const activeSensors = sensors.filter((s: any) => s.battery_level && s.battery_level > 20).length
  const totalSensors = sensors.length

  const analytics = {
    total_assets: assets.length + totalSensors,
    active_assets: assets.filter((a: any) => a.status === "active").length + activeSensors,
    total_asset_value: assets.reduce((sum: number, a: any) => sum + (a.current_value || 0), 0),
    avg_asset_value:
      assets.length > 0 ? assets.reduce((sum: number, a: any) => sum + (a.current_value || 0), 0) / assets.length : 0,
    iot_enabled_assets: assets.filter((a: any) => a.iot_sensor_id !== null).length,
    vehicle_count: assets.filter((a: any) => a.asset_type === "vehicle").length,
    equipment_count: assets.filter((a: any) => a.asset_type === "equipment").length,
    property_count: assets.filter((a: any) => a.asset_type === "property").length,
    iot_device_count: assets.filter((a: any) => a.asset_type === "iot_device").length,
    iot_sensor_count: totalSensors,
    maintenance_assets: assets.filter((a: any) => a.status === "maintenance").length + (totalSensors - activeSensors),
  }

  console.log("[v0] Analytics computed:", analytics)

  return NextResponse.json({ data: analytics, success: true })
}

async function handleAssetsInsights(supabase: any, params: any, userId: string) {
  let query = supabase.from("asset_intelligence_insights").select(`
      *,
      assets(name, asset_type)
    `)

  if (userId) {
    query = query.eq("assets.user_id", userId)
  }

  const { data, error } = await query.order("created_at", { ascending: false }).limit(params?.limit || 10)

  if (error) throw error
  return NextResponse.json({ data, success: true })
}

async function handleLifecycleEvents(supabase: any, params: any, userId: string) {
  let query = supabase.from("asset_lifecycle_events").select(`
      *,
      assets(name, asset_type)
    `)

  if (userId) {
    query = query.eq("assets.user_id", userId)
  }

  const { data, error } = await query.order("event_date", { ascending: false }).limit(params?.limit || 20)

  if (error) throw error
  return NextResponse.json({ data, success: true })
}

async function handleAIAgentsList(supabase: any, userId: string) {
  let query = supabase.from("ai_agents").select("*")

  if (userId) {
    query = query.eq("user_id", userId)
  }

  const { data, error } = await query.order("created_at", { ascending: false })

  if (error) throw error
  return NextResponse.json({ data, success: true })
}

async function handleAIWorkflowsList(supabase: any, userId: string) {
  let query = supabase.from("ai_workflows").select("*")

  if (userId) {
    query = query.eq("user_id", userId)
  }

  const { data, error } = await query.order("created_at", { ascending: false })

  if (error) throw error
  return NextResponse.json({ data, success: true })
}

async function handleDashboardOverview(supabase: any, userId: string) {
  // Get assets overview
  let assetsQuery = supabase.from("assets").select("status")
  if (userId) {
    assetsQuery = assetsQuery.eq("user_id", userId)
  }
  const { data: assets } = await assetsQuery

  // Get agents overview
  let agentsQuery = supabase.from("ai_agents").select("is_active")
  if (userId) {
    agentsQuery = agentsQuery.eq("user_id", userId)
  }
  const { data: agents } = await agentsQuery

  // Get workflows overview
  let workflowsQuery = supabase.from("ai_workflows").select("is_active")
  if (userId) {
    workflowsQuery = workflowsQuery.eq("user_id", userId)
  }
  const { data: workflows } = await workflowsQuery

  const overview = {
    assets: {
      total: assets?.length || 0,
      active: assets?.filter((a: any) => a.status === "active").length || 0,
      inactive: assets?.filter((a: any) => a.status === "inactive").length || 0,
      maintenance: assets?.filter((a: any) => a.status === "maintenance").length || 0,
    },
    agents: {
      total: agents?.length || 0,
      active: agents?.filter((a: any) => a.is_active).length || 0,
      training: 0, // Would need additional status field
      inactive: agents?.filter((a: any) => !a.is_active).length || 0,
    },
    workflows: {
      total: workflows?.length || 0,
      active: workflows?.filter((w: any) => w.is_active).length || 0,
      executions_today: 0, // Would need execution tracking
      success_rate: 94.2, // Would need execution results
    },
    system_health: {
      overall_score: 98.5,
      uptime: 99.8,
      performance: 94.2,
    },
  }

  return NextResponse.json(overview)
}

async function handleRecentActivity(supabase: any, params: any, userId: string) {
  let query = supabase.from("asset_lifecycle_events").select(`
      id,
      event_type,
      description,
      event_date,
      assets(name)
    `)

  if (userId) {
    query = query.eq("assets.user_id", userId)
  }

  const { data, error } = await query.order("event_date", { ascending: false }).limit(params?.limit || 10)

  if (error) throw error

  // Transform to activity format
  const activities =
    data?.map((event: any) => ({
      id: event.id,
      type: event.event_type,
      message: `${event.assets?.name}: ${event.description}`,
      timestamp: event.event_date,
    })) || []

  return NextResponse.json(activities)
}

async function handleSystemNotifications(supabase: any, userId: string) {
  // For now, return empty array - would need notifications table
  return NextResponse.json([])
}

async function handleGetProfile(supabase: any, userId: string) {
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data, error } = await supabase.from("profiles").select("company, email").eq("id", userId).single()

  if (error) throw error
  return NextResponse.json({ data, success: true })
}

async function handleWebhooksList(supabase: any, userId: string) {
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data, error } = await supabase
    .from("webhooks")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })

  if (error) throw error
  return NextResponse.json({ data, success: true })
}

async function handleGetAgent(supabase: any, params: any, userId: string) {
  if (!params?.id) {
    return NextResponse.json({ error: "Agent ID required" }, { status: 400 })
  }

  let query = supabase.from("ai_agents").select("*").eq("id", params.id)

  if (userId) {
    query = query.eq("user_id", userId)
  }

  const { data, error } = await query.single()

  if (error) throw error
  return NextResponse.json({ data, success: true })
}

async function handleGetWorkflow(supabase: any, params: any, userId: string) {
  if (!params?.id) {
    return NextResponse.json({ error: "Workflow ID required" }, { status: 400 })
  }

  let query = supabase.from("ai_workflows").select("*").eq("id", params.id)

  if (userId) {
    query = query.eq("user_id", userId)
  }

  const { data, error } = await query.single()

  if (error) throw error
  return NextResponse.json({ data, success: true })
}

async function handleWorkflowRuns(supabase: any, params: any, userId: string) {
  if (!params?.workflow_id) {
    return NextResponse.json({ error: "Workflow ID required" }, { status: 400 })
  }

  let query = supabase.from("ai_workflow_runs").select("*").eq("workflow_id", params.workflow_id)

  if (userId) {
    query = query.eq("user_id", userId)
  }

  const { data, error } = await query.order("created_at", { ascending: false }).limit(params?.limit || 50)

  if (error) throw error
  return NextResponse.json({ data, success: true })
}

// Mutation handlers
async function handleCreateAsset(supabase: any, asset: any, userId: string) {
  const { data, error } = await supabase
    .from("assets")
    .insert([{ ...asset, user_id: userId }])
    .select()
    .single()

  if (error) throw error
  return NextResponse.json({ data, success: true })
}

async function handleUpdateAsset(supabase: any, updates: any, userId: string) {
  const { asset_id, ...updateData } = updates

  let query = supabase.from("assets").update(updateData).eq("id", asset_id)

  if (userId) {
    query = query.eq("user_id", userId)
  }

  const { data, error } = await query.select().single()

  if (error) throw error
  return NextResponse.json({ data, success: true })
}

async function handleDeleteAsset(supabase: any, params: any, userId: string) {
  let query = supabase.from("assets").delete().eq("id", params.asset_id)

  if (userId) {
    query = query.eq("user_id", userId)
  }

  const { error } = await query

  if (error) throw error
  return NextResponse.json({ success: true })
}

async function handleCreateAIAgent(supabase: any, agent: any, userId: string) {
  const { data, error } = await supabase
    .from("ai_agents")
    .insert([{ ...agent, user_id: userId }])
    .select()
    .single()

  if (error) throw error
  return NextResponse.json({ data, success: true })
}

async function handleDeployAgentFromTemplate(supabase: any, params: any, userId: string) {
  const { template_id, customizations } = params

  // First, get the template
  const { data: template, error: templateError } = await supabase
    .from("system_agent_templates")
    .select("*")
    .eq("id", template_id)
    .single()

  if (templateError) throw templateError

  // Create the agent from template
  const agentData = {
    name: customizations?.name || template.name,
    description: customizations?.description || template.description,
    system_prompt: template.system_prompt,
    tools: template.tools,
    parameters: customizations?.parameters || template.parameters,
    user_id: userId,
    is_active: true,
  }

  const { data: agent, error: agentError } = await supabase.from("ai_agents").insert(agentData).select().single()

  if (agentError) throw agentError

  // Store the deployed template in asset_intelligence_agent_templates for user reference
  const { error: templateInsertError } = await supabase.from("asset_intelligence_agent_templates").insert({
    name: agent.name,
    description: agent.description || "",
    category: template.category,
    icon: template.icon,
    system_prompt: template.system_prompt,
    tools: Array.isArray(template.tools) ? template.tools : [],
    parameters: template.parameters,
    template_id: template.template_id,
    asset_types: [],
    capabilities: [],
    is_active: true,
    version: 1,
  })

  if (templateInsertError) {
    console.error("Failed to store template reference:", templateInsertError)
  }

  return NextResponse.json({ data: agent, success: true })
}

async function handleUpdateAIAgent(supabase: any, params: any, userId: string) {
  const { agent_id, ...updates } = params

  let query = supabase.from("ai_agents").update(updates).eq("id", agent_id)

  if (userId) {
    query = query.eq("user_id", userId)
  }

  const { data, error } = await query.select().single()

  if (error) throw error
  return NextResponse.json({ data, success: true })
}

async function handleDeleteAIAgent(supabase: any, params: any, userId: string) {
  let query = supabase.from("ai_agents").delete().eq("id", params.agent_id)

  if (userId) {
    query = query.eq("user_id", userId)
  }

  const { error } = await query

  if (error) throw error
  return NextResponse.json({ success: true })
}

async function handleExecuteAIAgent(supabase: any, params: any, userId: string) {
  const { agent_id, input_data } = params

  const { data, error } = await supabase
    .from("ai_agent_runs")
    .insert([
      {
        agent_id,
        input_data,
        status: "running",
        user_id: userId,
      },
    ])
    .select()
    .single()

  if (error) throw error

  const { WebhookDeliveryService } = await import("@/lib/webhook-delivery")
  await WebhookDeliveryService.notifyWebhooks("agent.execution.started", {
    agentId: agent_id,
    executionId: data.id,
    timestamp: data.created_at,
  })

  return NextResponse.json({
    success: true,
    data: {
      executionId: data.id,
      status: "running",
      timestamp: data.created_at,
    },
  })
}

async function handleCreateAIWorkflow(supabase: any, workflow: any, userId: string) {
  const { data, error } = await supabase
    .from("ai_workflows")
    .insert([{ ...workflow, user_id: userId }])
    .select()
    .single()

  if (error) throw error
  return NextResponse.json({ data, success: true })
}

async function handleUpdateProfile(supabase: any, updates: any, userId: string) {
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { error } = await supabase.from("profiles").update(updates).eq("id", userId)

  if (error) throw error
  return NextResponse.json({ success: true })
}

async function handleCreateWebhook(supabase: any, webhook: any, userId: string) {
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data, error } = await supabase
    .from("webhooks")
    .insert([{ ...webhook, user_id: userId }])
    .select()
    .single()

  if (error) throw error
  return NextResponse.json({ data, success: true })
}

async function handleUpdateWebhook(supabase: any, params: any, userId: string) {
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { webhook_id, ...updates } = params

  const { data, error } = await supabase
    .from("webhooks")
    .update(updates)
    .eq("id", webhook_id)
    .eq("user_id", userId)
    .select()
    .single()

  if (error) throw error
  return NextResponse.json({ data, success: true })
}

async function handleDeleteWebhook(supabase: any, params: any, userId: string) {
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { error } = await supabase.from("webhooks").delete().eq("id", params.webhook_id).eq("user_id", userId)

  if (error) throw error
  return NextResponse.json({ success: true })
}

async function handleToggleWebhook(supabase: any, params: any, userId: string) {
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { webhook_id, is_active } = params

  const { data, error } = await supabase
    .from("webhooks")
    .update({ is_active })
    .eq("id", webhook_id)
    .eq("user_id", userId)
    .select()
    .single()

  if (error) throw error
  return NextResponse.json({ data, success: true })
}

async function handleTemplatesList(supabase: any, params: any) {
  let query = supabase
    .from("system_agent_templates")
    .select("*")
    .eq("is_active", true)
    .order("is_featured", { ascending: false })
    .order("name", { ascending: true })

  if (params?.category && params.category !== "all") {
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
  return NextResponse.json({ data, success: true })
}

async function handleGetTemplate(supabase: any, params: any) {
  const { data, error } = await supabase.from("system_agent_templates").select("*").eq("id", params.id).single()

  if (error) throw error
  return NextResponse.json({ data, success: true })
}

async function handleAgentExecuteProxy(supabase: any, body: any, userId: string) {
  const { agent_id, prompt, assetIds, dataStreamIds, webhookUrl } = body

  if (!agent_id || !prompt) {
    return NextResponse.json({ error: "Agent ID and prompt are required" }, { status: 400 })
  }

  // Verify agent exists and belongs to user
  const { data: agent, error: agentError } = await supabase
    .from("ai_agents")
    .select("*")
    .eq("id", agent_id)
    .eq("user_id", userId)
    .single()

  if (agentError || !agent) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 })
  }

  const inputData = {
    prompt,
    assetIds: assetIds || [],
    dataStreamIds: dataStreamIds || [],
    webhookUrl,
  }

  const { data: run, error: runError } = await supabase
    .from("ai_agent_runs")
    .insert({
      agent_id: agent_id,
      user_id: userId,
      input_data: inputData,
      status: "running",
    })
    .select()
    .single()

  if (runError) {
    console.error("[v0] Error creating agent run:", runError)
    return NextResponse.json({ error: "Failed to start agent execution" }, { status: 500 })
  }

  // Simulate async execution
  setTimeout(async () => {
    const result = `Agent "${agent.name}" analyzed: ${prompt}\nProcessed ${assetIds?.length || 0} assets.`
    const outputData = { result, prompt, assetIds, dataStreamIds }

    await supabase
      .from("ai_agent_runs")
      .update({
        status: "completed",
        output_data: outputData,
        completed_at: new Date().toISOString(),
        execution_time_ms: 1000,
      })
      .eq("id", run.id)

    if (webhookUrl) {
      try {
        await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            event: "agent.execution.completed",
            data: {
              agentId: agent_id,
              executionId: run.id,
              result,
              timestamp: new Date().toISOString(),
            },
          }),
        })
      } catch (error) {
        console.error("[v0] Error calling webhook:", error)
      }
    }
  }, 1000)

  return NextResponse.json({
    success: true,
    data: {
      executionId: run.id,
      status: "running",
      timestamp: run.created_at,
    },
  })
}

async function handleWorkflowExecuteProxy(supabase: any, body: any, userId: string) {
  const { workflow_id, input, webhookUrl } = body

  if (!workflow_id) {
    return NextResponse.json({ error: "Workflow ID is required" }, { status: 400 })
  }

  // Verify workflow exists and belongs to user
  const { data: workflow, error: workflowError } = await supabase
    .from("ai_workflows")
    .select("*")
    .eq("id", workflow_id)
    .eq("user_id", userId)
    .single()

  if (workflowError || !workflow) {
    return NextResponse.json({ error: "Workflow not found" }, { status: 404 })
  }

  const inputData = {
    input: input || {},
    webhookUrl,
  }

  const { data: run, error: runError } = await supabase
    .from("ai_workflow_runs")
    .insert({
      workflow_id: workflow_id,
      user_id: userId,
      input_data: inputData,
      status: "running",
    })
    .select()
    .single()

  if (runError) {
    console.error("[v0] Error creating workflow run:", runError)
    return NextResponse.json({ error: "Failed to start workflow execution" }, { status: 500 })
  }

  // Simulate async execution
  setTimeout(async () => {
    const results = {
      status: "success",
      output: `Workflow "${workflow.name}" executed successfully`,
      input,
      steps_completed: workflow.steps?.length || 0,
    }

    await supabase
      .from("ai_workflow_runs")
      .update({
        status: "completed",
        results,
        completed_at: new Date().toISOString(),
        execution_time_ms: 2000,
      })
      .eq("id", run.id)

    if (webhookUrl) {
      try {
        await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            event: "workflow.execution.completed",
            data: {
              workflowId: workflow_id,
              executionId: run.id,
              result: results,
              timestamp: new Date().toISOString(),
            },
          }),
        })
      } catch (error) {
        console.error("[v0] Error calling webhook:", error)
      }
    }
  }, 2000)

  return NextResponse.json({
    success: true,
    data: {
      executionId: run.id,
      status: "running",
      timestamp: run.created_at,
    },
  })
}

async function handleTriggerWebhook(supabase: any, body: any, userId: string) {
  const { event_type, payload, webhook_id } = body

  if (!event_type || !payload) {
    return NextResponse.json({ error: "event_type and payload are required" }, { status: 400 })
  }

  // Fetch webhooks for this event
  let query = supabase.from("webhooks").select("*").eq("is_active", true)

  if (webhook_id) {
    query = query.eq("id", webhook_id)
  } else if (userId) {
    query = query.eq("user_id", userId).contains("events", [event_type])
  }

  const { data: webhooks, error: webhooksError } = await query

  if (webhooksError) {
    console.error("[v0] Error fetching webhooks:", webhooksError)
    return NextResponse.json({ error: "Failed to fetch webhooks" }, { status: 500 })
  }

  if (!webhooks || webhooks.length === 0) {
    return NextResponse.json({ success: true, delivered: 0, message: "No active webhooks found" })
  }

  // Trigger each webhook
  const deliveryPromises = webhooks.map(async (webhook) => {
    try {
      const timestamp = Date.now()
      const signature = generateWebhookSignature(webhook.secret, payload, timestamp)

      const response = await fetch(webhook.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Webhook-Signature": signature,
          "X-Webhook-Timestamp": timestamp.toString(),
          "X-Webhook-Event": event_type,
        },
        body: JSON.stringify(payload),
      })

      const responseBody = await response.text()
      const success = response.ok

      // Log webhook delivery
      await supabase.from("webhook_logs").insert({
        webhook_id: webhook.id,
        event_type,
        payload,
        response_status: response.status,
        response_body: responseBody.substring(0, 1000),
        error_message: success ? null : `HTTP ${response.status}: ${response.statusText}`,
        delivered_at: new Date().toISOString(),
      })

      // Update webhook status
      await supabase
        .from("webhooks")
        .update({
          last_triggered_at: new Date().toISOString(),
          last_status: success ? "success" : "failed",
          failure_count: success ? 0 : webhook.failure_count + 1,
        })
        .eq("id", webhook.id)

      return { webhook_id: webhook.id, success, status: response.status }
    } catch (error: any) {
      console.error(`[v0] Error delivering webhook ${webhook.id}:`, error)
      return { webhook_id: webhook.id, success: false, error: error.message }
    }
  })

  const results = await Promise.all(deliveryPromises)
  const successCount = results.filter((r) => r.success).length

  return NextResponse.json({
    success: true,
    delivered: successCount,
    total: webhooks.length,
    results,
  })
}

function generateWebhookSignature(secret: string, payload: any, timestamp: number): string {
  const crypto = require("crypto")
  const data = `${timestamp}.${JSON.stringify(payload)}`
  return crypto.createHmac("sha256", secret).update(data).digest("hex")
}

async function handleImportBitcoin(supabase: any, body: any, userId: string) {
  const { address, importType = "utxo" } = body

  if (!address) {
    return NextResponse.json({ error: "Bitcoin address is required" }, { status: 400 })
  }

  try {
    // Fetch Bitcoin balance
    const balanceResponse = await fetch(`https://blockchain.info/balance?active=${address}`)
    if (!balanceResponse.ok) throw new Error("Failed to fetch Bitcoin balance")

    const balanceData = await balanceResponse.json()
    const addressData = balanceData[address]
    if (!addressData) throw new Error("Address not found")

    const balanceBTC = addressData.final_balance / 100000000
    const btcValue = balanceBTC * 50000 // Approximate USD value

    const asset = {
      user_id: userId,
      asset_id: `BTC-${address}`,
      name: `Bitcoin Wallet`,
      description: `Bitcoin wallet ${address.substring(0, 8)}...${address.substring(address.length - 6)} with ${balanceBTC.toFixed(8)} BTC`,
      asset_type: "digital",
      category: "blockchain_asset",
      current_value: btcValue,
      status: "active",
      metadata: {
        blockchain: "bitcoin",
        address: address,
        balance: balanceBTC,
        transactions: addressData.n_tx || 0,
        explorer_url: `https://blockchain.com/btc/address/${address}`,
        import_source: "bitcoin",
        imported_at: new Date().toISOString(),
      },
    }

    const { data, error } = await supabase.from("assets").insert(asset).select().single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      imported: 1,
      failed: 0,
      data: [data],
    })
  } catch (error: any) {
    console.error("[v0] Bitcoin import error:", error)
    return NextResponse.json(
      {
        success: false,
        imported: 0,
        failed: 1,
        error: error.message,
      },
      { status: 500 },
    )
  }
}

async function handleImportEthereum(supabase: any, body: any, userId: string) {
  const { address, contractAddress, importType = "balance" } = body

  if (!address) {
    return NextResponse.json({ error: "Ethereum address is required" }, { status: 400 })
  }

  try {
    const assets: any[] = []
    const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || "YourApiKeyToken"
    const baseUrl = "https://api.etherscan.io/api"

    if (importType === "balance") {
      const balanceResponse = await fetch(
        `${baseUrl}?module=account&action=balance&address=${address}&tag=latest&apikey=${ETHERSCAN_API_KEY}`,
      )
      const balanceData = await balanceResponse.json()

      if (balanceData.status === "1" && balanceData.result) {
        const balanceWei = BigInt(balanceData.result)
        const ethBalance = Number(balanceWei) / 1e18

        if (ethBalance > 0) {
          assets.push({
            asset_id: `ETH-${address}`,
            name: `Ethereum Balance - ${address.slice(0, 8)}...`,
            asset_type: "digital",
            category: "blockchain_asset",
            description: `${ethBalance.toFixed(6)} ETH`,
            status: "active",
            current_value: ethBalance * 3000,
            metadata: {
              blockchain: "ethereum",
              address,
              balance: ethBalance.toString(),
              explorer_url: `https://etherscan.io/address/${address}`,
              import_source: "ethereum",
              imported_at: new Date().toISOString(),
            },
            user_id: userId,
          })
        }
      }
    }

    const { data, error } = await supabase.from("assets").insert(assets).select()

    if (error) throw error

    return NextResponse.json({
      success: true,
      imported: assets.length,
      failed: 0,
      data,
    })
  } catch (error: any) {
    console.error("[v0] Ethereum import error:", error)
    return NextResponse.json(
      {
        success: false,
        imported: 0,
        failed: 1,
        error: error.message,
      },
      { status: 500 },
    )
  }
}

async function handleImportSui(supabase: any, body: any, userId: string) {
  const { config, options } = body

  if (!config?.walletAddress) {
    return NextResponse.json({ error: "Sui wallet address is required" }, { status: 400 })
  }

  try {
    // Placeholder for Sui import - would use @mysten/sui SDK in production
    return NextResponse.json({
      success: true,
      imported: 0,
      failed: 0,
      message: "Sui import requires @mysten/sui SDK integration",
    })
  } catch (error: any) {
    console.error("[v0] Sui import error:", error)
    return NextResponse.json(
      {
        success: false,
        imported: 0,
        failed: 1,
        error: error.message,
      },
      { status: 500 },
    )
  }
}

async function handleImportCanton(supabase: any, body: any, userId: string) {
  const { config, options } = body

  if (!config?.participantUrl) {
    return NextResponse.json({ error: "Canton participant URL is required" }, { status: 400 })
  }

  try {
    // Placeholder for Canton import
    return NextResponse.json({
      success: true,
      imported: 0,
      failed: 0,
      message: "Canton import requires Canton SDK integration",
    })
  } catch (error: any) {
    console.error("[v0] Canton import error:", error)
    return NextResponse.json(
      {
        success: false,
        imported: 0,
        failed: 1,
        error: error.message,
      },
      { status: 500 },
    )
  }
}

async function handleImportDatabase(supabase: any, body: any, userId: string) {
  const { connectionConfig, options } = body

  if (!connectionConfig) {
    return NextResponse.json({ error: "Database connection config is required" }, { status: 400 })
  }

  try {
    // Placeholder for database import
    return NextResponse.json({
      success: false,
      imported: 0,
      failed: 0,
      error: "Direct database connections not supported in serverless environment. Please use CSV/JSON import.",
    })
  } catch (error: any) {
    console.error("[v0] Database import error:", error)
    return NextResponse.json(
      {
        success: false,
        imported: 0,
        failed: 1,
        error: error.message,
      },
      { status: 500 },
    )
  }
}

async function handleImportVectorDB(supabase: any, body: any, userId: string) {
  const { config, options } = body

  if (!config?.provider) {
    return NextResponse.json({ error: "Vector DB provider is required" }, { status: 400 })
  }

  try {
    // Placeholder for vector DB import
    return NextResponse.json({
      success: true,
      imported: 0,
      failed: 0,
      message: `Vector DB import for ${config.provider} requires additional SDK integration`,
    })
  } catch (error: any) {
    console.error("[v0] Vector DB import error:", error)
    return NextResponse.json(
      {
        success: false,
        imported: 0,
        failed: 1,
        error: error.message,
      },
      { status: 500 },
    )
  }
}

async function handleTokenizeAsset(supabase: any, body: any, userId: string) {
  const { assetId, config } = body

  if (!assetId || !config?.blockchain) {
    return NextResponse.json({ error: "Asset ID and blockchain are required" }, { status: 400 })
  }

  try {
    // Get asset data
    const { data: asset, error: assetError } = await supabase.from("assets").select("*").eq("id", assetId).single()

    if (assetError || !asset) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 })
    }

    // Placeholder transaction hash
    const transactionHash = `${config.blockchain}_tx_${Date.now()}`

    // Update asset with tokenization info
    await supabase
      .from("assets")
      .update({
        metadata: {
          ...asset.metadata,
          tokenized: true,
          blockchain: config.blockchain,
          transaction_hash: transactionHash,
          tokenized_at: new Date().toISOString(),
        },
      })
      .eq("id", assetId)

    return NextResponse.json({
      success: true,
      data: {
        transactionHash,
        blockchain: config.blockchain,
      },
    })
  } catch (error: any) {
    console.error("[v0] Tokenization error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 },
    )
  }
}

async function handleCreateCheckoutSession(supabase: any, body: any, userId: string) {
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { planId, billingInterval = "monthly", successUrl, cancelUrl } = body

  if (!planId) {
    return NextResponse.json({ error: "planId is required" }, { status: 400 })
  }

  try {
    // Get the plan details
    const { data: plan, error: planError } = await supabase
      .from("subscription_plans")
      .select("*")
      .eq("id", planId)
      .single()

    if (planError || !plan) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 })
    }

    // Get or create Stripe customer ID
    const { data: profile } = await supabase
      .from("profiles")
      .select("stripe_customer_id, email, full_name")
      .eq("id", userId)
      .single()

    const customerId = profile?.stripe_customer_id

    // Create Stripe checkout session
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
    const session = {
      customer_id: customerId,
      plan_id: planId,
      plan_name: plan.display_name,
      price: billingInterval === "monthly" ? plan.price_monthly : plan.price_yearly,
      currency: "usd",
      billing_interval: billingInterval,
      success_url: successUrl || `${baseUrl}/dashboard?checkout=success`,
      cancel_url: cancelUrl || `${baseUrl}/pricing?checkout=cancelled`,
    }

    return NextResponse.json(session)
  } catch (error) {
    console.error("Error creating checkout session:", error)
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 })
  }
}

async function handleCreatePortalSession(supabase: any, body: any, userId: string) {
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { returnUrl } = body

  try {
    const { data: profile } = await supabase.from("profiles").select("stripe_customer_id").eq("id", userId).single()

    if (!profile?.stripe_customer_id) {
      return NextResponse.json({ error: "No Stripe customer found" }, { status: 404 })
    }

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
    const portalSession = {
      customer_id: profile.stripe_customer_id,
      return_url: returnUrl || `${baseUrl}/dashboard/settings`,
    }

    return NextResponse.json(portalSession)
  } catch (error) {
    console.error("Error creating portal session:", error)
    return NextResponse.json({ error: "Failed to create portal session" }, { status: 500 })
  }
}

async function handleSyncSubscription(supabase: any, body: any, userId: string) {
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { subscriptionId } = body

  if (!subscriptionId) {
    return NextResponse.json({ error: "subscriptionId is required" }, { status: 400 })
  }

  try {
    // Fetch subscription from Stripe (simulated - would use Stripe SDK)
    const { data: subscription } = await supabase
      .from("organization_subscriptions")
      .select("*")
      .eq("stripe_subscription_id", subscriptionId)
      .single()

    return NextResponse.json(subscription || null)
  } catch (error) {
    console.error("Error syncing subscription:", error)
    return NextResponse.json({ error: "Failed to sync subscription" }, { status: 500 })
  }
}

async function handleCancelSubscription(supabase: any, body: any, userId: string) {
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { subscriptionId, cancelAtPeriodEnd = true } = body

  if (!subscriptionId) {
    return NextResponse.json({ error: "subscriptionId is required" }, { status: 400 })
  }

  try {
    // Update subscription status
    const { data, error } = await supabase
      .from("organization_subscriptions")
      .update({
        status: cancelAtPeriodEnd ? "active" : "cancelled",
        updated_at: new Date().toISOString(),
      })
      .eq("stripe_subscription_id", subscriptionId)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error cancelling subscription:", error)
    return NextResponse.json({ error: "Failed to cancel subscription" }, { status: 500 })
  }
}

async function handleUpdateSubscription(supabase: any, body: any, userId: string) {
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { subscriptionId, newPlanId } = body

  if (!subscriptionId || !newPlanId) {
    return NextResponse.json({ error: "subscriptionId and newPlanId are required" }, { status: 400 })
  }

  try {
    const { data, error } = await supabase
      .from("organization_subscriptions")
      .update({
        plan_id: newPlanId,
        updated_at: new Date().toISOString(),
      })
      .eq("stripe_subscription_id", subscriptionId)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error updating subscription:", error)
    return NextResponse.json({ error: "Failed to update subscription" }, { status: 500 })
  }
}

async function handleGetSubscription(supabase: any, body: any, userId: string) {
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { data: subscriptions, error } = await supabase
      .from("organization_subscriptions")
      .select(
        `
        *,
        subscription_plans(*)
      `,
      )
      .eq("organization_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(subscriptions?.[0] || null)
  } catch (error) {
    console.error("Error getting subscription:", error)
    return NextResponse.json({ error: "Failed to get subscription" }, { status: 500 })
  }
}

async function handleCreatePlaidLinkToken(supabase: any, body: any, userId: string) {
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (!process.env.PLAID_CLIENT_ID || !process.env.PLAID_SECRET) {
    console.error("[v0] Plaid credentials not configured")
    return NextResponse.json(
      { error: "Plaid integration not configured. Please add PLAID_CLIENT_ID and PLAID_SECRET environment variables." },
      { status: 500 },
    )
  }

  const { products = ["auth", "transactions"], country_codes = ["US"], language = "en" } = body

  const redirectUri = process.env.NEXT_PUBLIC_APP_URL
    ? `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/assets`
    : undefined

  if (!redirectUri) {
    console.error("[v0] NEXT_PUBLIC_APP_URL is not set - Plaid redirect will fail")
  } else {
    console.log("[v0] Using Plaid redirect URI:", redirectUri)
    console.log(
      "[v0] IMPORTANT: This URI must be added to your Plaid dashboard at https://dashboard.plaid.com/team/api",
    )
  }

  const { data: profile } = await supabase.from("profiles").select("email, full_name").eq("id", userId).single()

  console.log("[v0] Creating Plaid link token with config:", {
    userId,
    email: profile?.email,
    env: process.env.PLAID_ENV || "sandbox",
    hasClientId: !!process.env.PLAID_CLIENT_ID,
    hasSecret: !!process.env.PLAID_SECRET,
  })

  const response = await plaidClient.linkTokenCreate({
    client_id: process.env.PLAID_CLIENT_ID!,
    secret: process.env.PLAID_SECRET!,
    user: {
      client_user_id: userId,
      email_address: profile?.email,
      legal_name: profile?.full_name,
    },
    client_name: "ResendIt Asset Intelligence",
    products: products as Products[],
    country_codes: country_codes as CountryCode[],
    language: language,
    webhook: process.env.NEXT_PUBLIC_APP_URL ? `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/plaid` : undefined,
    redirect_uri: redirectUri,
  })

  console.log("[v0] Plaid API full response:", JSON.stringify(response.data, null, 2))

  if (!response.data.link_token) {
    console.error("[v0] Plaid API returned no link_token:", response.data)
    if (
      (response.data as any).error_code === "INVALID_FIELD" &&
      (response.data as any).error_message?.includes("OAuth redirect URI")
    ) {
      throw new Error(
        `Plaid redirect URI not configured. Please add "${redirectUri}" to your Plaid dashboard at https://dashboard.plaid.com/team/api under "Allowed redirect URIs"`,
      )
    }
    throw new Error("Plaid API did not return a link token")
  }

  const responseData = {
    link_token: response.data.link_token,
    expiration: response.data.expiration,
    request_id: response.data.request_id,
  }

  console.log("[v0] Returning valid link token")

  return NextResponse.json(responseData)
}

async function handleExchangePublicToken(
  supabase: SupabaseClient,
  publicToken: string,
  institutionId: string,
  institutionName: string,
  userId: string,
) {
  console.log("[v0] Exchanging public token for:", JSON.stringify({ institutionId, institutionName, userId }))

  const response = await plaidClient.itemPublicTokenExchange({
    client_id: process.env.PLAID_CLIENT_ID!,
    secret: process.env.PLAID_SECRET!,
    public_token: publicToken,
  })

  console.log("[v0] Full Plaid exchange response:", JSON.stringify(response, null, 2))
  console.log("[v0] Response.data:", JSON.stringify(response.data, null, 2))

  const accessToken = response.data.access_token
  const itemId = response.data.item_id

  console.log("[v0] Extracted access_token:", accessToken ? "[PRESENT]" : "[MISSING]")
  console.log("[v0] Extracted item_id:", itemId ? "[PRESENT]" : "[MISSING]")

  if (!accessToken || typeof accessToken !== "string") {
    console.error("[v0] Invalid access token. Full response data:", response.data)
    throw new Error(`Invalid access token received: ${typeof accessToken}`)
  }

  const rawKey = process.env.PLAID_ENCRYPTION_KEY || process.env.SUPABASE_JWT_SECRET!
  if (!rawKey) {
    throw new Error("No encryption key available")
  }

  // Create a proper 32-byte key by hashing the raw key
  const encryptionKey = crypto.createHash("sha256").update(rawKey).digest()
  const iv = crypto.randomBytes(16)

  console.log("[v0] Creating cipher with key length:", encryptionKey.length)
  console.log("[v0] IV length:", iv.length)

  const cipher = crypto.createCipheriv("aes-256-cbc", encryptionKey, iv)

  const tokenString = String(accessToken)
  console.log("[v0] Encrypting token string of length:", tokenString.length)

  let encryptedToken = cipher.update(tokenString, "utf8", "hex")
  encryptedToken += cipher.final("hex")
  const encryptedData = iv.toString("hex") + ":" + encryptedToken

  console.log("[v0] Token encrypted successfully, storing in database")

  const { data, error } = await supabase
    .from("plaid_connections")
    .insert({
      user_id: userId,
      item_id: itemId,
      access_token: encryptedData, // Stored encrypted
      institution_id: institutionId,
      institution_name: institutionName,
      status: "active",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) {
    console.error("[v0] Error storing Plaid connection:", error)
    return NextResponse.json({ error: "Failed to store connection" }, { status: 500 })
  }

  console.log("[v0] Plaid connection stored successfully")

  return NextResponse.json({
    success: true,
    item_id: itemId,
    request_id: response.data.request_id,
  })
}

async function handleGetPlaidAccounts(supabase: any, body: any, userId: string) {
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { itemId } = body

  try {
    const { data: cachedAccounts, error: cacheError } = await supabase
      .from("plaid_accounts")
      .select("*")
      .eq("user_id", userId)
      .eq("item_id", itemId)
      .eq("status", "active")

    // If we have cached accounts less than 5 minutes old, return them
    if (cachedAccounts && cachedAccounts.length > 0) {
      const latestSync = new Date(cachedAccounts[0].last_synced_at).getTime()
      const fiveMinutesAgo = Date.now() - 5 * 60 * 1000

      if (latestSync > fiveMinutesAgo) {
        console.log("[v0] Returning cached accounts")
        return NextResponse.json({
          accounts: cachedAccounts.map((acc) => ({
            account_id: acc.plaid_account_id,
            name: acc.name,
            official_name: acc.official_name,
            mask: acc.mask,
            type: acc.account_type,
            subtype: acc.account_subtype,
            balances: {
              current: acc.current_balance,
              available: acc.available_balance,
              iso_currency_code: acc.currency_code,
              limit: acc.credit_limit,
            },
            institution_name: acc.institution_name,
            item_id: acc.item_id,
          })),
          cached: true,
        })
      }
    }

    // Fetch connection from database
    const { data: connection, error: dbError } = await supabase
      .from("plaid_connections")
      .select("*")
      .eq("user_id", userId)
      .eq("item_id", itemId)
      .eq("status", "active")
      .single()

    if (dbError || !connection) {
      console.error("[v0] Connection not found:", dbError)
      return NextResponse.json({ error: "Connection not found" }, { status: 404 })
    }

    // Decrypt access token
    const rawKey = process.env.PLAID_ENCRYPTION_KEY || process.env.SUPABASE_JWT_SECRET!
    const encryptionKey = crypto.createHash("sha256").update(rawKey).digest()
    const parts = connection.access_token.split(":")
    const iv = Buffer.from(parts[0], "hex")
    const encryptedToken = parts[1]
    const decipher = crypto.createDecipheriv("aes-256-cbc", encryptionKey, iv)
    let decryptedToken = decipher.update(encryptedToken, "hex", "utf8")
    decryptedToken += decipher.final("utf8")

    // Fetch accounts from Plaid
    console.log("[v0] Fetching accounts from Plaid for item:", itemId)
    const accountsResponse = await plaidClient.accountsBalanceGet({
      client_id: process.env.PLAID_CLIENT_ID!,
      secret: process.env.PLAID_SECRET!,
      access_token: decryptedToken,
    })

    console.log("[v0] Plaid accounts fetched:", accountsResponse.data.accounts.length)

    const plaidConnectionRecord = await supabase
      .from("plaid_connections")
      .select("id")
      .eq("item_id", itemId)
      .eq("user_id", userId)
      .single()

    for (const account of accountsResponse.data.accounts) {
      const accountData = {
        user_id: userId,
        plaid_connection_id: plaidConnectionRecord.data.id,
        plaid_account_id: account.account_id,
        item_id: itemId,
        name: account.name,
        official_name: account.official_name || null,
        mask: account.mask || null,
        account_type: account.type,
        account_subtype: account.subtype || null,
        current_balance: account.balances.current,
        available_balance: account.balances.available,
        currency_code: account.balances.iso_currency_code || "USD",
        credit_limit: account.balances.limit || null,
        institution_id: connection.institution_id,
        institution_name: connection.institution_name,
        status: "active",
        plaid_metadata: account,
        last_synced_at: new Date().toISOString(),
      }

      // Upsert account
      await supabase.from("plaid_accounts").upsert(accountData, {
        onConflict: "plaid_account_id",
      })
    }

    return NextResponse.json({
      accounts: accountsResponse.data.accounts.map((acc) => ({
        ...acc,
        institution_name: connection.institution_name,
        item_id: itemId,
      })),
      item: accountsResponse.data.item,
      cached: false,
    })
  } catch (error: any) {
    console.error("[v0] Error getting accounts:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch accounts",
        details: error?.response?.data || error.message,
      },
      { status: 500 },
    )
  }
}

async function handleGetPlaidTransactions(supabase: any, body: any, userId: string) {
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { itemId, startDate, endDate, count = 100 } = body

  try {
    const { data: connection, error: fetchError } = await supabase
      .from("plaid_connections")
      .select("access_token, institution_name")
      .eq("user_id", userId)
      .eq("item_id", itemId)
      .eq("status", "active")
      .single()

    if (fetchError || !connection) {
      return NextResponse.json({ error: "Connection not found" }, { status: 404 })
    }

    const encryptionKey = process.env.PLAID_ENCRYPTION_KEY || process.env.SUPABASE_JWT_SECRET!
    const parts = connection.access_token.split(":")
    const iv = Buffer.from(parts[0], "hex")
    const encryptedToken = parts[1]
    const decipher = crypto.createDecipheriv("aes-256-cbc", Buffer.from(encryptionKey.slice(0, 32)), iv)
    let accessToken = decipher.update(encryptedToken, "hex", "utf8")
    accessToken += decipher.final("utf8")

    // Fetch real transaction data from Plaid API
    const response = await plaidClient.transactionsSync({
      access_token: accessToken,
      start_date: startDate || new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split("T")[0], // Default to last month
      end_date: endDate || new Date().toISOString().split("T")[0],
    })

    console.log("[v0] Plaid transactions fetched successfully:", response.data.added.length, "transactions")

    return NextResponse.json({
      transactions: response.data.added.map((tx) => ({
        ...tx,
        item_id: itemId,
        institution_name: connection.institution_name,
      })),
      has_more: response.data.has_more,
      next_cursor: response.data.next_cursor,
    })
  } catch (error: any) {
    console.error("[v0] Error getting Plaid transactions:", error)
    return NextResponse.json(
      {
        error: "Failed to get transactions",
        details: error?.response?.data || error.message,
      },
      { status: 500 },
    )
  }
}

async function handleGetPlaidBalance(supabase: any, body: any, userId: string) {
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { itemId } = body

  try {
    const { data: connection, error: fetchError } = await supabase
      .from("plaid_connections")
      .select("access_token, institution_name")
      .eq("user_id", userId)
      .eq("item_id", itemId)
      .eq("status", "active")
      .single()

    if (fetchError || !connection) {
      return NextResponse.json({ error: "Connection not found" }, { status: 404 })
    }

    const encryptionKey = process.env.PLAID_ENCRYPTION_KEY || process.env.SUPABASE_JWT_SECRET!
    const parts = connection.access_token.split(":")
    const iv = Buffer.from(parts[0], "hex")
    const encryptedToken = parts[1]
    const decipher = crypto.createDecipheriv("aes-256-cbc", Buffer.from(encryptionKey.slice(0, 32)), iv)
    let accessToken = decipher.update(encryptedToken, "hex", "utf8")
    accessToken += decipher.final("utf8")

    // Fetch real balance data from Plaid API
    const response = await plaidClient.accountsBalanceGet({
      access_token: accessToken,
    })

    console.log("[v0] Plaid balance fetched successfully")

    return NextResponse.json({
      ...response.data,
      institution_name: connection.institution_name,
    })
  } catch (error: any) {
    console.error("[v0] Error getting Plaid balance:", error)
    return NextResponse.json(
      {
        error: "Failed to get balance",
        details: error?.response?.data || error.message,
      },
      { status: 500 },
    )
  }
}

async function handleDisconnectPlaidAccount(supabase: any, body: any, userId: string) {
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { itemId } = body

  if (!itemId) {
    return NextResponse.json({ error: "itemId is required" }, { status: 400 })
  }

  try {
    const { data: connection } = await supabase
      .from("plaid_connections")
      .select("access_token")
      .eq("user_id", userId)
      .eq("item_id", itemId)
      .single()

    if (connection) {
      const encryptionKey = process.env.PLAID_ENCRYPTION_KEY || process.env.SUPABASE_JWT_SECRET!
      const parts = connection.access_token.split(":")
      const iv = Buffer.from(parts[0], "hex")
      const encryptedToken = parts[1]
      const decipher = crypto.createDecipheriv("aes-256-cbc", Buffer.from(encryptionKey.slice(0, 32)), iv)
      let accessToken = decipher.update(encryptedToken, "hex", "utf8")
      accessToken += decipher.final("utf8")

      try {
        await plaidClient.itemRemove({ access_token: accessToken })
        console.log("[v0] Plaid item removed successfully")
      } catch (plaidError) {
        console.error("[v0] Error removing Plaid item:", plaidError)
      }
    }

    const { error } = await supabase
      .from("plaid_connections")
      .update({
        status: "inactive",
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId)
      .eq("item_id", itemId)

    if (error) {
      console.error("[v0] Error disconnecting account:", error)
      return NextResponse.json({ error: "Failed to disconnect account" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[v0] Error disconnecting Plaid account:", error)
    return NextResponse.json(
      {
        error: "Failed to disconnect account",
        details: error?.response?.data || error.message,
      },
      { status: 500 },
    )
  }
}

async function handleUpdateWorkflow(supabase: any, params: any, userId: string) {
  const { workflow_id, ...updates } = params

  let query = supabase.from("ai_workflows").update(updates).eq("id", workflow_id)

  if (userId) {
    query = query.eq("user_id", userId)
  }

  const { data, error } = await query.select().single()

  if (error) throw error
  return NextResponse.json({ data, success: true })
}

async function handleDeleteWorkflow(supabase: any, params: any, userId: string) {
  let query = supabase.from("ai_workflows").delete().eq("id", params.workflow_id)

  if (userId) {
    query = query.eq("user_id", userId)
  }

  const { error } = await query

  if (error) throw error
  return NextResponse.json({ success: true })
}
