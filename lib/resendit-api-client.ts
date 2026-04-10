/**
 * Resend-It API Client (Legacy)
 * Re-exports from Kronova API Client for backward compatibility
 * @deprecated Use KronovaAPIClient from lib/kronova-api-client.ts instead
 */

export {
  KronovaAPIClient as ResendItAPIClient,
  kronovaAPI as resenditAPI,
  type ApiKeyScope,
  type AgentExecutionRequest,
  type WorkflowExecutionRequest,
  type AgentExecutionResponse,
  type WorkflowExecutionResponse,
} from "./kronova-api-client"
