import type { Database } from "./supabase-types"

// Additional type helpers for the application
export type Asset = Database["public"]["Tables"]["assets"]["Row"]
export type AssetInsert = Database["public"]["Tables"]["assets"]["Insert"]
export type AssetUpdate = Database["public"]["Tables"]["assets"]["Update"]

export type AssetIntelligenceInsight = Database["public"]["Tables"]["asset_intelligence_insights"]["Row"]
export type AssetLifecycleEvent = Database["public"]["Tables"]["asset_lifecycle_events"]["Row"]

export type AIAgent = Database["public"]["Tables"]["ai_agents"]["Row"]
export type AIWorkflow = Database["public"]["Tables"]["ai_workflows"]["Row"]
