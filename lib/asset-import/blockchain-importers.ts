import { createClient } from "@/lib/supabase/client"
import { ethers } from "ethers"
import { fetchLineaAssetValue } from "@/lib/blockchain-explorer"

export interface BlockchainImportResult {
  success: boolean
  imported: number
  failed: number
  errors: Array<{ row: number; error: string }>
  assets?: any[]
  transactions?: string[]
}

// Linea Network Import
export async function importFromLinea(
  config: {
    rpcUrl?: string
    contractAddress?: string
    walletAddress?: string
    privateKey?: string
    tokenIds?: string[]
    importType: "nft" | "token" | "contract_data"
  },
  options: { userId: string },
): Promise<BlockchainImportResult> {
  try {
    const rpcUrl = config.rpcUrl || "https://rpc.linea.build"
    const provider = new ethers.JsonRpcProvider(rpcUrl)

    let assets: any[] = []
    const transactions: string[] = []
    const errors: Array<{ row: number; error: string }> = []

    if (config.importType === "nft") {
      // Import NFT assets from Linea
      assets = await importLineaNFTs(provider, config, options.userId)
    } else if (config.importType === "token") {
      // Import token holdings as assets
      assets = await importLineaTokens(provider, config, options.userId)
    } else if (config.importType === "contract_data") {
      // Import data from smart contract
      assets = await importLineaContractData(provider, config, options.userId)
    }

    // Store assets in database
    const supabase = createClient()
    let imported = 0
    let failed = 0

    for (let i = 0; i < assets.length; i++) {
      try {
        const { error } = await supabase.from("assets").insert(assets[i])
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
      assets,
      transactions,
    }
  } catch (error) {
    return {
      success: false,
      imported: 0,
      failed: 0,
      errors: [
        {
          row: 0,
          error: error instanceof Error ? error.message : "Linea import failed",
        },
      ],
    }
  }
}

// Sui Network Import
export async function importFromSui(
  config: {
    rpcUrl?: string
    walletAddress: string
    objectType?: string
    importType: "objects" | "nfts" | "tokens"
  },
  options: { userId: string },
): Promise<BlockchainImportResult> {
  try {
    const rpcUrl = config.rpcUrl || "https://fullnode.mainnet.sui.io:443"

    const response = await fetch("/api/asset-import/sui", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ config, options }),
    })

    if (!response.ok) {
      throw new Error("Sui import failed")
    }

    return await response.json()
  } catch (error) {
    return {
      success: false,
      imported: 0,
      failed: 0,
      errors: [
        {
          row: 0,
          error: error instanceof Error ? error.message : "Sui import failed",
        },
      ],
    }
  }
}

// Canton Network Import
export async function importFromCanton(
  config: {
    participantUrl: string
    apiToken: string
    partyId: string
    templateId?: string
    contractFilter?: Record<string, any>
  },
  options: { userId: string },
): Promise<BlockchainImportResult> {
  try {
    const response = await fetch("/api/asset-import/canton", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ config, options }),
    })

    if (!response.ok) {
      throw new Error("Canton import failed")
    }

    return await response.json()
  } catch (error) {
    return {
      success: false,
      imported: 0,
      failed: 0,
      errors: [
        {
          row: 0,
          error: error instanceof Error ? error.message : "Canton import failed",
        },
      ],
    }
  }
}

// Bitcoin Network Import
export async function importFromBitcoin(
  config: {
    address: string
    importType?: "utxo" | "balance"
  },
  options: { userId: string },
): Promise<BlockchainImportResult> {
  try {
    const response = await fetch("/api/asset-import/bitcoin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address: config.address, importType: config.importType }),
    })

    if (!response.ok) {
      throw new Error("Bitcoin import failed")
    }

    return await response.json()
  } catch (error) {
    return {
      success: false,
      imported: 0,
      failed: 0,
      errors: [
        {
          row: 0,
          error: error instanceof Error ? error.message : "Bitcoin import failed",
        },
      ],
    }
  }
}

// Ethereum Network Import
export async function importFromEthereum(
  config: {
    address: string
    contractAddress?: string
    importType?: "balance" | "erc20" | "erc721"
  },
  options: { userId: string },
): Promise<BlockchainImportResult> {
  try {
    const response = await fetch("/api/asset-import/ethereum", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        address: config.address,
        contractAddress: config.contractAddress,
        importType: config.importType || "balance",
      }),
    })

    if (!response.ok) {
      throw new Error("Ethereum import failed")
    }

    return await response.json()
  } catch (error) {
    return {
      success: false,
      imported: 0,
      failed: 0,
      errors: [
        {
          row: 0,
          error: error instanceof Error ? error.message : "Ethereum import failed",
        },
      ],
    }
  }
}

