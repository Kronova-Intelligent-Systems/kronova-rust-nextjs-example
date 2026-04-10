"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { useRSPCQuery, useRSPCMutation } from "@/lib/rspc/hooks"
import { Loader2, Plus, QrCode, Share, Eye } from "lucide-react"

export function BusinessCards() {
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newCard, setNewCard] = useState({
    name: "",
    title: "",
    company: "",
    email: "",
    phone: "",
    website: "",
    nftEnabled: false,
  })

  const { data: cards, isLoading, refetch } = useRSPCQuery(["businessCards.list", {}])

  const createCardMutation = useRSPCMutation("businessCards.create", {
    onSuccess: () => {
      refetch()
      setShowCreateForm(false)
      setNewCard({
        name: "",
        title: "",
        company: "",
        email: "",
        phone: "",
        website: "",
        nftEnabled: false,
      })
    },
  })

  const handleCreateCard = () => {
    createCardMutation.mutate({
      name: newCard.name,
      title: newCard.title || null,
      company: newCard.company || null,
      email: newCard.email || null,
      phone: newCard.phone || null,
      website: newCard.website || null,
      nft_enabled: newCard.nftEnabled,
    })
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading business cards...</span>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Digital Business Cards</CardTitle>
          <CardDescription>Create and manage digital business cards with NFT tokenization</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-end mb-6">
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Card
            </Button>
          </div>

          {showCreateForm && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Create New Business Card</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="card-name">Full Name</Label>
                    <Input
                      id="card-name"
                      value={newCard.name}
                      onChange={(e) => setNewCard({ ...newCard, name: e.target.value })}
                      placeholder="Enter your full name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="card-title">Job Title</Label>
                    <Input
                      id="card-title"
                      value={newCard.title}
                      onChange={(e) => setNewCard({ ...newCard, title: e.target.value })}
                      placeholder="e.g., CEO, Developer, Manager"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="card-company">Company</Label>
                    <Input
                      id="card-company"
                      value={newCard.company}
                      onChange={(e) => setNewCard({ ...newCard, company: e.target.value })}
                      placeholder="Company name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="card-email">Email</Label>
                    <Input
                      id="card-email"
                      type="email"
                      value={newCard.email}
                      onChange={(e) => setNewCard({ ...newCard, email: e.target.value })}
                      placeholder="your@email.com"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="card-phone">Phone</Label>
                    <Input
                      id="card-phone"
                      value={newCard.phone}
                      onChange={(e) => setNewCard({ ...newCard, phone: e.target.value })}
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                  <div>
                    <Label htmlFor="card-website">Website</Label>
                    <Input
                      id="card-website"
                      value={newCard.website}
                      onChange={(e) => setNewCard({ ...newCard, website: e.target.value })}
                      placeholder="https://yourwebsite.com"
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="nft-enabled"
                    checked={newCard.nftEnabled}
                    onCheckedChange={(checked) => setNewCard({ ...newCard, nftEnabled: checked })}
                  />
                  <Label htmlFor="nft-enabled">Create as NFT</Label>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleCreateCard} disabled={createCardMutation.isLoading || !newCard.name}>
                    {createCardMutation.isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Create Card
                  </Button>
                  <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-4">
            {cards?.data?.map((card: any) => (
              <Card key={card.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">{card.name}</h3>
                        {card.title && <Badge variant="secondary">{card.title}</Badge>}
                        {card.nft_token_id && <Badge variant="outline">NFT</Badge>}
                      </div>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        {card.company && <p>🏢 {card.company}</p>}
                        {card.email && <p>📧 {card.email}</p>}
                        {card.phone && <p>📱 {card.phone}</p>}
                        {card.website && <p>🌐 {card.website}</p>}
                      </div>
                      <div className="flex gap-4 text-sm text-muted-foreground mt-2">
                        <span>👁️ {card.view_count || 0} views</span>
                        <span>📅 {new Date(card.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <QrCode className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Share className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {cards?.data?.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No business cards found. Create your first card to get started.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
