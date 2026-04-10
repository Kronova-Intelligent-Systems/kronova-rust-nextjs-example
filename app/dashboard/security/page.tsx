"use client"

import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Shield, AlertTriangle, CheckCircle, Lock, Eye, UserCheck } from "lucide-react"

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

export default function SecurityPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
        <motion.div variants={itemVariants}>
          <h2 className="text-3xl font-bold tracking-tight">Security Center</h2>
          <p className="text-muted-foreground">Comprehensive security monitoring and threat protection</p>
        </motion.div>

        <motion.div variants={itemVariants} className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Security Score</CardTitle>
              <Shield className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">94/100</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">Excellent</span> security posture
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Threats</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3</div>
              <p className="text-xs text-muted-foreground">Require immediate attention</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Vulnerabilities</CardTitle>
              <Eye className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-yellow-600">Medium</span> priority fixes
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Compliance</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">98%</div>
              <p className="text-xs text-muted-foreground">SOC 2, GDPR compliant</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="threats">Threats</TabsTrigger>
              <TabsTrigger value="access">Access Control</TabsTrigger>
              <TabsTrigger value="compliance">Compliance</TabsTrigger>
            </TabsList>
            <TabsContent value="overview" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Security Events</CardTitle>
                    <CardDescription>Recent security activities</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">Successful login</p>
                          <p className="text-xs text-muted-foreground">user@example.com - 2 min ago</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <AlertTriangle className="h-4 w-4 text-yellow-600" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">Failed login attempt</p>
                          <p className="text-xs text-muted-foreground">unknown@domain.com - 15 min ago</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Shield className="h-4 w-4 text-blue-600" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">Security scan completed</p>
                          <p className="text-xs text-muted-foreground">No issues found - 1 hour ago</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Risk Assessment</CardTitle>
                    <CardDescription>Current security risks</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Password Policy</span>
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          Low Risk
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Data Encryption</span>
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          Low Risk
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Network Security</span>
                        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                          Medium Risk
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Access Controls</span>
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          Low Risk
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            <TabsContent value="threats" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Threat Detection</CardTitle>
                  <CardDescription>Active monitoring and threat intelligence</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 border rounded-lg border-red-200 bg-red-50">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                        <span className="font-medium text-red-800">High Priority Threat</span>
                      </div>
                      <p className="text-sm text-red-700">Suspicious login attempts from multiple IP addresses</p>
                    </div>
                    <div className="p-4 border rounded-lg border-yellow-200 bg-yellow-50">
                      <div className="flex items-center gap-2 mb-2">
                        <Eye className="h-4 w-4 text-yellow-600" />
                        <span className="font-medium text-yellow-800">Medium Priority</span>
                      </div>
                      <p className="text-sm text-yellow-700">Outdated security certificates detected</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="access" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Access Control Management</CardTitle>
                  <CardDescription>User permissions and access policies</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <UserCheck className="h-4 w-4 text-green-600" />
                        <div>
                          <p className="font-medium">Multi-Factor Authentication</p>
                          <p className="text-sm text-muted-foreground">Enabled for all users</p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        Active
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Lock className="h-4 w-4 text-blue-600" />
                        <div>
                          <p className="font-medium">Role-Based Access Control</p>
                          <p className="text-sm text-muted-foreground">Granular permissions system</p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                        Configured
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="compliance" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Compliance Status</CardTitle>
                  <CardDescription>Regulatory compliance and certifications</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">SOC 2 Type II</span>
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          Compliant
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">Valid until Dec 2024</p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">GDPR</span>
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          Compliant
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">Data protection compliant</p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">ISO 27001</span>
                        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                          In Progress
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">Certification pending</p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">HIPAA</span>
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          Compliant
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">Healthcare data protected</p>
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
