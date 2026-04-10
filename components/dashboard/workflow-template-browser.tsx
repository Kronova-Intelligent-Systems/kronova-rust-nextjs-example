"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, Workflow, Clock, Zap, TrendingUp, Shield, BarChart3, Rocket, Star } from "lucide-react"
import { apiClient } from "@/lib/api-client"
import { DeployWorkflowDialog } from "./deploy-workflow-dialog"

type WorkflowTemplate = {
  id: string
  template_id: string
  name: string
  description: string
  category: string
  difficulty: string | null
  estimated_time: number | null
  icon: string | null
  is_featured: boolean | null
  tags: string[] | null
  steps: any
  trigger_type: string | null
  trigger_config: any
  prerequisites: string[] | null
  expected_outcomes: string[] | null
}

const categoryIcons: Record<string, any> = {
  automation: Zap,
  analytics: BarChart3,
  security: Shield,
  optimization: TrendingUp,
  monitoring: Clock,
  deployment: Rocket,
}

const difficultyColors: Record<string, string> = {
  beginner: "bg-green-500/10 text-green-500 border-green-500/20",
  intermediate: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  advanced: "bg-red-500/10 text-red-500 border-red-500/20",
}

export function WorkflowTemplateBrowser() {
  const [templates, setTemplates] = useState<WorkflowTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("all")

  useEffect(() => {
    loadTemplates()
  }, [selectedCategory, selectedDifficulty])

  const loadTemplates = async () => {
    try {
      setLoading(true)
      const params: any = {}

      if (selectedCategory !== "all") {
        params.category = selectedCategory
      }

      if (selectedDifficulty !== "all") {
        params.difficulty = selectedDifficulty
      }

      const result = await apiClient.getSystemWorkflowTemplates(params)
      setTemplates(result.data || [])
    } catch (error) {
      console.error("[v0] Error loading workflow templates:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredTemplates = templates.filter(
    (template) =>
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.tags?.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase())),
  )

  const categories = Array.from(new Set(templates.map((t) => t.category)))
  const difficulties = ["beginner", "intermediate", "advanced"]

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search workflow templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 rounded-md border bg-background text-sm"
          >
            <option value="all">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </option>
            ))}
          </select>
          <select
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
            className="px-4 py-2 rounded-md border bg-background text-sm"
          >
            <option value="all">All Levels</option>
            {difficulties.map((diff) => (
              <option key={diff} value={diff}>
                {diff.charAt(0).toUpperCase() + diff.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Templates Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-muted rounded w-3/4 mb-2" />
                <div className="h-4 bg-muted rounded w-full" />
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
            <Workflow className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No workflow templates found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template, index) => {
            const CategoryIcon = categoryIcons[template.category] || Workflow

            return (
              <motion.div
                key={template.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="h-full flex flex-col hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <CategoryIcon className="h-5 w-5 text-primary" />
                        </div>
                        {template.is_featured && <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />}
                      </div>
                      {template.difficulty && (
                        <Badge variant="outline" className={difficultyColors[template.difficulty]}>
                          {template.difficulty}
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    <CardDescription className="line-clamp-2">{template.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col justify-between">
                    <div className="space-y-4">
                      {/* Tags */}
                      {template.tags && template.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {template.tags.slice(0, 3).map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {template.tags.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{template.tags.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}

                      {/* Metadata */}
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        {template.estimated_time && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>{template.estimated_time} min</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Workflow className="h-3 w-3" />
                          <span>
                            {Array.isArray(template.steps)
                              ? template.steps.length
                              : Object.keys(template.steps || {}).length}{" "}
                            steps
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Deploy Button */}
                    <DeployWorkflowDialog template={template} onDeploy={loadTemplates} />
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
