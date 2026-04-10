import { createBrowserClient } from "@supabase/ssr"

/**
 * Creates a Supabase browser client with support for new publishable keys
 * 
 * Supports both:
 * - New publishable key: NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (sb_publishable_...)
 * - Legacy anon key: NEXT_PUBLIC_SUPABASE_ANON_KEY (JWT format)
 * 
 * @see https://supabase.com/docs/guides/api/api-keys
 */
export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  
  // Prefer new publishable key, fallback to legacy anon key for backward compatibility
  const supabaseKey = 
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.warn("[v0] Supabase environment variables not configured. Using mock client.")
    console.warn("[v0] Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY")
    
    // Return a mock client for development
    return {
      auth: {
        signInWithPassword: async ({ email, password }: { email: string; password: string }) => {
          console.log("[v0] Mock login attempt:", { email })
          // Simulate network delay
          await new Promise((resolve) => setTimeout(resolve, 1000))

          if (email && password && email.includes("@")) {
            return { data: { user: { id: "mock-user", email } }, error: null }
          }
          return { data: null, error: { message: "Please enter a valid email and password" } }
        },
        signUp: async ({ email, password }: { email: string; password: string }) => {
          console.log("[v0] Mock signup attempt:", { email })
          await new Promise((resolve) => setTimeout(resolve, 1000))
          if (email && password && email.includes("@")) {
            return { data: { user: { id: "mock-user", email } }, error: null }
          }
          return { data: null, error: { message: "Please enter a valid email and password" } }
        },
        signOut: async () => {
          console.log("[v0] Mock signout")
          return { error: null }
        },
        getUser: async () => {
          return { data: { user: null }, error: null }
        },
      },
    } as any
  }

  return createBrowserClient(supabaseUrl, supabaseKey)
}
