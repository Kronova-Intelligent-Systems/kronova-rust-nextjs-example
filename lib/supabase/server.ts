import { createServerClient as createSupabaseServerClient } from "@supabase/ssr"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"

/**
 * Creates a Supabase server client with support for new publishable keys
 * 
 * Supports both:
 * - New publishable key: NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (sb_publishable_...)
 * - Legacy anon key: NEXT_PUBLIC_SUPABASE_ANON_KEY (JWT format)
 * 
 * @see https://supabase.com/docs/guides/api/api-keys
 */
export function createServerClient(cookieStore: ReturnType<typeof cookies>) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  
  // Prefer new publishable key, fallback to legacy anon key for backward compatibility
  const supabaseKey = 
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.warn("[v0] Supabase environment variables not configured. Using mock server client.")
    console.warn("[v0] Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY")
    
    // Return a mock server client for development
    return {
      auth: {
        getUser: async () => {
          return { data: { user: null }, error: null }
        },
        signOut: async () => {
          return { error: null }
        },
      },
      from: (table: string) => ({
        select: (columns?: string) => ({
          eq: () => ({ data: [], error: null }),
          order: () => ({ data: [], error: null }),
          data: [],
          error: null,
        }),
        insert: () => ({ data: null, error: null }),
        update: () => ({ data: null, error: null }),
        delete: () => ({ data: null, error: null }),
      }),
    } as any
  }

  return createSupabaseServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
    },
  })
}

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(cookieStore)
}

/**
 * Creates a Supabase service role client with elevated privileges
 * 
 * Supports both:
 * - New secret key: SUPABASE_SECRET_KEY (sb_secret_...)
 * - Legacy service_role key: SUPABASE_SERVICE_ROLE_KEY (JWT format)
 * 
 * WARNING: These keys bypass Row Level Security (RLS). Only use in secure server-side contexts.
 * 
 * @see https://supabase.com/docs/guides/api/api-keys
 */
export function createServiceRoleClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  
  // Prefer new secret key, fallback to legacy service_role key for backward compatibility
  const supabaseSecretKey = 
    process.env.SUPABASE_SECRET_KEY || 
    process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseSecretKey) {
    throw new Error(
      "Supabase service credentials not configured. " +
      "Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY (or legacy SUPABASE_SERVICE_ROLE_KEY)"
    )
  }

  return createSupabaseClient(supabaseUrl, supabaseSecretKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
