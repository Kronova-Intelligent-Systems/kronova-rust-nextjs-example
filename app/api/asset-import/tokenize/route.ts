import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { ethers } from "ethers"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { assetId, config } = await request.json()

    // Get asset data
    const { data: asset, error: assetError } = await supabase.from("assets").select("*").eq("id", assetId).single()

    if (assetError || !asset) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 })
    }

    let transactionHash: string | undefined

    // Tokenize based on blockchain
    switch (config.blockchain) {
      case "linea":
        transactionHash = await tokenizeOnLinea(asset, config)
        break
      case "sui":
        transactionHash = await tokenizeOnSui(asset, config)
        break
      case "canton":
        transactionHash = await tokenizeOnCanton(asset, config)
        break
      default:
        return NextResponse.json({ error: "Unsupported blockchain" }, { status: 400 })
    }

    // Update asset with tokenization info
    await supabase
      .from("assets")
      .update({
        metadata: {
          ...asset.metadata,
          tokenized: true,
          blockchain: config.blockchain,
          transaction_hash: transactionHash,
          tokenized_at: new Date().toISOString(),
        },
      })
      .eq("id", assetId)

    return NextResponse.json({
      success: true,
      transactionHash,
    })
  } catch (error) {
    console.error("[v0] Tokenization error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Tokenization failed",
      },
      { status: 500 },
    )
  }
}

async function tokenizeOnLinea(asset: any, config: any): Promise<string> {
  const provider = new ethers.JsonRpcProvider("https://rpc.linea.build")
  const wallet = new ethers.Wallet(config.privateKey, provider)

  // NFT minting ABI
  const mintAbi = ["function mint(address to, string memory tokenURI) returns (uint256)"]

  const contract = new ethers.Contract(config.contractAddress, mintAbi, wallet)

  // Create metadata URI
  const metadata = {
    name: asset.name,
    description: asset.description,
    image: asset.metadata?.image_url,
    attributes: [
      { trait_type: "Asset Type", value: asset.asset_type },
      { trait_type: "Asset ID", value: asset.asset_id },
      { trait_type: "Status", value: asset.status },
    ],
  }

  // In production, upload metadata to IPFS
  const metadataURI = `data:application/json;base64,${Buffer.from(JSON.stringify(metadata)).toString("base64")}`

  const tx = await contract.mint(wallet.address, metadataURI)
  const receipt = await tx.wait()

  return receipt.hash
}

async function tokenizeOnSui(asset: any, config: any): Promise<string> {
  // Sui tokenization would use @mysten/sui SDK
  // Placeholder implementation
  return `sui_tx_${Date.now()}`
}

async function tokenizeOnCanton(asset: any, config: any): Promise<string> {
  // Canton tokenization would use Canton SDK
  // Placeholder implementation
  return `canton_tx_${Date.now()}`
}
