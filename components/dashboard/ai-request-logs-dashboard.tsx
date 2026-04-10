"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/client"
import { Loader2, Activity, TrendingUp, DollarSign, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"

interface AIRequestLog {
  id: string
  user_id: string
  agent_id: string | null
  workflow_id: string | null
  model_id: string | null
  request_type: string
  status: string | null
  created_at: string | null
  completed_at: string | null
  tokens_used: number | null
  cost_usd: number | null
  response_time_ms: number | null
  input_length: number | null
  output_length: number | null
  error_message: string | null
  metadata: any
}

interface DashboardStats {
  totalRequests: number
  successfulRequests: number
  failedRequests: number
  totalTokens: number
  totalCost: number
  avgResponseTime: number
}

export function AIRequestLogsDashboard() {
  const [logs, setLogs] = useState<AIRequestLog[]>([])
  const [stats, setStats] = useState<DashboardStats>({
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    totalTokens: 0,
    totalCost: 0,
    avgResponseTime: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchAIRequestLogs()
  }, [])

  const fetchAIRequestLogs = async () => {
    try {
      setLoading(true)
      const supabase = createClient()

      // Fetch recent logs
      const { data: logsData, error: logsError } = await supabase
        .from("ai_request_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50)

      if (logsError) throw logsError

      // Calculate statistics
      const allLogs = logsData || []
      const successful = allLogs.filter((log) => log.status === "completed")
      const failed = allLogs.filter((log) => log.status === "failed" || log.status === "error")
      const totalTokens = allLogs.reduce((sum, log) => sum + (log.tokens_used || 0), 0)
      const totalCost = allLogs.reduce((sum, log) => sum + (log.cost_usd || 0), 0)
      const responseTimes = allLogs.filter((log) => log.response_time_ms).map((log) => log.response_time_ms!)
      const avgResponseTime = responseTimes.length > 0 
        ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length 
        : 0

      setStats({
        totalRequests: allLogs.length,
        successfulRequests: successful.length,
        failedRequests: failed.length,
        totalTokens,
        totalCost,
        avgResponseTime,
      })

      setLogs(allLogs)
    } catch (err) {
      console.error("[v0] Error fetching AI request logs:", err)
      setError(err instanceof Error ? err.message : "Failed to load data")
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "completed":
        return (
          <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
            <CheckCircle className="h-3 w-3 mr-1" />
            Completed
          </Badge>
        )
      case "failed":
      case "error":
        return (
          <Badge className="bg-red-500/10 text-red-500 border-red-500/20">
            <XCircle className="h-3 w-3 mr-1" />
            Failed
          </Badge>
        )
      case "running":
      case "pending":
        return (
          <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
            <AlertCircle className="h-3 w-3 mr-1" />
            {status}
          </Badge>
        )
      default:
        return <Badge variant="outline">{status || "Unknown"}</Badge>
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleString()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <Card className="glass-card">
        <CardContent className="pt-6">
          <div className="text-center text-destructive">
            <AlertCircle className="h-12 w-12 mx-auto mb-4" />
            <p>Error loading AI request logs: {error}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRequests}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.successfulRequests} successful
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalRequests > 0 
                ? ((stats.successfulRequests / stats.totalRequests) * 100).toFixed(1) 
                : 0}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.failedRequests} failed
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalCost.toFixed(4)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.totalTokens.toLocaleString()} tokens
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgResponseTime.toFixed(0)}ms</div>
            <p className="text-xs text-muted-foreground mt-1">Average latency</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Requests Table */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Recent AI Requests</CardTitle>
          <CardDescription>Latest 50 AI agent and workflow executions</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px]">
            <div className="space-y-4">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="flex flex-col space-y-2 p-4 rounded-lg glass-subtle hover:glass-card transition-all border border-border/50"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium truncate">
                          {log.request_type}
                        </span>
                        {getStatusBadge(log.status)}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        ID: {log.id.slice(0, 8)}...
                      </p>
                    </div>
                    <div className="text-right text-xs text-muted-foreground">
                      {formatDate(log.created_at)}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                    {log.tokens_used && (
                      <div>
                        <span className="text-muted-foreground">Tokens:</span>
                        <span className="ml-1 font-medium">{log.tokens_used.toLocaleString()}</span>
                      </div>
                    )}
                    {log.cost_usd && (
                      <div>
                        <span className="text-muted-foreground">Cost:</span>
                        <span className="ml-1 font-medium">${log.cost_usd.toFixed(4)}</span>
                      </div>
                    )}
                    {log.response_time_ms && (
                      <div>
                        <span className="text-muted-foreground">Time:</span>
                        <span className="ml-1 font-medium">{log.response_time_ms}ms</span>
                      </div>
                    )}
                    {log.model_id && (
                      <div>
                        <span className="text-muted-foreground">Model:</span>
                        <span className="ml-1 font-medium truncate">{log.model_id.slice(0, 20)}</span>
                      </div>
                    )}
                  </div>

                  {log.error_message && (
                    <div className="text-xs text-destructive bg-destructive/10 p-2 rounded">
                      {log.error_message}
                    </div>
                  )}
                </div>
              ))}

              {logs.length === 0 && (
                <div className="text-center text-muted-foreground py-8">
                  <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No AI requests found</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}
