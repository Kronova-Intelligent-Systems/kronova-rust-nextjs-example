import { ExecutionHistory } from "@/components/dashboard/execution-history"

export default function ExecutionsPage() {
  return (
    <div className="space-y-6 p-[4dvw]">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Execution History</h1>
        <p className="text-muted-foreground">Monitor and review all agent executions and workflow runs</p>
      </div>

      <ExecutionHistory />
    </div>
  )
}