// Helper functions for Linea
async function importLineaNFTs(provider: ethers.JsonRpcProvider, config: any, userId: string): Promise<any[]> {
  const assets: any[] = []

  if (!config.contractAddress || !config.walletAddress) {
    throw new Error("Contract address and wallet address required for NFT import")
  }

  // ERC-721 ABI for NFT queries
  const erc721Abi = [
    "function balanceOf(address owner) view returns (uint256)",
    "function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)",
    "function tokenURI(uint256 tokenId) view returns (string)",
    "function name() view returns (string)",
    "function symbol() view returns (string)",
  ]

  const contract = new ethers.Contract(config.contractAddress, erc721Abi, provider)

  try {
    const balance = await contract.balanceOf(config.walletAddress)
    const collectionName = await contract.name()
    const symbol = await contract.symbol()

    for (let i = 0; i < Number(balance); i++) {
      try {
        const tokenId = await contract.tokenOfOwnerByIndex(config.walletAddress, i)
        const tokenURI = await contract.tokenURI(tokenId)

        // Fetch metadata from tokenURI
        let metadata: any = {}
        if (tokenURI.startsWith("http")) {
          const metadataResponse = await fetch(tokenURI)
          metadata = await metadataResponse.json()
        }

        const assetValue = await fetchLineaAssetValue(config.contractAddress, tokenId.toString())

        assets.push({
          asset_id: `LINEA-NFT-${config.contractAddress}-${tokenId}`,
          name: metadata.name || `${collectionName} #${tokenId}`,
          asset_type: "digital",
          category: "blockchain_asset",
          description: metadata.description || `NFT from ${collectionName} collection`,
          status: "active",
          current_value: assetValue,
          metadata: {
            blockchain: "linea",
            contract_address: config.contractAddress,
            token_id: tokenId.toString(),
            token_uri: tokenURI,
            collection_name: collectionName,
            symbol,
            nft_metadata: metadata,
            explorer_url: `https://lineascan.build/token/${config.contractAddress}?a=${tokenId}`,
            import_source: "linea_nft",
            imported_at: new Date().toISOString(),
          },
          user_id: userId,
        })
      } catch (error) {
        console.error(`[v0] Failed to import NFT at index ${i}:`, error)
      }
    }
  } catch (error) {
    console.error("[v0] Failed to query NFT contract:", error)
  }

  return assets
}

async function importLineaTokens(provider: ethers.JsonRpcProvider, config: any, userId: string): Promise<any[]> {
  const assets: any[] = []

  if (!config.contractAddress || !config.walletAddress) {
    throw new Error("Contract address and wallet address required for token import")
  }

  // ERC-20 ABI for token queries
  const erc20Abi = [
    "function balanceOf(address owner) view returns (uint256)",
    "function decimals() view returns (uint8)",
    "function name() view returns (string)",
    "function symbol() view returns (string)",
  ]

  const contract = new ethers.Contract(config.contractAddress, erc20Abi, provider)

  try {
    const balance = await contract.balanceOf(config.walletAddress)
    const decimals = await contract.decimals()
    const name = await contract.name()
    const symbol = await contract.symbol()

    const formattedBalance = ethers.formatUnits(balance, decimals)

    const assetValue = await fetchLineaAssetValue(config.contractAddress)

    if (Number(formattedBalance) > 0) {
      assets.push({
        asset_id: `LINEA-TOKEN-${config.contractAddress}`,
        name: `${name} (${symbol})`,
        asset_type: "digital",
        category: "blockchain_asset",
        description: `${formattedBalance} ${symbol} tokens on Linea`,
        status: "active",
        current_value: assetValue || Number(formattedBalance),
        metadata: {
          blockchain: "linea",
          contract_address: config.contractAddress,
          token_name: name,
          token_symbol: symbol,
          balance: formattedBalance,
          decimals: decimals.toString(),
          explorer_url: `https://lineascan.build/address/${config.contractAddress}`,
          import_source: "linea_token",
          imported_at: new Date().toISOString(),
        },
        user_id: userId,
      })
    }
  } catch (error) {
    console.error("[v0] Failed to query token contract:", error)
  }

  return assets
}

async function importLineaContractData(provider: ethers.JsonRpcProvider, config: any, userId: string): Promise<any[]> {
  const assets: any[] = []

  if (!config.contractAddress) {
    throw new Error("Contract address required for contract data import")
  }

  // Custom ABI would be provided by user
  // For now, we'll fetch basic contract information
  try {
    const code = await provider.getCode(config.contractAddress)

    if (code === "0x") {
      throw new Error("No contract found at address")
    }

    assets.push({
      asset_id: `LINEA-CONTRACT-${config.contractAddress}`,
      name: `Smart Contract ${config.contractAddress.slice(0, 10)}...`,
      asset_type: "technology",
      category: "blockchain_asset",
      description: "Smart contract on Linea network",
      status: "active",
      metadata: {
        blockchain: "linea",
        contract_address: config.contractAddress,
        has_code: code !== "0x",
        explorer_url: `https://lineascan.build/address/${config.contractAddress}`,
        import_source: "linea_contract",
        imported_at: new Date().toISOString(),
      },
      user_id: userId,
    })
  } catch (error) {
    console.error("[v0] Failed to query contract:", error)
  }

  return assets
}

// Tokenize existing asset on blockchain
export async function tokenizeAsset(
  assetId: string,
  config: {
    blockchain: "linea" | "sui" | "canton"
    contractAddress?: string
    privateKey?: string
    metadata?: Record<string, any>
  },
): Promise<{ success: boolean; transactionHash?: string; error?: string }> {
  try {
    const response = await fetch("/api/asset-import/tokenize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assetId, config }),
    })

    if (!response.ok) {
      throw new Error("Tokenization failed")
    }

    return await response.json()
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Tokenization failed",
    }
  }
}
