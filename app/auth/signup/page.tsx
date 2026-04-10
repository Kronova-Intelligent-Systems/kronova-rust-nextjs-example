"use client"

import type React from "react"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Brain, Shield, BarChart3, CheckCircle, Sparkles } from "lucide-react"
import Link from "next/link"

export default function SignUpPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const supabase = createClient()

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${window.location.origin}/dashboard`,
          data: {
            full_name: fullName,
          },
        },
      })

      if (error) {
        setError(error.message)
      } else {
        setSuccess(true)
      }
    } catch (err) {
      setError("An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-background neural-grid flex items-center justify-center p-4 relative overflow-hidden">
        <div
          className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl animate-pulse-slow"
          style={{ backgroundColor: "rgba(0, 71, 171, 0.2)" }}
        />
        <div
          className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full blur-3xl animate-pulse-slow"
          style={{ backgroundColor: "rgba(0, 206, 209, 0.2)", animationDelay: "1s" }}
        />

        <Card className="w-full max-w-md glass-card border-white/20 dark:border-gray-700/30 relative z-10">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full gradient-kronova flex items-center justify-center mx-auto">
                <CheckCircle className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold">Check your email</h2>
              <p className="text-muted-foreground">
                We've sent you a confirmation link at <strong className="text-foreground">{email}</strong>
              </p>
              <Link href="/auth/login">
                <Button variant="outline" className="w-full glass-subtle hover:bg-primary/10 bg-transparent">
                  Back to Sign In
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background neural-grid flex items-center justify-center p-4 relative overflow-hidden">
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
            <img src="/kronova-logo-header.svg" alt="Kronova" className="h-14 w-auto" />
          </div>
          <p className="text-muted-foreground">Intelligent Asset Systems</p>
          <div className="flex justify-center space-x-6 text-sm text-muted-foreground">
            <div className="flex items-center space-x-1.5 glass-subtle px-3 py-1.5 rounded-full">
              <Shield className="h-4 w-4 text-primary" />
              <span>Blockchain</span>
            </div>
            <div className="flex items-center space-x-1.5 glass-subtle px-3 py-1.5 rounded-full">
              <BarChart3 className="h-4 w-4 text-primary" />
              <span>Analytics</span>
            </div>
            <div className="flex items-center space-x-1.5 glass-subtle px-3 py-1.5 rounded-full">
              <Brain className="h-4 w-4 text-primary" />
              <span>AI-Powered</span>
            </div>
          </div>
        </div>

        <Card className="glass-card border-white/20 dark:border-gray-700/30">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Create Account</CardTitle>
            <CardDescription className="text-center">Get started with Kronova</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignUp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Enter your full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="bg-input/50 backdrop-blur-sm border-border/50 focus:border-primary/50"
                />
              </div>
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
                  placeholder="Create a password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
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
                    Creating account...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Create Account
                  </>
                )}
              </Button>
            </form>

            <div className="mt-4 text-center text-sm">
              <span className="text-muted-foreground">Already have an account? </span>
              <Link href="/auth/login" className="text-gradient-kronova font-semibold hover:underline">
                Sign in
              </Link>
            </div>
          </CardContent>
        </Card>

        <div className="text-center text-xs text-muted-foreground">
          <p>
            © 2025 <span className="text-gradient-kronova font-semibold">Kronova</span>. Intelligent Asset Systems.
          </p>
        </div>
      </div>
    </div>
  )
}
