"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Users, UserPlus, Crown, Shield, User, Building2, Loader2, MoreVertical, Trash2 } from "lucide-react"
import { CreateOrganizationDialog } from "@/components/dashboard/create-organization-dialog"
import { InviteMemberDialog } from "@/components/dashboard/invite-member-dialog"
import { useToast } from "@/hooks/use-toast"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

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

export default function TeamPage() {
  const [loading, setLoading] = useState(true)
  const [organizations, setOrganizations] = useState<any[]>([])
  const [selectedOrg, setSelectedOrg] = useState<any>(null)
  const [members, setMembers] = useState<any[]>([])
  const [createOrgOpen, setCreateOrgOpen] = useState(false)
  const [inviteMemberOpen, setInviteMemberOpen] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    loadOrganizations()
  }, [])

  useEffect(() => {
    if (selectedOrg) {
      loadMembers()
    }
  }, [selectedOrg])

  const loadOrganizations = async () => {
    try {
      const response = await fetch("/api/organizations")
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to load organizations")
      }

      setOrganizations(data.data || [])
      if (data.data && data.data.length > 0) {
        setSelectedOrg(data.data[0])
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const loadMembers = async () => {
    if (!selectedOrg) return

    try {
      const response = await fetch(`/api/organizations/${selectedOrg.id}/members`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to load members")
      }

      setMembers(data.data || [])
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const handleUpdateRole = async (memberId: string, newRole: string) => {
    try {
      const response = await fetch(`/api/organizations/${selectedOrg.id}/members/${memberId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to update role")
      }

      toast({
        title: "Success",
        description: "Member role updated successfully",
      })

      loadMembers()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm("Are you sure you want to remove this member?")) return

    try {
      const response = await fetch(`/api/organizations/${selectedOrg.id}/members/${memberId}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to remove member")
      }

      toast({
        title: "Success",
        description: "Member removed successfully",
      })

      loadMembers()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "owner":
        return <Crown className="h-3 w-3 mr-1 text-yellow-600" />
      case "admin":
        return <Shield className="h-3 w-3 mr-1 text-blue-600" />
      default:
        return <User className="h-3 w-3 mr-1 text-gray-600" />
    }
  }

  const getRoleCounts = () => {
    const counts = {
      owner: 0,
      admin: 0,
      member: 0,
      viewer: 0,
    }
    members.forEach((m) => {
      if (m.role in counts) {
        counts[m.role as keyof typeof counts]++
      }
    })
    return counts
  }

  const roleCounts = getRoleCounts()

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (organizations.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>No Organizations</CardTitle>
            <CardDescription>Create your first organization to get started</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setCreateOrgOpen(true)} className="w-full gap-2">
              <Building2 className="h-4 w-4" />
              Create Organization
            </Button>
          </CardContent>
        </Card>
        <CreateOrganizationDialog open={createOrgOpen} onOpenChange={setCreateOrgOpen} onSuccess={loadOrganizations} />
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
        <motion.div variants={itemVariants} className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Team Management</h2>
            <p className="text-muted-foreground">Manage team members, roles, and permissions</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setCreateOrgOpen(true)} className="gap-2">
              <Building2 className="h-4 w-4" />
              New Organization
            </Button>
            <Button onClick={() => setInviteMemberOpen(true)} className="gap-2">
              <UserPlus className="h-4 w-4" />
              Invite Member
            </Button>
          </div>
        </motion.div>

        {organizations.length > 1 && (
          <motion.div variants={itemVariants}>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="text-sm font-medium">Organization:</div>
                  <Select
                    value={selectedOrg?.id}
                    onValueChange={(value) => {
                      const org = organizations.find((o) => o.id === value)
                      setSelectedOrg(org)
                    }}
                  >
                    <SelectTrigger className="w-[300px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {organizations.map((org) => (
                        <SelectItem key={org.id} value={org.id}>
                          {org.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        <motion.div variants={itemVariants} className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Members</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{members.length}</div>
              <p className="text-xs text-muted-foreground">Active team members</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Owners</CardTitle>
              <Crown className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{roleCounts.owner}</div>
              <p className="text-xs text-muted-foreground">Full access permissions</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Administrators</CardTitle>
              <Shield className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{roleCounts.admin}</div>
              <p className="text-xs text-muted-foreground">Admin permissions</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Members</CardTitle>
              <User className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{roleCounts.member + roleCounts.viewer}</div>
              <p className="text-xs text-muted-foreground">Standard access</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Tabs defaultValue="members" className="space-y-4">
            <TabsList>
              <TabsTrigger value="members">Members</TabsTrigger>
              <TabsTrigger value="roles">Roles & Permissions</TabsTrigger>
            </TabsList>
            <TabsContent value="members" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Team Members</CardTitle>
                  <CardDescription>Manage your team members and their access levels</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {members.map((member) => (
                      <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-4">
                          <Avatar>
                            <AvatarImage
                              src={member.profiles?.avatar_url || "/placeholder.svg"}
                              alt={member.profiles?.full_name || "User"}
                            />
                            <AvatarFallback>
                              {member.profiles?.full_name
                                ?.split(" ")
                                .map((n: string) => n[0])
                                .join("") || "U"}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{member.profiles?.full_name || "Unknown User"}</p>
                            <p className="text-sm text-muted-foreground">{member.profiles?.email || "No email"}</p>
                            <p className="text-xs text-muted-foreground">
                              Joined {new Date(member.joined_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Select
                            value={member.role}
                            onValueChange={(value) => handleUpdateRole(member.id, value)}
                            disabled={member.role === "owner"}
                          >
                            <SelectTrigger className="w-[140px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="owner">
                                <div className="flex items-center">
                                  {getRoleIcon("owner")}
                                  Owner
                                </div>
                              </SelectItem>
                              <SelectItem value="admin">
                                <div className="flex items-center">
                                  {getRoleIcon("admin")}
                                  Admin
                                </div>
                              </SelectItem>
                              <SelectItem value="member">
                                <div className="flex items-center">
                                  {getRoleIcon("member")}
                                  Member
                                </div>
                              </SelectItem>
                              <SelectItem value="viewer">
                                <div className="flex items-center">
                                  {getRoleIcon("viewer")}
                                  Viewer
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleRemoveMember(member.id)} className="text-red-600">
                                <Trash2 className="h-4 w-4 mr-2" />
                                Remove Member
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="roles" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Roles & Permissions</CardTitle>
                  <CardDescription>Configure role-based access control</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        {getRoleIcon("owner")}
                        <span className="font-medium">Owner</span>
                        <Badge variant="secondary">{roleCounts.owner} members</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        Full system access and user management capabilities
                      </p>
                      <div className="text-xs text-muted-foreground">
                        Permissions: All access, User management, System settings
                      </div>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        {getRoleIcon("admin")}
                        <span className="font-medium">Admin</span>
                        <Badge variant="secondary">{roleCounts.admin} members</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">Team management and reporting capabilities</p>
                      <div className="text-xs text-muted-foreground">
                        Permissions: Team management, Reports, Asset management
                      </div>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        {getRoleIcon("member")}
                        <span className="font-medium">Member</span>
                        <Badge variant="secondary">{roleCounts.member} members</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">Standard access</p>
                      <div className="text-xs text-muted-foreground">Permissions: Basic access</div>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        {getRoleIcon("viewer")}
                        <span className="font-medium">Viewer</span>
                        <Badge variant="secondary">{roleCounts.viewer} members</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">Read-only access</p>
                      <div className="text-xs text-muted-foreground">Permissions: View data</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </motion.div>

      <CreateOrganizationDialog open={createOrgOpen} onOpenChange={setCreateOrgOpen} onSuccess={loadOrganizations} />
      <InviteMemberDialog
        open={inviteMemberOpen}
        onOpenChange={setInviteMemberOpen}
        organizationId={selectedOrg?.id}
        onSuccess={loadMembers}
      />
    </div>
  )
}
