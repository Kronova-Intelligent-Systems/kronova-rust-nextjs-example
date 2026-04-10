import type { Database } from "../types/database"

// Core rspc types
export interface RSPCError {
  code: string
  message: string
}

export interface RSPCResponse<T> {
  success: boolean
  data?: T
  error?: RSPCError
}

// Authentication types
export interface SignUpInput {
  full_name: string
  email: string
  company: string
  job_title?: string
  website: string
  linkedin_url?: string
  avatar_url?: string
  company_logo_url?: string
  password: string
}

export interface SignInInput {
  email: string
  password: string
}

export interface AuthResponse {
  session: any
  user: Database["public"]["Tables"]["profiles"]["Row"]
}

// Asset types
export interface AssetInput {
  asset_id: string
  name: string
  asset_type: string
  category?: string
  description?: string
  purchase_cost?: number
  purchase_date?: string
  current_value?: number
  status: string
  specifications?: Record<string, any>
  current_location?: Record<string, any>
  iot_sensor_id?: string
  nfc_tag_id?: string
  qr_code?: string
  ai_agent_config?: Record<string, any>
  workflow_settings?: Record<string, any>
  maintenance_schedule?: Record<string, any>
  compliance_data?: Record<string, any>
  esg_metrics?: Record<string, any>
  predictive_data?: Record<string, any>
  risk_score?: number
  depreciation_rate?: number
  metadata?: Record<string, any>
}

export type Asset = Database["public"]["Tables"]["assets"]["Row"]

// AI Agent types
export interface AIAgentInput {
  name: string
  description?: string
  system_prompt?: string
  model_id?: string
  parameters?: Record<string, any>
  tools?: Record<string, any>
  max_tokens?: number
  temperature?: number
  is_active?: boolean
}

export type AIAgent = Database["public"]["Tables"]["ai_agents"]["Row"]

// Workflow types
export interface AIWorkflowInput {
  name: string
  description?: string
  steps: Record<string, any>[]
  trigger_type?: string
  trigger_config?: Record<string, any>
  is_active?: boolean
}

export type AIWorkflow = Database["public"]["Tables"]["ai_workflows"]["Row"]

// Shipping types
export interface ShippingInput {
  tracking_number: string
  carrier: string
  service_level: string
  origin_address: Record<string, any>
  destination_address: Record<string, any>
  shipping_date?: string
  estimated_delivery?: string
  package_ids?: string[]
  weight?: number
  dimensions?: {
    length: number
    width: number
    height: number
    unit: "cm" | "in"
  }
  shipping_cost?: number
  currency?: string
  notes?: string
  iot_sensor_id?: string
  is_refrigerated?: boolean
  temperature_range?: {
    min: number
    max: number
    unit: "C" | "F"
  }
}

export type Shipping = Database["public"]["Tables"]["shipping"]["Row"]

// Business Card types
export interface BusinessCardInput {
  name: string
  businesscard_name?: string
  style: Record<string, any>
}

export type BusinessCard = Database["public"]["Tables"]["business_cards"]["Row"]

// IoT Sensor types
export type IoTSensor = Database["public"]["Tables"]["iot_sensors"]["Row"]
export type IoTSensorReading = Database["public"]["Tables"]["iot_sensor_readings"]["Row"]

// Package types
export type Package = Database["public"]["Tables"]["packages"]["Row"]

// NFT types
export type NFT = Database["public"]["Tables"]["nfts"]["Row"]

// Analytics types
export type AssetAnalytics = Database["public"]["Views"]["asset_analytics"]["Row"]
export type ShippingAnalytics = Database["public"]["Views"]["shipping_analytics"]["Row"]
export type IoTSensorAnalytics = Database["public"]["Views"]["iot_sensor_analytics"]["Row"]

// Import config types
export interface BitcoinImportInput {
  address: string
  importType?: "utxo" | "balance"
}

export interface EthereumImportInput {
  address: string
  contractAddress?: string
  importType?: "balance" | "erc20" | "erc721"
}

export interface SuiImportInput {
  config: {
    walletAddress: string
    rpcUrl?: string
    objectType?: string
  }
  options?: Record<string, any>
}

export interface CantonImportInput {
  config: {
    participantUrl: string
    apiToken: string
    templateId?: string
    contractFilter?: Record<string, any>
  }
  options?: Record<string, any>
}

