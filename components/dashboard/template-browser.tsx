"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Brain, Search, Star, Zap, Shield, TrendingUp, Clock, Sparkles, Rocket, CheckCircle } from "lucide-react"
import { apiClient } from "@/lib/api-client"
import { useRouter } from "next/navigation"
import { DeployAgentDialog } from "./deploy-agent-dialog"

interface Template {
  id: string
  name: string
  description: string
  category: string
  icon: string
  is_featured: boolean
  difficulty: string | null
  estimated_setup_time: number | null
  tags: string[] | null
  use_cases: string[] | null
  system_prompt: string
  tools: any
  parameters: any
  template_id: string
}

export function TemplateBrowser({ userId }: { userId: string }) {
  const [templates, setTemplates] = useState<Template[]>([])
  const [filteredTemplates, setFilteredTemplates] = useState<Template[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [loading, setLoading] = useState(true)
  const [deployingId, setDeployingId] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    loadTemplates()
  }, [])

  useEffect(() => {
    filterTemplates()
  }, [searchQuery, selectedCategory, templates])

  const loadTemplates = async () => {
    try {
      const result = await apiClient.getSystemAgentTemplates()
      setTemplates(result.data || [])
    } catch (error) {
      console.error("Failed to load templates:", error)
    } finally {
      setLoading(false)
    }
  }

  const filterTemplates = () => {
    let filtered = templates

    if (selectedCategory !== "all") {
      filtered = filtered.filter((t) => t.category === selectedCategory)
    }

    if (searchQuery) {
      filtered = filtered.filter(
        (t) =>
          t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.tags?.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase())),
      )
    }

    setFilteredTemplates(filtered)
  }

  const categories = ["all", ...new Set(templates.map((t) => t.category))]
  const featuredTemplates = templates.filter((t) => t.is_featured)

  const getIconComponent = (iconName: string) => {
    const icons: Record<string, any> = {
      brain: Brain,
      shield: Shield,
      trending: TrendingUp,
      zap: Zap,
      sparkles: Sparkles,
    }
    return icons[iconName.toLowerCase()] || Brain
  }

  const getDifficultyColor = (difficulty: string | null) => {
    switch (difficulty?.toLowerCase()) {
      case "beginner":
        return "bg-green-500/10 text-green-500"
      case "intermediate":
        return "bg-yellow-500/10 text-yellow-500"
      case "advanced":
        return "bg-red-500/10 text-red-500"
      default:
        return "bg-blue-500/10 text-blue-500"
    }
  }

  return (
    <div className="space-y-6">
      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full sm:w-auto">
          <TabsList className="grid grid-cols-3 sm:grid-cols-auto sm:w-auto">
            {categories.slice(0, 4).map((category) => (
              <TabsTrigger key={category} value={category} className="capitalize">
                {category}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Featured Templates */}
      {selectedCategory === "all" && featuredTemplates.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
            <h2 className="text-xl font-semibold">Featured Templates</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {featuredTemplates.map((template, index) => (
              <TemplateCard
                key={template.id}
                template={template}
                index={index}
                userId={userId}
                deployingId={deployingId}
                setDeployingId={setDeployingId}
                getIconComponent={getIconComponent}
                getDifficultyColor={getDifficultyColor}
                router={router}
              />
            ))}
          </div>
        </div>
      )}

      {/* All Templates */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">
          {selectedCategory === "all" ? "All Templates" : `${selectedCategory} Templates`}
        </h2>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-muted rounded w-3/4" />
                  <div className="h-4 bg-muted rounded w-full mt-2" />
                </CardHeader>
                <CardContent>
                  <div className="h-20 bg-muted rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredTemplates.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Brain className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No templates found matching your criteria</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTemplates.map((template, index) => (
              <TemplateCard
                key={template.id}
                template={template}
                index={index}
                userId={userId}
                deployingId={deployingId}
                setDeployingId={setDeployingId}
                getIconComponent={getIconComponent}
                getDifficultyColor={getDifficultyColor}
                router={router}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function TemplateCard({
  template,
  index,
  userId,
  deployingId,
  setDeployingId,
  getIconComponent,
  getDifficultyColor,
  router,
}: {
  template: Template
  index: number
  userId: string
  deployingId: string | null
  setDeployingId: (id: string | null) => void
  getIconComponent: (icon: string) => any
  getDifficultyColor: (difficulty: string | null) => string
  router: any
}) {
  const [showDeployDialog, setShowDeployDialog] = useState(false)

  const IconComponent = getIconComponent(template.icon)

  const handleDeploySuccess = () => {
    router.refresh()
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <Card className="h-full hover:shadow-lg transition-shadow">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <IconComponent className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">{template.name}</CardTitle>
                <Badge variant="outline" className="mt-1">
                  {template.category}
                </Badge>
              </div>
            </div>
            {template.is_featured && <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />}
          </div>
          <CardDescription className="line-clamp-2 mt-2">{template.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Metadata */}
          <div className="flex flex-wrap gap-2">
            {template.difficulty && (
              <Badge variant="secondary" className={getDifficultyColor(template.difficulty)}>
                {template.difficulty}
              </Badge>
            )}
            {template.estimated_setup_time && (
              <Badge variant="outline" className="gap-1">
                <Clock className="h-3 w-3" />
                {template.estimated_setup_time}m
              </Badge>
            )}
          </div>

          {/* Tags */}
          {template.tags && template.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {template.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Use Cases */}
          {template.use_cases && template.use_cases.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Use Cases:</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                {template.use_cases.slice(0, 2).map((useCase, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle className="h-3 w-3 mt-0.5 text-green-500 flex-shrink-0" />
                    <span className="line-clamp-1">{useCase}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Deploy Button */}
          <Button className="w-full" onClick={() => setShowDeployDialog(true)} disabled={deployingId === template.id}>
            {deployingId === template.id ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Deploying...
              </>
            ) : (
              <>
                <Rocket className="mr-2 h-4 w-4" />
                Deploy Agent
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* DeployAgentDialog Component */}
      <DeployAgentDialog
        template={template}
        open={showDeployDialog}
        onOpenChange={setShowDeployDialog}
        onSuccess={handleDeploySuccess}
      />
    </motion.div>
  )
}
