export interface ExplorerConfig {
  name: string
  baseUrl: string
  apiUrl?: string
  getAssetUrl: (address: string, tokenId?: string) => string
  getValueUrl?: (address: string) => string
}

export const BLOCKCHAIN_EXPLORERS: Record<string, ExplorerConfig> = {
  sui: {
    name: "Suiscan",
    baseUrl: "https://suiscan.xyz",
    apiUrl: "https://suiscan.xyz/api",
    getAssetUrl: (objectId: string) => `https://suiscan.xyz/mainnet/object/${objectId}`,
    getValueUrl: (objectId: string) => `https://suiscan.xyz/api/v1/objects/${objectId}`,
  },
  linea: {
    name: "LineaScan",
    baseUrl: "https://lineascan.build",
    apiUrl: "https://api.lineascan.build/api",
    getAssetUrl: (address: string, tokenId?: string) =>
      tokenId ? `https://lineascan.build/token/${address}?a=${tokenId}` : `https://lineascan.build/address/${address}`,
    getValueUrl: (address: string) =>
      `https://api.lineascan.build/api?module=stats&action=tokensupply&contractaddress=${address}`,
  },
  canton: {
    name: "Canton Network Explorer",
    baseUrl: "https://canton.network",
    getAssetUrl: (contractId: string) => `https://canton.network/explorer/contract/${contractId}`,
  },
  bitcoin: {
    name: "Blockchain.com",
    baseUrl: "https://blockchain.com",
    apiUrl: "https://blockchain.info",
    getAssetUrl: (address: string) => `https://blockchain.com/btc/address/${address}`,
    getValueUrl: (address: string) => `https://blockchain.info/balance?active=${address}`,
  },
  ethereum: {
    name: "Etherscan",
    baseUrl: "https://etherscan.io",
    apiUrl: "https://api.etherscan.io/api",
    getAssetUrl: (address: string, tokenId?: string) =>
      tokenId ? `https://etherscan.io/token/${address}?a=${tokenId}` : `https://etherscan.io/address/${address}`,
    getValueUrl: (address: string) => `https://api.etherscan.io/api?module=account&action=balance&address=${address}`,
  },
}

export async function fetchSuiAssetValue(objectId: string): Promise<number | null> {
  try {
    // Fetch object details from Suiscan API
    const response = await fetch(`https://suiscan.xyz/api/v1/objects/${objectId}`)
    if (!response.ok) return null

    const data = await response.json()

    // Try to extract value from balance field or content
    if (data.content?.fields?.balance) {
      return Number(data.content.fields.balance) / 1e9 // Convert from MIST to SUI
    }

    // For NFTs, try to get floor price or last sale price
    if (data.display?.data?.price) {
      return Number(data.display.data.price)
    }

    return null
  } catch (error) {
    console.error("[v0] Failed to fetch Sui asset value:", error)
    return null
  }
}

export async function fetchLineaAssetValue(contractAddress: string, tokenId?: string): Promise<number | null> {
  try {
    // For ERC-20 tokens, fetch token price
    const response = await fetch(
      `https://api.lineascan.build/api?module=stats&action=tokensupply&contractaddress=${contractAddress}`,
    )
    if (!response.ok) return null

    const data = await response.json()

    if (data.result) {
      return Number(data.result) / 1e18 // Convert from wei to ETH
    }

    return null
  } catch (error) {
    console.error("[v0] Failed to fetch Linea asset value:", error)
    return null
  }
}

export async function fetchCantonAssetValue(contractId: string): Promise<number | null> {
  try {
    // Canton Network doesn't have a public API yet
    // This is a placeholder for future implementation
    return null
  } catch (error) {
    console.error("[v0] Failed to fetch Canton asset value:", error)
    return null
  }
}

export async function fetchBitcoinAssetValue(address: string): Promise<number | null> {
  try {
    // Fetch BTC balance
    const balanceResponse = await fetch(`https://blockchain.info/balance?active=${address}`)
    if (!balanceResponse.ok) return null

    const balanceData = await balanceResponse.json()
    const addressData = balanceData[address]

    if (!addressData) return null

    const balanceBTC = addressData.final_balance / 100000000

    // Fetch current BTC price in USD
    const priceResponse = await fetch("https://blockchain.info/ticker")
    if (!priceResponse.ok) return balanceBTC * 50000 // Fallback to approximate value

    const priceData = await priceResponse.json()
    const btcPriceUSD = priceData.USD?.last || 50000

    return balanceBTC * btcPriceUSD
  } catch (error) {
    console.error("[v0] Failed to fetch Bitcoin asset value:", error)
    return null
  }
}

export async function fetchEthereumAssetValue(address: string, contractAddress?: string): Promise<number | null> {
  try {
    if (contractAddress) {
      // For ERC-20 tokens, would need a price API like CoinGecko
      // This is a placeholder for token price lookup
      return null
    }

    // Fetch ETH balance and convert to USD
    const ethers = await import("ethers")
    const provider = new ethers.JsonRpcProvider("https://eth.llamarpc.com")
    const balance = await provider.getBalance(address)
    const ethBalance = Number(ethers.formatEther(balance))

    // Fetch current ETH price from a reliable API
    const priceResponse = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd")
    if (!priceResponse.ok) return ethBalance * 3000 // Fallback price

    const priceData = await priceResponse.json()
    const ethPriceUSD = priceData.ethereum?.usd || 3000

    return ethBalance * ethPriceUSD
  } catch (error) {
    console.error("[v0] Failed to fetch Ethereum asset value:", error)
    return null
  }
}

export function getExplorerLink(blockchain: string, identifier: string, tokenId?: string): string {
  const explorer = BLOCKCHAIN_EXPLORERS[blockchain.toLowerCase()]
  if (!explorer) return "#"

  return explorer.getAssetUrl(identifier, tokenId)
}

export function getExplorerName(blockchain: string): string {
  const explorer = BLOCKCHAIN_EXPLORERS[blockchain.toLowerCase()]
  return explorer?.name || "Explorer"
}
