import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import crypto from "crypto"

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type")
    if (!contentType || !contentType.includes("application/json")) {
      return NextResponse.json(
        { error: "Invalid Content-Type. Expected application/json" },
        {
          status: 415,
          headers: {
            "Content-Type": "application/json",
            "X-Request-ID": crypto.randomUUID(),
          },
        },
      )
    }

    const cookieStore = await cookies()
    const supabase = createServerClient(cookieStore)

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    
    const session = user ? { user } : null

    // Parse request body
    const body = await request.json()
    const { workflowId, apiKey: clientApiKey, ...executionRequest } = body

    if (!workflowId) {
      return NextResponse.json(
        { error: "Missing required field: workflowId" },
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            "X-Request-ID": crypto.randomUUID(),
          },
        },
      )
    }

    let userId: string | undefined
    let isValidated = false

    if (session) {
      // Authenticated user via session - no API key required
      console.log("[v0] Using session authentication for user:", session.user.id)
      userId = session.user.id
      isValidated = true
    } else {
      // No session - require API key validation
      const apiKey =
        clientApiKey || request.headers.get("x-api-key") || request.headers.get("authorization")?.replace("Bearer ", "")

      if (!apiKey) {
        return NextResponse.json(
          {
            error:
              "Authentication required. Please provide either a valid session or API key in the request body, x-api-key header, or Authorization header",
          },
          {
            status: 401,
            headers: {
              "Content-Type": "application/json",
              "X-Request-ID": crypto.randomUUID(),
            },
          },
        )
      }

      // Validate API key using the advanced stored procedure
      const keyHash = crypto.createHash("sha256").update(apiKey).digest("hex")
      const keyPrefix = apiKey.substring(0, 8)

      console.log("[v0] Validating API key using advanced validate_api_key")
      console.log("[v0] Key prefix:", keyPrefix)

      const { data: validationResult, error: validationError } = await supabase.rpc("validate_api_key", {
        x_key_hash: keyHash,
        x_key_prefix: keyPrefix,
        x_expected_user_id: null, // Don't require specific user for API key
        x_mark_usage: true,
        x_required_scopes: JSON.stringify(["workflows:execute"]),
      })

      if (validationError) {
        console.error("[v0] API key validation failed:", validationError)
        return NextResponse.json(
          {
            error: "API key validation failed",
            details: validationError.message,
          },
          {
            status: 500,
            headers: {
              "Content-Type": "application/json",
              "X-Request-ID": crypto.randomUUID(),
            },
          },
        )
      }

      const validationData = Array.isArray(validationResult) ? validationResult[0] : validationResult

      if (!validationData || !validationData.is_valid) {
        console.error("[v0] API key validation returned false:", validationData?.error_message)
        return NextResponse.json(
          {
            error: validationData?.error_message || "Invalid API key or insufficient permissions",
          },
          {
            status: 401,
            headers: {
              "Content-Type": "application/json",
              "X-Request-ID": crypto.randomUUID(),
            },
          },
        )
      }

      userId = validationData.user_id
      isValidated = true
      console.log("[v0] API key validated successfully for user:", userId)
    }

    if (!isValidated || !userId) {
      return NextResponse.json(
        { error: "Authentication failed" },
        {
          status: 401,
          headers: {
            "Content-Type": "application/json",
            "X-Request-ID": crypto.randomUUID(),
          },
        },
      )
    }
    // </CHANGE>

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin
    const requestId = crypto.randomUUID()

    const internalApiKey = process.env.RESENDIT_API_KEY || clientApiKey

    const response = await fetch(`${baseUrl}/api/workflows/${workflowId}/execute`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: internalApiKey ? `Bearer ${internalApiKey}` : "",
        "X-Internal-Request": "true",
        "X-User-ID": userId,
        "X-Request-ID": requestId,
        "User-Agent": "ResendIt-Proxy/1.0",
        Accept: "application/json",
      },
      body: JSON.stringify(executionRequest),
    })
    // </CHANGE>

    const responseData = await response.json()

    if (!response.ok) {
      return NextResponse.json(responseData, {
        status: response.status,
        headers: {
          "Content-Type": "application/json",
          "X-Request-ID": requestId,
        },
      })
    }

    return NextResponse.json(responseData, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "X-Request-ID": requestId,
      },
    })
  } catch (error: any) {
    console.error("[v0] Error in workflow execute proxy:", error)
    return NextResponse.json(
      {
        error: error.message || "Internal server error",
        stack: error.stack,
      },
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "X-Request-ID": crypto.randomUUID(),
        },
      },
    )
  }
}
