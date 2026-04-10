import { Suspense } from "react"
import { createServerClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { AssetsPageClient } from "./assets-client"
import type { Database } from "@/lib/database.types"

type Asset = Database["public"]["Tables"]["assets"]["Row"]

async function getAssets(): Promise<Asset[]> {
  const cookieStore = cookies()
  const supabase = createServerClient(cookieStore)

  try {
    const { data: assets, error } = await supabase.from("assets").select("*").order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching assets:", error)
      return []
    }

    return assets || []
  } catch (error) {
    console.error("Failed to fetch assets:", error)
    return []
  }
}

async function getAssetStats(): Promise<{
  total: number
  active: number
  pending: number
  critical: number
}> {
  const cookieStore = cookies()
  const supabase = createServerClient(cookieStore)

  try {
    const { data: assets, error } = await supabase.from("assets").select("status, risk_score")

    if (error || !assets) {
      return { total: 0, active: 0, pending: 0, critical: 0 }
    }

    const stats = {
      total: assets.length,
      active: assets.filter((a) => a.status === "active").length,
      pending: assets.filter((a) => a.status === "pending").length,
      critical: assets.filter((a) => (a.risk_score || 0) > 7).length,
    }

    return stats
  } catch (error) {
    console.error("Failed to fetch asset stats:", error)
    return { total: 0, active: 0, pending: 0, critical: 0 }
  }
}

export default async function AssetsPage() {
  const [assets, stats] = await Promise.all([getAssets(), getAssetStats()])

  return (
    <Suspense fallback={<div>Loading assets...</div>}>
      <AssetsPageClient assets={assets} stats={stats} />
    </Suspense>
  )
}
