// Auto-generated RSPC bindings - would be generated from Rust backend
export interface Procedures {
  queries: {
    // Asset queries
    "assets.list": {
      input: {
        page?: number
        limit?: number
        status?: "active" | "inactive" | "maintenance"
        type?: string
      }
      output: {
        assets: Asset[]
        total: number
        page: number
        limit: number
      }
    }
    "assets.get": {
      input: { id: string }
      output: Asset | null
    }
    "assets.analytics": {
      input: { timeRange?: "7d" | "30d" | "90d" }
      output: AssetAnalytics
    }

    // AI Agent queries
    "agents.list": {
      input: { status?: "active" | "inactive" | "training" }
      output: AIAgent[]
    }
    "agents.get": {
      input: { id: string }
      output: AIAgent | null
    }
    "agents.metrics": {
      input: {
        agentId: string
        timeRange?: "1h" | "24h" | "7d"
      }
      output: AgentMetrics
    }

    // Workflow queries
    "workflows.list": {
      input: { status?: "active" | "inactive" | "draft" }
      output: WorkflowDefinition[]
    }
    "workflows.get": {
      input: { id: string }
      output: WorkflowDefinition | null
    }
    "workflows.executions": {
      input: {
        workflowId: string
        limit?: number
      }
      output: WorkflowExecution[]
    }

    // Dashboard queries
    "dashboard.overview": {
      input: {}
      output: DashboardOverview
    }
    "dashboard.recent_activity": {
      input: { limit?: number }
      output: Activity[]
    }
  }

  mutations: {
    // Asset mutations
    "assets.create": {
      input: CreateAssetInput
      output: Asset
    }
    "assets.update": {
      input: { id: string } & Partial<UpdateAssetInput>
      output: Asset
    }
    "assets.delete": {
      input: { id: string }
      output: { success: boolean }
    }

    // AI Agent mutations
    "agents.create": {
      input: CreateAgentInput
      output: AIAgent
    }
    "agents.update": {
      input: { id: string } & Partial<UpdateAgentInput>
      output: AIAgent
    }
    "agents.start": {
      input: { id: string }
      output: { success: boolean }
    }
    "agents.stop": {
      input: { id: string }
      output: { success: boolean }
    }

    // Workflow mutations
    "workflows.create": {
      input: CreateWorkflowInput
      output: WorkflowDefinition
    }
    "workflows.update": {
      input: { id: string } & Partial<UpdateWorkflowInput>
      output: WorkflowDefinition
    }
    "workflows.execute": {
      input: { id: string }
      output: WorkflowExecution
    }
    "workflows.pause": {
      input: { id: string }
      output: { success: boolean }
    }
    "workflows.resume": {
      input: { id: string }
      output: { success: boolean }
    }
  }

  subscriptions: {
    // Real-time subscriptions
    "assets.status_updates": {
      input: { assetIds?: string[] }
      output: AssetStatusUpdate
    }
    "agents.performance_updates": {
      input: { agentIds?: string[] }
      output: AgentPerformanceUpdate
    }
    "workflows.execution_updates": {
      input: { workflowIds?: string[] }
      output: WorkflowExecutionUpdate
    }
    "system.notifications": {
      input: {}
      output: SystemNotification
    }
  }
}

// Type definitions
export interface Asset {
  id: string
  name: string
  type: string
  status: "active" | "inactive" | "maintenance"
  location?: string
  value?: number
  description?: string
  metadata: Record<string, any>
  created_at: string
  updated_at: string
  owner_id: string
}

export interface CreateAssetInput {
  name: string
  type: string
  status?: "active" | "inactive" | "maintenance"
  location?: string
  value?: number
  description?: string
  metadata?: Record<string, any>
}

export interface UpdateAssetInput {
  name?: string
  type?: string
  status?: "active" | "inactive" | "maintenance"
  location?: string
  value?: number
  description?: string
  metadata?: Record<string, any>
}

export interface AssetAnalytics {
  total_count: number
  status_distribution: Record<string, number>
  type_distribution: Record<string, number>
  value_trends: Array<{ date: string; total_value: number }>
  performance_metrics: {
    uptime: number
    efficiency: number
    maintenance_cost: number
  }
}

export interface AIAgent {
  id: string
  name: string
  type: string
  status: "active" | "inactive" | "training"
  configuration: Record<string, any>
  performance_metrics: {
    accuracy: number
    uptime: number
    tasks_completed: number
    avg_response_time: number
  }
  created_at: string
  updated_at: string
  owner_id: string
}

export interface CreateAgentInput {
  name: string
  type: string
  configuration: Record<string, any>
}

export interface UpdateAgentInput {
  name?: string
  type?: string
  configuration?: Record<string, any>
}

export interface AgentMetrics {
  agent_id: string
  performance_history: Array<{
    timestamp: string
    performance: number
    uptime: number
    tasks_completed: number
  }>
  current_status: {
    is_active: boolean
    last_activity: string
    current_task?: string
  }
}

export interface WorkflowDefinition {
  id: string
  name: string
  description?: string
  status: "active" | "inactive" | "draft"
  steps: WorkflowStep[]
  triggers: WorkflowTrigger[]
  schedule?: string
  created_at: string
  updated_at: string
  owner_id: string
}

export interface WorkflowStep {
  id: string
  name: string
  type: string
  configuration: Record<string, any>
  order: number
}

export interface WorkflowTrigger {
  type: "schedule" | "event" | "threshold" | "manual"
  configuration: Record<string, any>
}

export interface CreateWorkflowInput {
  name: string
  description?: string
  steps: Omit<WorkflowStep, "id">[]
  triggers: WorkflowTrigger[]
  schedule?: string
}

export interface UpdateWorkflowInput {
  name?: string
  description?: string
  steps?: Omit<WorkflowStep, "id">[]
  triggers?: WorkflowTrigger[]
  schedule?: string
  status?: "active" | "inactive" | "draft"
}

export interface WorkflowExecution {
  id: string
  workflow_id: string
  status: "running" | "completed" | "failed" | "cancelled"
  started_at: string
  completed_at?: string
  error_message?: string
  step_results: Array<{
    step_id: string
    status: "pending" | "running" | "completed" | "failed"
    started_at?: string
    completed_at?: string
    output?: any
    error?: string
  }>
}

export interface DashboardOverview {
  assets: {
    total: number
    active: number
    inactive: number
    maintenance: number
  }
  agents: {
    total: number
    active: number
    training: number
    inactive: number
  }
  workflows: {
    total: number
    active: number
    executions_today: number
    success_rate: number
  }
  system_health: {
    overall_score: number
    uptime: number
    performance: number
  }
}

export interface Activity {
  id: string
  type: "asset" | "agent" | "workflow" | "system"
  title: string
  description: string
  timestamp: string
  severity: "info" | "warning" | "error" | "success"
  metadata?: Record<string, any>
}

export interface AssetStatusUpdate {
  asset_id: string
  status: "active" | "inactive" | "maintenance"
  timestamp: string
  metadata?: Record<string, any>
}

export interface AgentPerformanceUpdate {
  agent_id: string
  performance: number
  uptime: number
  tasks_completed: number
  timestamp: string
}

export interface WorkflowExecutionUpdate {
  execution_id: string
  workflow_id: string
  status: "running" | "completed" | "failed" | "cancelled"
  current_step?: string
  progress: number
  timestamp: string
}

export interface SystemNotification {
  id: string
  type: "info" | "warning" | "error" | "success"
  title: string
  message: string
  timestamp: string
  read: boolean
  actions?: Array<{
    label: string
    action: string
  }>
}
