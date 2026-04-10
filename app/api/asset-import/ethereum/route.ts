import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { fetchEthereumAssetValue } from "@/lib/blockchain-explorer"

export async function POST(request: NextRequest) {
  try {
    const { address, contractAddress, importType = "balance" } = await request.json()

    if (!address) {
      return NextResponse.json({ error: "Ethereum address is required" }, { status: 400 })
    }

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const assets: any[] = []
    const errors: Array<{ row: number; error: string }> = []

    const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || "YourApiKeyToken"
    const baseUrl = "https://api.etherscan.io/api"

    try {
      if (importType === "balance") {
        const balanceResponse = await fetch(
          `${baseUrl}?module=account&action=balance&address=${address}&tag=latest&apikey=${ETHERSCAN_API_KEY}`,
        )
        const balanceData = await balanceResponse.json()

        if (balanceData.status === "1" && balanceData.result) {
          const balanceWei = BigInt(balanceData.result)
          const ethBalance = Number(balanceWei) / 1e18

          if (ethBalance > 0) {
            const assetValue = await fetchEthereumAssetValue(address)

            assets.push({
              asset_id: `ETH-${address}`,
              name: `Ethereum Balance - ${address.slice(0, 8)}...`,
              asset_type: "digital",
              category: "blockchain_asset",
              description: `${ethBalance.toFixed(6)} ETH`,
              status: "active",
              current_value: assetValue || ethBalance * 3000,
              metadata: {
                blockchain: "ethereum",
                address,
                balance: ethBalance.toString(),
                balance_wei: balanceData.result,
                explorer_url: `https://etherscan.io/address/${address}`,
                import_source: "ethereum_balance",
                imported_at: new Date().toISOString(),
              },
              user_id: user.id,
            })
          }
        }
      } else if (importType === "erc20" && contractAddress) {
        const tokenBalanceResponse = await fetch(
          `${baseUrl}?module=account&action=tokenbalance&contractaddress=${contractAddress}&address=${address}&tag=latest&apikey=${ETHERSCAN_API_KEY}`,
        )
        const tokenBalanceData = await tokenBalanceResponse.json()

        if (tokenBalanceData.status === "1" && tokenBalanceData.result) {
          // Fetch token info
          const tokenInfoResponse = await fetch(
            `${baseUrl}?module=token&action=tokeninfo&contractaddress=${contractAddress}&apikey=${ETHERSCAN_API_KEY}`,
          )
          const tokenInfoData = await tokenInfoResponse.json()

          if (tokenInfoData.status === "1" && tokenInfoData.result && tokenInfoData.result[0]) {
            const tokenInfo = tokenInfoData.result[0]
            const decimals = Number.parseInt(tokenInfo.divisor) || 18
            const balance = Number(tokenBalanceData.result) / Math.pow(10, decimals)

            if (balance > 0) {
              const assetValue = await fetchEthereumAssetValue(address, contractAddress)

              assets.push({
                asset_id: `ETH-ERC20-${contractAddress}-${address}`,
                name: `${tokenInfo.tokenName} (${tokenInfo.symbol})`,
                asset_type: "digital",
                category: "blockchain_asset",
                description: `${balance.toFixed(4)} ${tokenInfo.symbol} tokens`,
                status: "active",
                current_value: assetValue || balance,
                metadata: {
                  blockchain: "ethereum",
                  address,
                  contract_address: contractAddress,
                  token_name: tokenInfo.tokenName,
                  token_symbol: tokenInfo.symbol,
                  balance: balance.toString(),
                  decimals: decimals.toString(),
                  explorer_url: `https://etherscan.io/token/${contractAddress}?a=${address}`,
                  import_source: "ethereum_erc20",
                  imported_at: new Date().toISOString(),
                },
                user_id: user.id,
              })
            }
          }
        }
      } else if (importType === "erc721" && contractAddress) {
        const nftResponse = await fetch(
          `${baseUrl}?module=account&action=tokennfttx&contractaddress=${contractAddress}&address=${address}&page=1&offset=100&sort=desc&apikey=${ETHERSCAN_API_KEY}`,
        )
        const nftData = await nftResponse.json()

        if (nftData.status === "1" && nftData.result && Array.isArray(nftData.result)) {
          // Get unique token IDs owned by the address
          const ownedTokens = new Map()

          for (const tx of nftData.result) {
            if (tx.to.toLowerCase() === address.toLowerCase()) {
              ownedTokens.set(tx.tokenID, {
                tokenId: tx.tokenID,
                tokenName: tx.tokenName,
                tokenSymbol: tx.tokenSymbol,
              })
            } else if (tx.from.toLowerCase() === address.toLowerCase()) {
              ownedTokens.delete(tx.tokenID)
            }
          }

          for (const [tokenId, tokenInfo] of ownedTokens) {
            assets.push({
              asset_id: `ETH-NFT-${contractAddress}-${tokenId}`,
              name: `${tokenInfo.tokenName} #${tokenId}`,
              asset_type: "digital",
              category: "blockchain_asset",
              description: `NFT from ${tokenInfo.tokenName} collection`,
              status: "active",
              metadata: {
                blockchain: "ethereum",
                address,
                contract_address: contractAddress,
                token_id: tokenId,
                collection_name: tokenInfo.tokenName,
                symbol: tokenInfo.tokenSymbol,
                explorer_url: `https://etherscan.io/nft/${contractAddress}/${tokenId}`,
                import_source: "ethereum_nft",
                imported_at: new Date().toISOString(),
              },
              user_id: user.id,
            })
          }
        }
      }
    } catch (error) {
      console.error("[v0] Error fetching Ethereum data:", error)
      errors.push({
        row: 0,
        error: error instanceof Error ? error.message : "Failed to fetch Ethereum data",
      })
    }

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
          error: error instanceof Error ? error.message : "Failed to insert asset",
        })
        failed++
      }
    }

    return NextResponse.json({
      success: failed === 0,
      imported,
      failed,
      errors,
      assets: imported > 0 ? assets : undefined,
    })
  } catch (error) {
    console.error("[v0] Ethereum import error:", error)
    return NextResponse.json(
      {
        success: false,
        imported: 0,
        failed: 0,
        errors: [
          {
            row: 0,
            error: error instanceof Error ? error.message : "Ethereum import failed",
          },
        ],
      },
      { status: 500 },
    )
  }
}
