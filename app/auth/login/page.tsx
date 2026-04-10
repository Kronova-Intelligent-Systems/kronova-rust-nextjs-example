"use client"

import type React from "react"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Brain, Shield, BarChart3, Sparkles } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setError(error.message)
      } else {
        router.push("/dashboard")
      }
    } catch (err) {
      console.error("[v0] Login error:", err)
      if (err instanceof TypeError && err.message.includes("fetch")) {
        setError("Unable to connect to authentication service. Please try again later.")
      } else {
        setError("An unexpected error occurred. Please try again.")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background neural-grid flex items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient glow effects */}
      <div
        className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl animate-pulse-slow"
        style={{ backgroundColor: "rgba(0, 71, 171, 0.2)" }}
      />
      <div
        className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full blur-3xl animate-pulse-slow"
        style={{ backgroundColor: "rgba(0, 206, 209, 0.2)", animationDelay: "1s" }}
      />

      <div className="w-full max-w-md space-y-8 relative z-10">
        <div className="text-center space-y-4">
          <div className="flex justify-center items-center">
            <img src="/kronova-logo-header.svg" alt="Kronova" className="h-10 w-auto" />
          </div>
          <p className="text-lg text-muted-foreground font-medium">Intelligent Asset Systems</p>
          <div className="flex flex-wrap justify-center gap-2 text-xs max-w-sm mx-auto">
            <div className="flex items-center gap-1.5 bg-black/40 dark:bg-white/5 px-3 py-1 rounded-full border border-white/10 hover:border-primary/30 transition-all backdrop-blur-sm">
              <Shield className="h-3.5 w-3.5 text-primary dark:text-kronova-cyan" />
              <span className="font-medium text-foreground/90">Secure</span>
            </div>
            <div className="flex items-center gap-1.5 bg-black/40 dark:bg-white/5 px-3 py-1 rounded-full border border-white/10 hover:border-primary/30 transition-all backdrop-blur-sm">
              <BarChart3 className="h-3.5 w-3.5 text-primary dark:text-kronova-cyan" />
              <span className="font-medium text-foreground/90">Analytics</span>
            </div>
            <div className="flex items-center gap-1.5 bg-black/40 dark:bg-white/5 px-3 py-1 rounded-full border border-white/10 hover:border-primary/30 transition-all backdrop-blur-sm">
              <Brain className="h-3.5 w-3.5 text-primary dark:text-kronova-cyan" />
              <span className="font-medium text-foreground/90">AI-Powered</span>
            </div>
          </div>
        </div>

        <Card className="bg-black/50 dark:bg-white/5 border-white/10 backdrop-blur-md shadow-2xl">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Welcome Back</CardTitle>
            <CardDescription className="text-center">Access your Kronova dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-input/50 backdrop-blur-sm border-border/50 focus:border-primary/50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-input/50 backdrop-blur-sm border-border/50 focus:border-primary/50"
                />
              </div>

              {error && (
                <Alert variant="destructive" className="glass-subtle border-destructive/50">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                className="w-full gradient-kronova hover:opacity-90 transition-opacity text-white border-0"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Sign In
                  </>
                )}
              </Button>
            </form>

            <div className="mt-4 text-center text-sm">
              <span className="text-muted-foreground">Don't have an account? </span>
              <Link href="/auth/signup" className="text-gradient-kronova font-semibold hover:underline">
                Sign up
              </Link>
            </div>
          </CardContent>
        </Card>

        <div className="text-center text-xs text-muted-foreground">
          <p>
            © 2026 <span className="text-gradient-kronova font-semibold">Kronova</span>. Intelligent Asset Systems.
          </p>
        </div>
      </div>
    </div>
  )
}
