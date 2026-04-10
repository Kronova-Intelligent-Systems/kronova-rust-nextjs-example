/**
 * Kronova rspc SDK
 *
 * TypeScript SDK that provides type-safe access to Rust serverless functions
 * via rspc protocol. Wraps Supabase Edge Functions with optimized caching,
 * retries, and error handling.
 */

import { rspc } from "@/lib/rspc/client"

// Asset types
export interface Asset {
  id: string
  asset_id: string
  name: string
  asset_type: string
  category?: string
  description?: string
  current_value?: number
  status: string
  created_at: string
  updated_at: string
}

export interface CreateAssetRequest {
  asset_id: string
  name: string
  asset_type: string
  category?: string
  description?: string
  purchase_cost?: number
  current_value?: number
  status: string
}

// Plaid types
export interface PlaidAccount {
  account_id: string
  name: string
  official_name?: string
  mask?: string
  type: string
  subtype?: string
  balances: {
    current: number
    available?: number
    iso_currency_code: string
    limit?: number
  }
  institution_name?: string
  item_id: string
}

export interface PlaidTransaction {
  transaction_id: string
  account_id: string
  amount: number
  date: string
  name: string
  merchant_name?: string
  category: string[]
  pending: boolean
}

/**
 * Kronova SDK Client
 * Provides high-level methods for interacting with the platform
 */
export class KronovaSDK {
  // Assets
  async createAsset(data: CreateAssetRequest): Promise<Asset> {
    const result = await rspc.mutation(["assets.create", data])
    if (!result.success) {
      throw new Error(result.error || "Failed to create asset")
    }
    return result.data
  }

  async listAssets(filters?: { asset_type?: string; status?: string }): Promise<Asset[]> {
    const result = await rspc.query(["assets.list", filters])
    return result.data || []
  }

  async deleteAsset(id: string): Promise<void> {
    const result = await rspc.mutation(["assets.delete", { id }])
    if (!result.success) {
      throw new Error(result.error || "Failed to delete asset")
    }
  }

  // Plaid Banking
  async getPlaidAccounts(itemId: string): Promise<PlaidAccount[]> {
    const result = await rspc.mutation(["plaid.get_accounts", { itemId }])
    return result.data?.accounts || []
  }

  async getPlaidTransactions(itemId: string, startDate: string, endDate: string): Promise<PlaidTransaction[]> {
    const result = await rspc.query(["plaid.get_transactions", { itemId, startDate, endDate }])
    return result.data?.transactions || []
  }

  async getPlaidBalance(itemId: string): Promise<any> {
    const result = await rspc.query(["plaid.get_balance", { itemId }])
    return result.data
  }

  // AI Agents
  async executeAgent(agentId: string, input: any): Promise<any> {
    const result = await rspc.mutation(["ai.agents.execute", { agentId, input }])
    if (!result.success) {
      throw new Error(result.error || "Agent execution failed")
    }
    return result.data
  }

  // Workflows
  async executeWorkflow(workflowId: string, input: any): Promise<any> {
    const result = await rspc.mutation(["workflows.execute", { workflowId, input }])
    if (!result.success) {
      throw new Error(result.error || "Workflow execution failed")
    }
    return result.data
  }
}

// Export singleton instance
export const sdk = new KronovaSDK()
