import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { Pinecone } from "@pinecone-database/pinecone"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { config, options } = await request.json()

    let data: any[] = []

    // Query vector database based on provider
    switch (config.provider) {
      case "pinecone":
        data = await queryPinecone(config)
        break
      case "weaviate":
        data = await queryWeaviate(config)
        break
      case "qdrant":
        data = await queryQdrant(config)
        break
      default:
        return NextResponse.json({ error: "Unsupported vector DB provider" }, { status: 400 })
    }

    // Process and import assets
    const errors: Array<{ row: number; error: string; details?: any }> = []
    let imported = 0
    let failed = 0

    console.log(`[v0] Processing ${data.length} items from ${config.provider}`)

    for (let i = 0; i < data.length; i++) {
      const item = data[i]

      try {
        // Map asset_type to valid database values
        const validAssetTypes = ["equipment", "vehicle", "building", "infrastructure", "technology", "inventory", "digital"]
        let assetType = item.metadata?.asset_type || item.type || "digital"
        
        // If the asset type is not in the valid list, default to "digital"
        if (!validAssetTypes.includes(assetType)) {
          console.log(`[v0] Invalid asset_type "${assetType}" for row ${i + 1}, defaulting to "digital"`)
          assetType = "digital"
        }

        const asset = {
          asset_id: item.id || `VDB-${Date.now()}-${i}`,
          name: item.metadata?.name || item.name || "Unnamed Asset",
          asset_type: assetType,
          description: item.metadata?.description || null,
          status: item.metadata?.status || "active",
          embedding_vector: item.values ? JSON.stringify(item.values) : null,
          metadata: {
            ...item.metadata,
            import_source: `vector_db_${config.provider}`,
            imported_at: new Date().toISOString(),
            similarity_score: item.score,
          },
          user_id: user.id,
        }

        const { error } = await supabase.from("assets").insert(asset)

        if (error) {
          console.error(`[v0] Asset insert error for row ${i + 1}:`, error)
          throw error
        }
        imported++
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Import failed"
        const errorDetails = error instanceof Error ? error.stack : JSON.stringify(error)
        
        console.error(`[v0] Row ${i + 1} failed:`, errorMessage, errorDetails)
        
        errors.push({
          row: i + 1,
          error: errorMessage,
          details: errorDetails,
        })
        failed++
      }
    }

    console.log(`[v0] Import complete: ${imported} imported, ${failed} failed`)

    return NextResponse.json({
      success: failed === 0,
      imported,
      failed,
      errors,
    })
  } catch (error) {
    console.error("[v0] Vector DB import error:", error)
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

async function queryPinecone(config: any): Promise<any[]> {
  const pinecone = new Pinecone({
    apiKey: config.apiKey,
  })

  const index = pinecone.index(config.index)
  const namespace = index.namespace(config.namespace || "")

  // Query with filter
  const queryResponse = await namespace.query({
    topK: config.limit || 100,
    filter: config.filter,
    includeMetadata: true,
    includeValues: true,
  })

  return queryResponse.matches || []
}

async function queryWeaviate(config: any): Promise<any[]> {
  // Weaviate GraphQL query
  const query = `
    {
      Get {
        ${config.index}(limit: ${config.limit || 100}) {
          _additional {
            id
            vector
          }
          name
          asset_type
          description
          status
        }
      }
    }
  `

  const response = await fetch(`${config.endpoint}/v1/graphql`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({ query }),
  })

  const result = await response.json()
  return result.data?.Get?.[config.index] || []
}

async function queryQdrant(config: any): Promise<any[]> {
  const response = await fetch(`${config.endpoint}/collections/${config.index}/points/scroll`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": config.apiKey,
    },
    body: JSON.stringify({
      limit: config.limit || 100,
      filter: config.filter,
      with_payload: true,
      with_vector: true,
    }),
  })

  const result = await response.json()
  return result.result?.points || []
}