export interface DatabaseImportInput {
  connectionConfig: {
    type: "postgresql" | "mysql" | "mongodb"
    host: string
    port: number
    database: string
    username: string
    password: string
    query: string
  }
  options?: Record<string, any>
}

export interface VectorDBImportInput {
  config: {
    provider: "pinecone" | "weaviate" | "qdrant"
    apiKey: string
    endpoint?: string
    index: string
    namespace?: string
    filter?: Record<string, any>
    limit?: number
  }
  options?: Record<string, any>
}

export interface TokenizeAssetInput {
  assetId: string
  config: {
    blockchain: "linea" | "sui" | "canton"
    contractAddress?: string
    privateKey?: string
  }
}

export interface ImportResult {
  success: boolean
  imported: number
  failed: number
  errors?: Array<{ row: number; error: string }>
  data?: any[]
}

export interface AgentExecuteInput {
  agent_id: string
  prompt: string
  assetIds?: string[]
  dataStreamIds?: string[]
  webhookUrl?: string
}

export interface WorkflowExecuteInput {
  workflow_id: string
  input?: Record<string, any>
  webhookUrl?: string
}

export interface WebhookTriggerInput {
  event_type: string
  payload: Record<string, any>
  webhook_id?: string
}

// Stripe Payment types
export interface CreateCheckoutSessionInput {
  planId: string
  billingInterval?: "monthly" | "yearly"
  successUrl?: string
  cancelUrl?: string
}

export interface CheckoutSession {
  customer_id?: string
  plan_id: string
  plan_name: string
  price: number
  currency: string
  billing_interval: string
  success_url: string
  cancel_url: string
}

export interface CreatePortalSessionInput {
  returnUrl?: string
}

export interface PortalSession {
  customer_id: string
  return_url: string
}

export interface SyncSubscriptionInput {
  subscriptionId: string
}

export interface CancelSubscriptionInput {
  subscriptionId: string
  cancelAtPeriodEnd?: boolean
}

export interface UpdateSubscriptionInput {
  subscriptionId: string
  newPlanId: string
}

export interface GetSubscriptionInput {
  organizationId?: string
}

export interface OrganizationSubscription {
  id: string
  organization_id: string
  plan_id: string
  stripe_customer_id: string
  stripe_subscription_id: string
  status: "active" | "cancelled" | "past_due" | "unpaid" | "trialing"
  current_period_start: string
  current_period_end: string
  trial_end?: string
  created_at: string
  updated_at: string
  subscription_plans?: any
}

// Plaid Integration types
export interface CreatePlaidLinkTokenInput {
  products?: string[]
  country_codes?: string[]
  language?: string
}

export interface PlaidLinkToken {
  link_token: string
  expiration: string
  request_id: string
}

export interface ExchangePublicTokenInput {
  publicToken: string
  institutionId?: string
  institutionName?: string
  accounts?: any[]
}

export interface PlaidAccessToken {
  access_token: string
  item_id: string
  request_id: string
}

export interface GetPlaidAccountsInput {
  itemId: string
}

export interface PlaidAccount {
  account_id: string
  name: string
  official_name?: string
  type: string
  subtype: string
  mask: string
  balances: {
    available: number | null
    current: number
    limit: number | null
    iso_currency_code: string
  }
}

export interface GetPlaidTransactionsInput {
  itemId: string
  startDate?: string
  endDate?: string
  count?: number
}

export interface PlaidTransaction {
  transaction_id: string
  account_id: string
  amount: number
  date: string
  name: string
  merchant_name?: string
  category?: string[]
  pending: boolean
  iso_currency_code: string
}

export interface GetPlaidBalanceInput {
  itemId: string
}

export interface PlaidBalance {
  accounts: Array<{
    account_id: string
    balances: {
      available: number | null
      current: number
      limit: number | null
      iso_currency_code: string
    }
  }>
}

export interface DisconnectPlaidAccountInput {
  itemId: string
}

// Router procedure types
export interface RouterProcedures {
  // Authentication
  "auth.signUp": {
    input: SignUpInput
    output: RSPCResponse<AuthResponse>
  }
  "auth.signIn": {
    input: SignInInput
    output: RSPCResponse<AuthResponse>
  }
  "auth.signOut": {
    input: void
    output: RSPCResponse<void>
  }
  "auth.forgotPassword": {
    input: { email: string }
    output: RSPCResponse<{ message: string }>
  }
  "auth.resetPassword": {
    input: { token: string; password: string }
    output: RSPCResponse<{ message: string }>
  }

