import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

/**
 * Refreshes the Supabase auth session and applies security headers.
 * Called from the root proxy.ts (Next.js 16 proxy convention).
 *
 * With Fluid compute, never store this client in a global —
 * always create a new one per request.
 */
export async function updateSession(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

  // Prefer new publishable key, fallback to legacy anon key
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  let supabaseResponse = NextResponse.next({
    request,
  })

  applySecurityHeaders(request, supabaseResponse)

  if (!supabaseUrl || !supabaseKey) {
    console.warn("Supabase environment variables not configured. Skipping auth session refresh.")
    return supabaseResponse
  }

  // Handle CORS preflight for API routes
  if (request.nextUrl.pathname.startsWith("/api/") && request.method === "OPTIONS") {
    const preflight = new NextResponse(null, { status: 200 })
    applySecurityHeaders(request, preflight)
    return preflight
  }

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        supabaseResponse = NextResponse.next({
          request,
        })
        applySecurityHeaders(request, supabaseResponse)
        cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
      },
    },
  })

  // Do not run code between createServerClient and supabase.auth.getUser().
  // A simple mistake could make it very hard to debug issues with users
  // being randomly logged out.
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (request.nextUrl.pathname.startsWith("/dashboard") && !user) {
      const url = request.nextUrl.clone()
      url.pathname = "/auth/login"
      return NextResponse.redirect(url)
    }

    if (request.nextUrl.pathname.startsWith("/auth") && user) {
      const url = request.nextUrl.clone()
      url.pathname = "/dashboard"
      return NextResponse.redirect(url)
    }
  } catch (error) {
    console.warn("Auth session refresh error:", error)
    // Continue without auth check on transient failure
  }

  // IMPORTANT: return the supabaseResponse object as-is so auth cookies
  // stay in sync between browser and server.
  return supabaseResponse
}

/** Enterprise security headers applied to every response. */
function applySecurityHeaders(request: NextRequest, response: NextResponse) {
  const headers = response.headers

  headers.set(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://*.supabase.co https://*.vercel-storage.com https://*.plaid.com;",
  )
  headers.set("X-Frame-Options", "DENY")
  headers.set("X-Content-Type-Options", "nosniff")
  headers.set("X-XSS-Protection", "1; mode=block")
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin")
  headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()")
  headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains")

  if (request.nextUrl.pathname.startsWith("/api/")) {
    headers.set("Access-Control-Allow-Credentials", "true")
    headers.set("Access-Control-Allow-Origin", request.headers.get("origin") || "*")
    headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
    headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With")
  }
}
