import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { connectionConfig, options } = await request.json()

    // This avoids native dependencies and works in serverless environments
    let data: any[] = []

    // Execute query using Supabase's connection pooling
    switch (connectionConfig.type) {
      case "postgresql":
        data = await queryViaSupabase(connectionConfig, supabase)
        break
      case "mysql":
      case "mongodb":
        // For non-PostgreSQL databases, use HTTP-based APIs or webhooks
        return NextResponse.json(
          {
            error: "Direct MySQL/MongoDB connections not supported. Please use API import or export data to CSV/JSON.",
          },
          { status: 400 },
        )
      default:
        return NextResponse.json({ error: "Unsupported database type" }, { status: 400 })
    }

    // Process and import data
    const result = await processAndImportAssets(data, user.id, options)

    return NextResponse.json(result)
  } catch (error) {
    console.error("[v0] Database import error:", error)
    return NextResponse.json(
      {
        success: false,
        imported: 0,
        failed: 0,
        errors: [
          {
            row: 0,
            error: error instanceof Error ? error.message : "Import failed",
          },
        ],
      },
      { status: 500 },
    )
  }
}

async function queryViaSupabase(config: any, supabase: any): Promise<any[]> {
  // For PostgreSQL, we can use Supabase's connection if it's the same database
  // Otherwise, recommend using CSV export/import or API integration

  // This is a placeholder - in production, you would:
  // 1. Store connection strings securely in Supabase Vault
  // 2. Use Supabase Edge Functions with Deno's PostgreSQL client
  // 3. Or use HTTP-based database APIs

  throw new Error(
    "Direct database connections require Supabase Edge Functions. Please export your data to CSV/JSON or use API import.",
  )
}

async function processAndImportAssets(data: any[], userId: string, options: any): Promise<any> {
  const supabase = await createClient()
  const errors: Array<{ row: number; error: string }> = []
  let imported = 0
  let failed = 0

  for (let i = 0; i < data.length; i++) {
    const row = data[i]

    try {
      const asset = {
        asset_id: row.asset_id || row.id || `IMPORT-${Date.now()}-${i}`,
        name: row.name,
        asset_type: row.asset_type || row.type,
        category: row.category || null,
        description: row.description || null,
        status: row.status || "active",
        current_value: row.current_value || row.value || null,
        user_id: userId,
        metadata: {
          ...row.metadata,
          import_source: "database",
          imported_at: new Date().toISOString(),
        },
      }

      const { error } = await supabase.from("assets").insert(asset)

      if (error) throw error
      imported++
    } catch (error) {
      errors.push({
        row: i + 1,
        error: error instanceof Error ? error.message : "Import failed",
      })
      failed++
    }
  }

  return {
    success: failed === 0,
    imported,
    failed,
    errors,
  }
}
