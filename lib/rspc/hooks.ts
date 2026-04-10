import { rspc } from "./client"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"

export function useRSPCQuery<TData = any>(
  key: [string, any?],
  options?: {
    enabled?: boolean
    refetchInterval?: number
  },
) {
  return useQuery({
    queryKey: key,
    queryFn: () => rspc.query(key),
    enabled: options?.enabled,
    refetchInterval: options?.refetchInterval,
  })
}

export function useRSPCMutation<TData = any, TVariables = any>(
  procedure: string,
  options?: {
    onSuccess?: (data: TData) => void
    onError?: (error: any) => void
  },
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (variables: TVariables) => rspc.mutation([procedure, variables]),
    onSuccess: (data) => {
      options?.onSuccess?.(data)
      // Auto-invalidate related queries
      queryClient.invalidateQueries({ queryKey: [procedure.split(".")[0]] })
    },
    onError: options?.onError,
  })
}

// Asset hooks
export function useAssets(params?: {
  page?: number
  limit?: number
  status?: "active" | "inactive" | "maintenance"
  type?: string
}) {
  return useRSPCQuery(["assets.list", params], { enabled: true })
}

export function useAsset(id: string) {
  return useRSPCQuery(["assets.get", id], { enabled: !!id })
}

export function useAssetAnalytics(timeRange?: "7d" | "30d" | "90d") {
  return useRSPCQuery(["assets.analytics", timeRange], { enabled: true })
}

export function useCreateAsset() {
  return useRSPCMutation("assets.create", {
    onSuccess: () => {
      // Auto-invalidation handled by useRSPCMutation
    },
  })
}

export function useUpdateAsset() {
  return useRSPCMutation("assets.update", {
    onSuccess: (data) => {
      // Auto-invalidation handled by useRSPCMutation
    },
  })
}

// AI Agent hooks
export function useAgents(status?: "active" | "inactive" | "training") {
  return useRSPCQuery(["agents.list", status], { enabled: true })
}

export function useAgent(id: string) {
  return useRSPCQuery(["agents.get", id], { enabled: !!id })
}

export function useAgentMetrics(agentId: string, timeRange?: "1h" | "24h" | "7d") {
  return useRSPCQuery(["agents.metrics", agentId, timeRange], { enabled: !!agentId })
}

export function useCreateAgent() {
  return useRSPCMutation("agents.create", {
    onSuccess: () => {
      // Auto-invalidation handled by useRSPCMutation
    },
  })
}

export function useStartAgent() {
  return useRSPCMutation("agents.start", {
    onSuccess: () => {
      // Auto-invalidation handled by useRSPCMutation
    },
  })
}

export function useStopAgent() {
  return useRSPCMutation("agents.stop", {
    onSuccess: () => {
      // Auto-invalidation handled by useRSPCMutation
    },
  })
}

// Workflow hooks
export function useWorkflows(status?: "active" | "inactive" | "draft") {
  return useRSPCQuery(["workflows.list", status], { enabled: true })
}

export function useWorkflow(id: string) {
  return useRSPCQuery(["workflows.get", id], { enabled: !!id })
}

export function useWorkflowExecutions(workflowId: string, limit?: number) {
  return useRSPCQuery(["workflows.executions", workflowId, limit], { enabled: !!workflowId })
}

export function useCreateWorkflow() {
  return useRSPCMutation("workflows.create", {
    onSuccess: () => {
      // Auto-invalidation handled by useRSPCMutation
    },
  })
}

export function useExecuteWorkflow() {
  return useRSPCMutation("workflows.execute", {
    onSuccess: () => {
      // Auto-invalidation handled by useRSPCMutation
    },
  })
}

// Dashboard hooks
export function useDashboardOverview() {
  return useRSPCQuery(["dashboard.overview"], { refetchInterval: 30000 })
}

export function useRecentActivity(limit?: number) {
  return useRSPCQuery(["dashboard.recent_activity", limit], { refetchInterval: 10000 })
}

// Real-time updates hooks (simplified for development)
export function useAssetStatusUpdates(assetIds?: string[]) {
  // For development, we'll use polling instead of subscriptions
  return useRSPCQuery(["assets.status_updates", assetIds], { refetchInterval: 5000, enabled: !!assetIds?.length })
}

