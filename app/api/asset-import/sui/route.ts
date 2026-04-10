import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { SuiClient } from "@mysten/sui/client"
import { fetchSuiAssetValue } from "@/lib/blockchain-explorer"

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

    const client = new SuiClient({ url: config.rpcUrl || "https://fullnode.mainnet.sui.io:443" })

    const assets: any[] = []
    const errors: Array<{ row: number; error: string }> = []

    // Query owned objects
    const ownedObjects = await client.getOwnedObjects({
      owner: config.walletAddress,
      options: {
        showType: true,
        showContent: true,
        showDisplay: true,
      },
    })

    for (let i = 0; i < ownedObjects.data.length; i++) {
      const obj = ownedObjects.data[i]

      try {
        const objectData = obj.data

        if (!objectData) continue

        // Filter by object type if specified
        if (config.objectType && !objectData.type?.includes(config.objectType)) {
          continue
        }

        const content = objectData.content as any
        const display = objectData.display?.data

        const assetValue = await fetchSuiAssetValue(objectData.objectId)

        // NFTs and digital assets map to "digital", smart contracts to "technology"
        const assetType = config.importType === "nfts" ? "digital" : "digital"

        assets.push({
          asset_id: `SUI-${objectData.objectId}`,
          name: display?.name || content?.name || `Sui Object ${objectData.objectId.slice(0, 8)}`,
          asset_type: assetType,
          category: "blockchain_asset",
          description: display?.description || content?.description || "Asset from Sui blockchain",
          status: "active",
          current_value: assetValue,
          metadata: {
            blockchain: "sui",
            object_id: objectData.objectId,
            object_type: objectData.type,
            version: objectData.version,
            digest: objectData.digest,
            content,
            display,
            explorer_url: `https://suiscan.xyz/mainnet/object/${objectData.objectId}`,
            import_source: "sui",
            imported_at: new Date().toISOString(),
          },
          user_id: user.id,
        })
      } catch (error) {
        errors.push({
          row: i + 1,
          error: error instanceof Error ? error.message : "Failed to process object",
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
    console.error("[v0] Sui import error:", error)
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
