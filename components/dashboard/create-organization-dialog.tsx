"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Building2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"

interface CreateOrganizationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function CreateOrganizationDialog({ open, onOpenChange, onSuccess }: CreateOrganizationDialogProps) {
  const [loading, setLoading] = useState(false)
  const [userProfile, setUserProfile] = useState<{ company: string | null } | null>(null)
  const [slugError, setSlugError] = useState<string | null>(null)
  const [checkingSlug, setCheckingSlug] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    company_size: "",
    industry: "",
    website_url: "",
  })
  const { toast } = useToast()

  useEffect(() => {
    const fetchUserProfile = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        const { data: profile, error } = await supabase.from("profiles").select("company").eq("id", user.id).single()

        if (error) {
          console.error("[v0] Error fetching profile:", error)
        }

        if (profile) {
          setUserProfile(profile)
        }
      }
    }

    if (open) {
      fetchUserProfile()
    }
  }, [open])

  const handleImportCompanyName = () => {
    if (userProfile?.company) {
      setFormData({
        ...formData,
        name: userProfile.company,
        slug: generateSlug(userProfile.company),
      })
      toast({
        title: "Imported",
        description: "Company name imported from your profile",
      })
    } else {
      toast({
        title: "No company name",
        description: "Please add a company name to your profile first",
        variant: "destructive",
      })
    }
  }

  const checkSlugAvailability = async (slug: string) => {
    if (!slug || slug.length < 3) {
      setSlugError(null)
      return
    }

    setCheckingSlug(true)
    setSlugError(null)

    try {
      const response = await fetch(`/api/organizations/check-slug?slug=${encodeURIComponent(slug)}`)
      const data = await response.json()

      if (!data.available) {
        setSlugError("This URL is already taken")
      }
    } catch (error) {
      console.error("[v0] Error checking slug:", error)
    } finally {
      setCheckingSlug(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (slugError) {
      toast({
        title: "Invalid URL",
        description: "Please choose a different organization URL",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      const response = await fetch("/api/organizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to create organization")
      }

      toast({
        title: "Success",
        description: "Organization created successfully",
      })

      onSuccess()
      onOpenChange(false)
      setFormData({
        name: "",
        slug: "",
        description: "",
        company_size: "",
        industry: "",
        website_url: "",
      })
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

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create Organization</DialogTitle>
          <DialogDescription>Create a new organization to manage your team and assets</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="name">Organization Name *</Label>
              {userProfile?.company && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleImportCompanyName}
                  className="h-auto py-1 px-2 text-xs"
                >
                  <Building2 className="mr-1 h-3 w-3" />
                  Import from Profile
                </Button>
              )}
            </div>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => {
                setFormData({
                  ...formData,
                  name: e.target.value,
                  slug: generateSlug(e.target.value),
                })
              }}
              placeholder="Acme Corporation"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">URL Slug *</Label>
            <Input
              id="slug"
              value={formData.slug}
              onChange={(e) => {
                const newSlug = e.target.value
                setFormData({ ...formData, slug: newSlug })
                if (newSlug.length >= 3) {
                  checkSlugAvailability(newSlug)
                } else {
                  setSlugError(null)
                }
              }}
              placeholder="acme-corporation"
              required
              className={slugError ? "border-destructive" : ""}
            />
            {checkingSlug && <p className="text-xs text-muted-foreground">Checking availability...</p>}
            {slugError && <p className="text-xs text-destructive">{slugError}</p>}
            {!slugError && !checkingSlug && formData.slug.length >= 3 && (
              <p className="text-xs text-green-600">This URL is available</p>
            )}
            <p className="text-xs text-muted-foreground">Used in URLs and must be unique</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description of your organization"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="company_size">Company Size</Label>
              <Select
                value={formData.company_size}
                onValueChange={(value) => setFormData({ ...formData, company_size: value })}
              >
                <SelectTrigger id="company_size">
                  <SelectValue placeholder="Select size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1-10">1-10 employees</SelectItem>
                  <SelectItem value="11-50">11-50 employees</SelectItem>
                  <SelectItem value="51-200">51-200 employees</SelectItem>
                  <SelectItem value="201-500">201-500 employees</SelectItem>
                  <SelectItem value="501+">501+ employees</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="industry">Industry</Label>
              <Input
                id="industry"
                value={formData.industry}
                onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                placeholder="Technology"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="website_url">Website URL</Label>
            <Input
              id="website_url"
              type="url"
              value={formData.website_url}
              onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
              placeholder="https://example.com"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Organization
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