  // Profile
  "profile.get": {
    input: void
    output: RSPCResponse<Database["public"]["Tables"]["profiles"]["Row"]>
  }
  "profile.update": {
    input: Partial<Database["public"]["Tables"]["profiles"]["Update"]>
    output: RSPCResponse<Database["public"]["Tables"]["profiles"]["Row"]>
  }

  // Assets
  "assets.list": {
    input: void
    output: RSPCResponse<Asset[]>
  }
  "assets.get": {
    input: { id: string }
    output: RSPCResponse<Asset>
  }
  "assets.create": {
    input: AssetInput
    output: RSPCResponse<Asset>
  }
  "assets.update": {
    input: { id: string; data: Partial<AssetInput> }
    output: RSPCResponse<Asset>
  }
  "assets.delete": {
    input: { id: string }
    output: RSPCResponse<void>
  }
  "assets.analytics": {
    input: void
    output: RSPCResponse<AssetAnalytics[]>
  }
  "assets.import.bitcoin": {
    input: BitcoinImportInput
    output: RSPCResponse<ImportResult>
  }
  "assets.import.ethereum": {
    input: EthereumImportInput
    output: RSPCResponse<ImportResult>
  }
  "assets.import.sui": {
    input: SuiImportInput
    output: RSPCResponse<ImportResult>
  }
  "assets.import.canton": {
    input: CantonImportInput
    output: RSPCResponse<ImportResult>
  }
  "assets.import.database": {
    input: DatabaseImportInput
    output: RSPCResponse<ImportResult>
  }
  "assets.import.vector_db": {
    input: VectorDBImportInput
    output: RSPCResponse<ImportResult>
  }
  "assets.tokenize": {
    input: TokenizeAssetInput
    output: RSPCResponse<{ transactionHash: string; blockchain: string }>
  }

  // AI Agents
  "ai.agents.list": {
    input: void
    output: RSPCResponse<AIAgent[]>
  }
  "ai.agents.get": {
    input: { id: string }
    output: RSPCResponse<AIAgent>
  }
  "ai.agents.create": {
    input: AIAgentInput
    output: RSPCResponse<AIAgent>
  }
  "ai.agents.update": {
    input: { id: string; data: Partial<AIAgentInput> }
    output: RSPCResponse<AIAgent>
  }
  "ai.agents.delete": {
    input: { id: string }
    output: RSPCResponse<void>
  }
  "ai.agents.execute": {
    input: { id: string; prompt: string }
    output: RSPCResponse<{ response: string; data?: Record<string, any> }>
  }
  "agents.execute": {
    input: AgentExecuteInput
    output: RSPCResponse<{ executionId: string; status: string; timestamp: string }>
  }
  "agents.get": {
    input: { id: string }
    output: RSPCResponse<AIAgent>
  }

  // AI Workflows
  "ai.workflows.list": {
    input: void
    output: RSPCResponse<AIWorkflow[]>
  }
  "ai.workflows.create": {
    input: AIWorkflowInput
    output: RSPCResponse<AIWorkflow>
  }
  "ai.workflows.update": {
    input: { id: string; data: Partial<AIWorkflowInput> }
    output: RSPCResponse<AIWorkflow>
  }
  "ai.workflows.delete": {
    input: { id: string }
    output: RSPCResponse<void>
  }
  "ai.workflows.execute": {
    input: { id: string; input?: Record<string, any> }
    output: RSPCResponse<Record<string, any>>
  }
  "workflows.execute": {
    input: WorkflowExecuteInput
    output: RSPCResponse<{ executionId: string; status: string; timestamp: string }>
  }
  "workflows.get": {
    input: { id: string }
    output: RSPCResponse<AIWorkflow>
  }
  "workflows.runs": {
    input: { workflow_id: string; limit?: number }
    output: RSPCResponse<any[]>
  }
  "workflows.update": {
    input: { workflow_id: string; data: Partial<AIWorkflowInput> }
    output: RSPCResponse<AIWorkflow>
  }
  "workflows.delete": {
    input: { workflow_id: string }
    output: RSPCResponse<void>
  }

  // Webhooks
  "webhooks.trigger": {
    input: WebhookTriggerInput
    output: RSPCResponse<{ delivered: number; total: number; results: any[] }>
  }

