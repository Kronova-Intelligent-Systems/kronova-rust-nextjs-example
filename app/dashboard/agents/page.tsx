import { createClient } from "@/lib/supabase/server"
import { AgentsPageClient } from "@/components/dashboard/agents-page-client"

export default async function AgentsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: agents } = await supabase
    .from("ai_agents")
    .select("*, ai_models(*)")
    .eq("user_id", user?.id || "")
    .order("created_at", { ascending: false })

  const agentStats = {
    total: agents?.length || 0,
    active: agents?.filter((a) => a.is_active).length || 0,
    training: 0,
    inactive: agents?.filter((a) => !a.is_active).length || 0,
    avgPerformance: 0,
  }

  return <AgentsPageClient agents={agents || []} agentStats={agentStats} userId={user?.id || ""} />
}
