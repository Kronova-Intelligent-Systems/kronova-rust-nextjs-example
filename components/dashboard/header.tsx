"use client"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Bell, Search, LogOut, Moon, Sun } from "lucide-react"
import { signOut } from "@/app/actions/auth"
import type { User as SupabaseUser } from "@supabase/supabase-js"
import { useTheme } from "next-themes"

interface DashboardHeaderProps {
  user: SupabaseUser
}

export function DashboardHeader({ user }: DashboardHeaderProps) {
  const { theme, setTheme } = useTheme()

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error("[v0] Sign out failed:", error)
    }
  }

  const getInitials = (email: string) => {
    return email
      .split("@")[0]
      .split(".")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  return (
    <header className="h-16 bg-card/80 backdrop-blur-lg border-b border-border/50 flex items-center justify-between px-4 lg:px-6 relative z-40">
      <div className="flex items-center space-x-2 lg:space-x-6 flex-1 min-w-0">
        {/* Logo - hidden on mobile when sidebar button is present */}
        <div className="hidden lg:flex items-center space-x-2 flex-shrink-0">
          <img src="/kronova-logo-header.svg" alt="Kronova" className="h-8 w-auto" />
        </div>

        {/* Search - responsive width with glass effect */}
        <div className="relative flex-1 max-w-md lg:max-w-lg ml-12 lg:ml-0">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <input
            type="text"
            placeholder="Search assets, agents, workflows..."
            className="pl-10 pr-4 py-2 w-full bg-input/50 backdrop-blur-sm border border-border/50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-primary/50 transition-all"
          />
        </div>
      </div>

      <div className="flex items-center space-x-2 lg:space-x-4 flex-shrink-0">
        {/* Dark Mode Toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="hover:bg-primary/10 relative group transition-all duration-300"
          title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>

        <Button variant="ghost" size="icon" className="relative hover:bg-primary/10">
          <Bell className="h-4 w-4" />
          <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs gradient-kronova text-white border-0">
            3
          </Badge>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="relative h-8 w-8 rounded-full ring-2 ring-primary/20 hover:ring-primary/40 transition-all"
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src={user.user_metadata?.avatar_url || "/placeholder.svg"} alt={user.email} />
                <AvatarFallback className="gradient-kronova text-white text-xs">
                  {getInitials(user.email || "")}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 glass-card" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none truncate">{user.user_metadata?.full_name || "User"}</p>
                <p className="text-xs leading-none text-muted-foreground truncate">{user.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
