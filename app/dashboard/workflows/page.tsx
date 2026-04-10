import { createClient } from "@/lib/supabase/server"
import { WorkflowsPageClient } from "./workflows-client"

export default async function WorkflowsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: workflows } = await supabase
    .from("ai_workflows")
    .select("*")
    .eq("user_id", user?.id || "")
    .order("created_at", { ascending: false })

  return <WorkflowsPageClient initialWorkflows={workflows || []} />
}
