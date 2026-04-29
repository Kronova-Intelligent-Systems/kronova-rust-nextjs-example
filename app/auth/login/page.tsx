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
    <div className="login-page min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient glow effects — same in both modes */}
      <div
        className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl animate-pulse-slow"
        style={{ backgroundColor: "rgba(0, 71, 171, 0.25)" }}
      />
      <div
        className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full blur-3xl animate-pulse-slow"
        style={{ backgroundColor: "rgba(0, 206, 209, 0.18)", animationDelay: "1s" }}
      />

      {/* Neural grid overlay */}
      <div className="absolute inset-0 neural-grid opacity-40" />

      <div className="w-full max-w-md space-y-8 relative z-10">
        {/* Logo + tagline */}
        <div className="text-center space-y-4">
          <div className="flex justify-center items-center">
            <img src="/kronova-logo-header.svg" alt="Kronova" className="h-10 w-auto" />
          </div>
          <p className="text-base font-semibold text-white/80 tracking-wide uppercase">
            Intelligent Asset Systems
          </p>

          {/* Feature badges — consistent dark pill style in both modes */}
          <div className="flex flex-wrap justify-center gap-2 text-xs max-w-sm mx-auto">
            <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full border border-white/15 hover:border-kronova-cyan/50 transition-all backdrop-blur-sm">
              <Shield className="h-3.5 w-3.5 text-kronova-cyan" />
              <span className="font-medium text-white/90">Secure</span>
            </div>
            <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full border border-white/15 hover:border-kronova-cyan/50 transition-all backdrop-blur-sm">
              <BarChart3 className="h-3.5 w-3.5 text-kronova-cyan" />
              <span className="font-medium text-white/90">Analytics</span>
            </div>
            <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full border border-white/15 hover:border-kronova-cyan/50 transition-all backdrop-blur-sm">
              <Brain className="h-3.5 w-3.5 text-kronova-cyan" />
              <span className="font-medium text-white/90">AI-Powered</span>
            </div>
          </div>
        </div>

        {/* Login card — dark glass in both modes */}
        <Card className="login-card border-white/10 backdrop-blur-md shadow-2xl shadow-black/40">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-2xl text-center text-white font-bold">Welcome Back</CardTitle>
            <CardDescription className="text-center text-white/60">
              Access your Kronova dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-white/80 font-medium">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-white/8 border-white/15 text-white placeholder:text-white/30 focus:border-kronova-cyan/60 focus:ring-kronova-cyan/20 backdrop-blur-sm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-white/80 font-medium">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-white/8 border-white/15 text-white placeholder:text-white/30 focus:border-kronova-cyan/60 focus:ring-kronova-cyan/20 backdrop-blur-sm"
                />
              </div>

              {error && (
                <Alert variant="destructive" className="bg-red-500/10 border-red-500/30">
                  <AlertDescription className="text-red-300">{error}</AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                className="w-full gradient-kronova hover:opacity-90 transition-opacity text-white border-0 font-semibold"
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
              <span className="text-white/50">{"Don't have an account? "}</span>
              <Link href="/auth/signup" className="text-gradient-kronova font-semibold hover:underline">
                Sign up
              </Link>
            </div>
          </CardContent>
        </Card>

        <div className="text-center text-xs text-white/40">
          <p>
            © 2026 <span className="text-gradient-kronova font-semibold">Kronova</span>. Intelligent Asset Systems.
          </p>
        </div>
      </div>
    </div>
  )
}