  // Shipping
  "shipping.list": {
    input: void
    output: RSPCResponse<Shipping[]>
  }
  "shipping.get": {
    input: { id: string }
    output: RSPCResponse<Shipping>
  }
  "shipping.create": {
    input: ShippingInput
    output: RSPCResponse<Shipping>
  }
  "shipping.update": {
    input: { id: string; data: Partial<ShippingInput> }
    output: RSPCResponse<Shipping>
  }
  "shipping.analytics": {
    input: void
    output: RSPCResponse<ShippingAnalytics[]>
  }
  "shipping.sensorData": {
    input: { id: string }
    output: RSPCResponse<{
      sensor_readings: IoTSensorReading[]
      location_history: any[]
      sensor_alerts: any[]
    }>
  }

  // Business Cards
  "businessCards.list": {
    input: void
    output: RSPCResponse<BusinessCard[]>
  }
  "businessCards.get": {
    input: { id: string }
    output: RSPCResponse<BusinessCard>
  }
  "businessCards.create": {
    input: BusinessCardInput
    output: RSPCResponse<BusinessCard>
  }
  "businessCards.update": {
    input: { id: string; data: Partial<BusinessCardInput> }
    output: RSPCResponse<BusinessCard>
  }
  "businessCards.delete": {
    input: { id: string }
    output: RSPCResponse<void>
  }

  // IoT Sensors
  "iot.sensors.list": {
    input: void
    output: RSPCResponse<IoTSensor[]>
  }
  "iot.sensors.readings": {
    input: { sensorId: string; limit?: number }
    output: RSPCResponse<IoTSensorReading[]>
  }
  "iot.analytics": {
    input: void
    output: RSPCResponse<IoTSensorAnalytics[]>
  }

  // Packages
  "packages.list": {
    input: void
    output: RSPCResponse<Package[]>
  }
  "packages.get": {
    input: { id: string }
    output: RSPCResponse<Package>
  }
  "packages.create": {
    input: Database["public"]["Tables"]["packages"]["Insert"]
    output: RSPCResponse<Package>
  }
  "packages.update": {
    input: { id: string; data: Database["public"]["Tables"]["packages"]["Update"] }
    output: RSPCResponse<Package>
  }

  // NFTs
  "nfts.list": {
    input: void
    output: RSPCResponse<NFT[]>
  }
  "nfts.get": {
    input: { id: string }
    output: RSPCResponse<NFT>
  }
  "nfts.create": {
    input: Database["public"]["Tables"]["nfts"]["Insert"]
    output: RSPCResponse<NFT>
  }

  // Stripe Payments
  "payments.create_checkout_session": {
    input: CreateCheckoutSessionInput
    output: RSPCResponse<CheckoutSession>
  }
  "payments.create_portal_session": {
    input: CreatePortalSessionInput
    output: RSPCResponse<PortalSession>
  }
  "payments.sync_subscription": {
    input: SyncSubscriptionInput
    output: RSPCResponse<OrganizationSubscription | null>
  }
  "payments.cancel_subscription": {
    input: CancelSubscriptionInput
    output: RSPCResponse<OrganizationSubscription>
  }
  "payments.update_subscription": {
    input: UpdateSubscriptionInput
    output: RSPCResponse<OrganizationSubscription>
  }
  "payments.get_subscription": {
    input: GetSubscriptionInput
    output: RSPCResponse<OrganizationSubscription | null>
  }

  // Plaid Integration
  "plaid.create_link_token": {
    input: CreatePlaidLinkTokenInput
    output: RSPCResponse<PlaidLinkToken>
  }
  "plaid.exchange_public_token": {
    input: ExchangePublicTokenInput
    output: RSPCResponse<PlaidAccessToken>
  }
  "plaid.get_accounts": {
    input: GetPlaidAccountsInput
    output: RSPCResponse<{ accounts: PlaidAccount[] }>
  }
  "plaid.get_transactions": {
    input: GetPlaidTransactionsInput
    output: RSPCResponse<{ transactions: PlaidTransaction[]; total_count: number }>
  }
  "plaid.get_balance": {
    input: GetPlaidBalanceInput
    output: RSPCResponse<PlaidBalance>
  }
  "plaid.disconnect_account": {
    input: DisconnectPlaidAccountInput
    output: RSPCResponse<{ success: boolean }>
  }
}
