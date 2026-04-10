"use client"

import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Activity, Zap, Clock, TrendingUp, AlertCircle, CheckCircle } from "lucide-react"
import { RealTimeMonitoring } from "@/components/dashboard/real-time-monitoring"

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
}

export default function PerformancePage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
        <motion.div variants={itemVariants}>
          <h2 className="text-3xl font-bold tracking-tight">Performance Monitoring</h2>
          <p className="text-muted-foreground">Real-time system performance and optimization insights</p>
        </motion.div>

        <motion.div variants={itemVariants} className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">System Uptime</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">99.97%</div>
              <p className="text-xs text-muted-foreground">Last 30 days</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Response Time</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">142ms</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">-23ms</span> improvement
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Throughput</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2.4K/s</div>
              <p className="text-xs text-muted-foreground">Requests per second</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0.03%</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">-0.01%</span> from yesterday
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Tabs defaultValue="realtime" className="space-y-4">
            <TabsList>
              <TabsTrigger value="realtime">Real-time</TabsTrigger>
              <TabsTrigger value="historical">Historical</TabsTrigger>
              <TabsTrigger value="alerts">Alerts</TabsTrigger>
              <TabsTrigger value="optimization">Optimization</TabsTrigger>
            </TabsList>
            <TabsContent value="realtime">
              <RealTimeMonitoring />
            </TabsContent>
            <TabsContent value="historical" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Performance History</CardTitle>
                  <CardDescription>Historical performance metrics and trends</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                    <TrendingUp className="h-12 w-12 mb-4" />
                    <div className="text-center">
                      <p>Historical performance charts</p>
                      <p className="text-sm">Time series analysis and trends</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="alerts" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Performance Alerts</CardTitle>
                  <CardDescription>Active alerts and notifications</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-3 border rounded-lg">
                      <AlertCircle className="h-4 w-4 text-yellow-600" />
                      <div className="flex-1">
                        <p className="font-medium">High Memory Usage</p>
                        <p className="text-sm text-muted-foreground">Server memory at 87%</p>
                      </div>
                      <span className="text-xs text-muted-foreground">2 min ago</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 border rounded-lg">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <div className="flex-1">
                        <p className="font-medium">Response Time Improved</p>
                        <p className="text-sm text-muted-foreground">Average response time decreased</p>
                      </div>
                      <span className="text-xs text-muted-foreground">15 min ago</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="optimization" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Performance Optimization</CardTitle>
                  <CardDescription>AI-powered optimization recommendations</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Zap className="h-4 w-4 text-blue-600" />
                        <span className="font-medium">Cache Optimization</span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        Implementing Redis caching could improve response times by 40%
                      </p>
                      <div className="text-xs text-green-600">Potential savings: $2,400/month</div>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="h-4 w-4 text-purple-600" />
                        <span className="font-medium">Database Query Optimization</span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        Optimize slow queries identified in performance analysis
                      </p>
                      <div className="text-xs text-green-600">Estimated improvement: 25% faster queries</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </motion.div>
    </div>
  )
}
