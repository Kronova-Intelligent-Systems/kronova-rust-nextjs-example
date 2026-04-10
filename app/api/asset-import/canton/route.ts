import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { fetchCantonAssetValue } from "@/lib/blockchain-explorer"

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

    // Query Canton Ledger API
    const cantonResponse = await fetch(`${config.participantUrl}/v1/query`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiToken}`,
      },
      body: JSON.stringify({
        templateIds: config.templateId ? [config.templateId] : undefined,
        query: config.contractFilter || {},
      }),
    })

    if (!cantonResponse.ok) {
      throw new Error("Canton query failed")
    }

    const cantonData = await cantonResponse.json()
    const contracts = cantonData.result || []

    const assets: any[] = []
    const errors: Array<{ row: number; error: string }> = []

    for (let i = 0; i < contracts.length; i++) {
      const contract = contracts[i]

      try {
        const assetValue = await fetchCantonAssetValue(contract.contractId)

        assets.push({
          asset_id: `CANTON-${contract.contractId}`,
          name: contract.payload?.name || `Canton Asset ${contract.contractId.slice(0, 8)}`,
          asset_type: "digital",
          category: "blockchain_asset",
          description: contract.payload?.description || "Asset from Canton network",
          status: "active",
          current_value: assetValue,
          metadata: {
            blockchain: "canton",
            contract_id: contract.contractId,
            template_id: contract.templateId,
            created_at: contract.createdAt,
            payload: contract.payload,
            signatories: contract.signatories,
            observers: contract.observers,
            explorer_url: `https://canton.network/explorer/contract/${contract.contractId}`,
            import_source: "canton",
            imported_at: new Date().toISOString(),
          },
          user_id: user.id,
        })
      } catch (error) {
        errors.push({
          row: i + 1,
          error: error instanceof Error ? error.message : "Failed to process contract",
        })
      }
    }

    // Import assets to database
    let imported = 0
    let failed = 0

    for (const asset of assets) {
      try {
        const { error } = await supabase.from("assets").insert(asset)
        if (error) throw error
        imported++
      } catch (error) {
        failed++
      }
    }

    return NextResponse.json({
      success: failed === 0,
      imported,
      failed,
      errors,
      assets,
    })
  } catch (error) {
    console.error("[v0] Canton import error:", error)
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
