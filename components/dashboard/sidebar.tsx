"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import {
  BarChart3,
  Settings,
  Users,
  Database,
  Workflow,
  Shield,
  Activity,
  TrendingUp,
  Zap,
  Menu,
  Upload,
  Moon,
  Sun,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { useTheme } from "next-themes"

const sidebarItems = [
  {
    title: "Overview",
    href: "/dashboard",
    icon: BarChart3,
  },
  {
    title: "Assets",
    href: "/dashboard/assets",
    icon: Database,
  },
  {
    title: "Asset Gateway",
    href: "/dashboard/asset-gateway",
    icon: Upload,
  },
  {
    title: "AI Agents",
    href: "/dashboard/agents",
    icon: Zap,
  },
  {
    title: "Workflows",
    href: "/dashboard/workflows",
    icon: Workflow,
  },
  {
    title: "Analytics",
    href: "/dashboard/analytics",
    icon: TrendingUp,
  },
  {
    title: "Performance",
    href: "/dashboard/performance",
    icon: Activity,
  },
  {
    title: "Security",
    href: "/dashboard/security",
    icon: Shield,
  },
  {
    title: "Team",
    href: "/dashboard/team",
    icon: Users,
  },
  {
    title: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
  },
]

function SidebarContent() {
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 lg:p-6">
        <Link href="/dashboard" className="flex items-center space-x-2 group">
          <img
            src="/kronova-logo-header.svg"
            alt="Kronova"
            className="h-8 lg:h-10 w-auto transition-transform group-hover:scale-105"
          />
        </Link>
      </div>

      <ScrollArea className="flex-1 px-2 lg:px-3">
        <div className="space-y-1">
          {sidebarItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={isActive ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start text-sidebar-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent text-sm lg:text-base transition-all duration-200",
                    isActive && "bg-sidebar-accent text-sidebar-accent-foreground glow-kronova/20",
                  )}
                >
                  <item.icon
                    className={cn("mr-2 lg:mr-3 h-4 w-4 flex-shrink-0 transition-colors", isActive && "text-primary")}
                  />
                  <span className="truncate">{item.title}</span>
                </Button>
              </Link>
            )
          })}
        </div>
      </ScrollArea>

      <div className="p-4 border-t border-sidebar-border space-y-3">
        <Button
          variant="outline"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="w-full justify-start text-sm glass-subtle hover:glass-card transition-all duration-300"
        >
          <Sun className="mr-2 h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute left-8 h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="ml-1">{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
        </Button>
        <p className="text-xs text-muted-foreground text-center">
          Powered by <span className="text-gradient-kronova font-semibold">Kronova</span>
        </p>
      </div>
    </div>
  )
}

export function DashboardSidebar() {
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* Mobile Sidebar */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="lg:hidden fixed top-4 left-4 z-50 glass-card">
            <Menu className="h-4 w-4" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-64 glass">
          <SidebarContent />
        </SheetContent>
      </Sheet>

      {/* Desktop Sidebar */}
      <div className="hidden lg:flex w-64 xl:w-72 bg-sidebar border-r border-sidebar-border flex-shrink-0">
        <SidebarContent />
      </div>
    </>
  )
}