export function useAgentPerformanceUpdates(agentIds?: string[]) {
  return useRSPCQuery(["agents.performance_updates", agentIds], { refetchInterval: 5000, enabled: !!agentIds?.length })
}

export function useWorkflowExecutionUpdates(workflowIds?: string[]) {
  return useRSPCQuery(["workflows.execution_updates", workflowIds], {
    refetchInterval: 5000,
    enabled: !!workflowIds?.length,
  })
}

export function useSystemNotifications() {
  return useRSPCQuery(["system.notifications"], { refetchInterval: 10000 })
}

// Settings hooks
export function useProfile() {
  return useRSPCQuery(["settings.profile"], { enabled: true })
}

export function useUpdateProfile() {
  return useRSPCMutation("settings.profile.update", {
    onSuccess: () => {
      // Auto-invalidation handled by useRSPCMutation
    },
  })
}

export function useWebhooks() {
  return useRSPCQuery(["settings.webhooks.list"], { enabled: true })
}

export function useCreateWebhook() {
  return useRSPCMutation("settings.webhooks.create", {
    onSuccess: () => {
      // Auto-invalidation handled by useRSPCMutation
    },
  })
}

export function useUpdateWebhook() {
  return useRSPCMutation("settings.webhooks.update", {
    onSuccess: () => {
      // Auto-invalidation handled by useRSPCMutation
    },
  })
}

export function useDeleteWebhook() {
  return useRSPCMutation("settings.webhooks.delete", {
    onSuccess: () => {
      // Auto-invalidation handled by useRSPCMutation
    },
  })
}

export function useToggleWebhook() {
  return useRSPCMutation("settings.webhooks.toggle", {
    onSuccess: () => {
      // Auto-invalidation handled by useRSPCMutation
    },
  })
}

// Stripe Payment hooks
export function useCreateCheckoutSession() {
  return useRSPCMutation("payments.create_checkout_session", {
    onSuccess: () => {
      // Auto-invalidation handled by useRSPCMutation
    },
  })
}

export function useCreatePortalSession() {
  return useRSPCMutation("payments.create_portal_session", {
    onSuccess: () => {
      // Auto-invalidation handled by useRSPCMutation
    },
  })
}

export function useSyncSubscription() {
  return useRSPCMutation("payments.sync_subscription", {
    onSuccess: () => {
      // Auto-invalidation handled by useRSPCMutation
    },
  })
}

export function useCancelSubscription() {
  return useRSPCMutation("payments.cancel_subscription", {
    onSuccess: () => {
      // Auto-invalidation handled by useRSPCMutation
    },
  })
}

export function useUpdateSubscription() {
  return useRSPCMutation("payments.update_subscription", {
    onSuccess: () => {
      // Auto-invalidation handled by useRSPCMutation
    },
  })
}

export function useGetSubscription() {
  return useRSPCMutation("payments.get_subscription", {
    onSuccess: () => {
      // Auto-invalidation handled by useRSPCMutation
    },
  })
}

// Plaid Integration hooks
export function useCreatePlaidLinkToken() {
  return useRSPCMutation("plaid.create_link_token", {
    onSuccess: () => {
      // Auto-invalidation handled by useRSPCMutation
    },
  })
}

export function useExchangePlaidPublicToken() {
  return useRSPCMutation("plaid.exchange_public_token", {
    onSuccess: () => {
      // Auto-invalidation handled by useRSPCMutation
    },
  })
}

export function useGetPlaidAccounts() {
  return useRSPCMutation("plaid.get_accounts", {
    onSuccess: () => {
      // Auto-invalidation handled by useRSPCMutation
    },
  })
}

export function useGetPlaidTransactions() {
  return useRSPCMutation("plaid.get_transactions", {
    onSuccess: () => {
      // Auto-invalidation handled by useRSPCMutation
    },
  })
}

export function useGetPlaidBalance() {
  return useRSPCMutation("plaid.get_balance", {
    onSuccess: () => {
      // Auto-invalidation handled by useRSPCMutation
    },
  })
}

export function useDisconnectPlaidAccount() {
  return useRSPCMutation("plaid.disconnect_account", {
    onSuccess: () => {
      // Auto-invalidation handled by useRSPCMutation
    },
  })
}
