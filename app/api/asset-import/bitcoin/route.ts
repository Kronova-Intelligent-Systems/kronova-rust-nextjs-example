import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { fetchBitcoinAssetValue } from "@/lib/blockchain-explorer"

function isValidBitcoinAddress(address: string): boolean {
  // Bitcoin address patterns:
  // Legacy (P2PKH): starts with 1, 26-35 characters
  // Script (P2SH): starts with 3, 26-35 characters
  // SegWit (Bech32): starts with bc1, 42-62 characters
  // Testnet: starts with m, n, or tb1

  const legacyPattern = /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/
  const segwitPattern = /^bc1[a-z0-9]{39,59}$/
  const testnetPattern = /^(m|n|tb1)[a-zA-Z0-9]{25,62}$/

  return legacyPattern.test(address) || segwitPattern.test(address) || testnetPattern.test(address)
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { address, importType = "utxo" } = body

    if (!address) {
      return NextResponse.json({ error: "Bitcoin address is required" }, { status: 400 })
    }

    if (!isValidBitcoinAddress(address)) {
      console.log("[v0] Invalid Bitcoin address format:", address)
      return NextResponse.json(
        {
          error: "Invalid Bitcoin address format. Please enter a valid Bitcoin address (starting with 1, 3, or bc1)",
          success: false,
          imported: 0,
          failed: 1,
        },
        { status: 400 },
      )
    }

    console.log("[v0] Starting Bitcoin import for address:", address)

    // Fetch Bitcoin balance and transactions from blockchain.com API
    const balanceResponse = await fetch(`https://blockchain.info/balance?active=${address}`)
    if (!balanceResponse.ok) {
      console.log("[v0] Failed to fetch balance, status:", balanceResponse.status)
      throw new Error("Failed to fetch Bitcoin balance")
    }

    const balanceData = await balanceResponse.json()
    const addressData = balanceData[address]

    if (!addressData) {
      console.log("[v0] Address not found in response:", balanceData)
      throw new Error("Address not found")
    }

    // Convert satoshis to BTC
    const balanceBTC = addressData.final_balance / 100000000
    console.log("[v0] Bitcoin balance:", balanceBTC, "BTC")

    // Fetch current BTC price in USD
    let btcValue = 0
    try {
      btcValue = await fetchBitcoinAssetValue(address)
      console.log("[v0] Bitcoin value fetched:", btcValue, "USD")
    } catch (error) {
      console.log("[v0] Failed to fetch BTC value, using fallback")
      btcValue = balanceBTC * 50000 // Fallback to approximate value
    }

    // Fetch transaction history
    let txData: any = { n_tx: 0, txs: [] }
    try {
      const txResponse = await fetch(`https://blockchain.info/rawaddr/${address}?limit=10`)
      if (txResponse.ok) {
        txData = await txResponse.json()
        console.log("[v0] Fetched", txData.n_tx, "transactions")
      }
    } catch (error) {
      console.log("[v0] Failed to fetch transaction history:", error)
    }

    const assets = []

    const asset = {
      user_id: user.id,
      name: `Bitcoin Wallet`,
      description: `Bitcoin wallet ${address.substring(0, 8)}...${address.substring(address.length - 6)} with ${balanceBTC.toFixed(8)} BTC`,
      asset_type: "digital",
      current_value: btcValue,
      acquisition_date: new Date().toISOString(),
      metadata: {
        blockchain: "bitcoin",
        address: address,
        balance: balanceBTC,
        transactions: txData.n_tx || 0,
        received: (addressData.total_received || 0) / 100000000,
        sent: (addressData.total_sent || 0) / 100000000,
        explorer_url: `https://blockchain.com/btc/address/${address}`,
        import_type: importType,
      },
    }

    console.log("[v0] Inserting Bitcoin asset:", asset.name)

    const { data, error } = await supabase.from("assets").insert(asset).select().single()

    if (error) {
      console.error("[v0] Error inserting Bitcoin asset:", error)
      throw error
    }

    assets.push(data)
    console.log("[v0] Bitcoin import completed successfully:", assets.length, "assets imported")

    return NextResponse.json({
      success: true,
      imported: assets.length,
      failed: 0,
      assets,
    })
  } catch (error) {
    console.error("[v0] Bitcoin import error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        imported: 0,
        failed: 1,
      },
      { status: 500 },
    )
  }
}
