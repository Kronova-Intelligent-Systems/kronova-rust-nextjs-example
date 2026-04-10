import { createClient } from "@/lib/supabase/client"
import Papa from "papaparse"
import * as XLSX from "xlsx"

export interface ImportResult {
  success: boolean
  imported: number
  failed: number
  errors: Array<{ row: number; error: string }>
  assets?: any[]
}

export interface ImportOptions {
  userId: string
  validateOnly?: boolean
  skipDuplicates?: boolean
  updateExisting?: boolean
}

// CSV Import
export async function importFromCSV(file: File, options: ImportOptions): Promise<ImportResult> {
  return new Promise((resolve) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const importResult = await processImportData(results.data, options, "csv")
        resolve(importResult)
      },
      error: (error) => {
        resolve({
          success: false,
          imported: 0,
          failed: 0,
          errors: [{ row: 0, error: error.message }],
        })
      },
    })
  })
}

// Excel Import
export async function importFromExcel(file: File, options: ImportOptions): Promise<ImportResult> {
  try {
    const arrayBuffer = await file.arrayBuffer()
    const workbook = XLSX.read(arrayBuffer, { type: "array" })
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
    const data = XLSX.utils.sheet_to_json(firstSheet)

    return await processImportData(data, options, "excel")
  } catch (error) {
    return {
      success: false,
      imported: 0,
      failed: 0,
      errors: [
        {
          row: 0,
          error: error instanceof Error ? error.message : "Excel parsing failed",
        },
      ],
    }
  }
}

// JSON Import
export async function importFromJSON(file: File, options: ImportOptions): Promise<ImportResult> {
  try {
    const text = await file.text()
    const data = JSON.parse(text)
    const assets = Array.isArray(data) ? data : [data]

    return await processImportData(assets, options, "json")
  } catch (error) {
    return {
      success: false,
      imported: 0,
      failed: 0,
      errors: [
        {
          row: 0,
          error: error instanceof Error ? error.message : "JSON parsing failed",
        },
      ],
    }
  }
}

// Database Import
export async function importFromDatabase(
  connectionConfig: {
    type: "postgresql" | "mysql" | "mongodb"
    host: string
    port: number
    database: string
    username: string
    password: string
    query: string
  },
  options: ImportOptions,
): Promise<ImportResult> {
  try {
    // Recommend using CSV/JSON export or API integration instead
    return {
      success: false,
      imported: 0,
      failed: 0,
      errors: [
        {
          row: 0,
          error:
            "Direct database connections are not supported in serverless environments. Please export your data to CSV/JSON format or use the API import method.",
        },
      ],
    }
  } catch (error) {
    return {
      success: false,
      imported: 0,
      failed: 0,
      errors: [
        {
          row: 0,
          error: error instanceof Error ? error.message : "Database import failed",
        },
      ],
    }
  }
}

// API Import
export async function importFromAPI(
  apiConfig: {
    url: string
    method: "GET" | "POST"
    headers?: Record<string, string>
    body?: any
    authType?: "none" | "bearer" | "apikey" | "basic"
    authToken?: string
    dataPath?: string // JSONPath to extract data from response
  },
  options: ImportOptions,
): Promise<ImportResult> {
  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...apiConfig.headers,
    }

    // Add authentication
    if (apiConfig.authType === "bearer" && apiConfig.authToken) {
      headers["Authorization"] = `Bearer ${apiConfig.authToken}`
    } else if (apiConfig.authType === "apikey" && apiConfig.authToken) {
      headers["X-API-Key"] = apiConfig.authToken
    } else if (apiConfig.authType === "basic" && apiConfig.authToken) {
      headers["Authorization"] = `Basic ${apiConfig.authToken}`
    }

    const response = await fetch(apiConfig.url, {
      method: apiConfig.method,
      headers,
      body: apiConfig.body ? JSON.stringify(apiConfig.body) : undefined,
    })

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`)
    }

    let data = await response.json()

    // Extract data using JSONPath if provided
    if (apiConfig.dataPath) {
      data = extractDataFromPath(data, apiConfig.dataPath)
    }

    const assets = Array.isArray(data) ? data : [data]
    return await processImportData(assets, options, "api")
  } catch (error) {
    return {
      success: false,
      imported: 0,
      failed: 0,
      errors: [
        {
          row: 0,
          error: error instanceof Error ? error.message : "API import failed",
        },
      ],
    }
  }
}

// Process and validate import data
async function processImportData(data: any[], options: ImportOptions, source: string): Promise<ImportResult> {
  const supabase = createClient()
  const errors: Array<{ row: number; error: string }> = []
  const validAssets: any[] = []
  let imported = 0
  let failed = 0

  // Validate and transform each row
  for (let i = 0; i < data.length; i++) {
    const row = data[i]
    const validation = validateAssetData(row, i + 1)

    if (!validation.valid) {
      errors.push({ row: i + 1, error: validation.error || "Invalid data" })
      failed++
      continue
    }

    const transformedAsset = transformAssetData(row, options.userId, source)
    validAssets.push(transformedAsset)
  }

  // If validation only, return results without importing
  if (options.validateOnly) {
    return {
      success: errors.length === 0,
      imported: 0,
      failed: errors.length,
      errors,
      assets: validAssets,
    }
  }

  // Check for duplicates if needed
  if (options.skipDuplicates || options.updateExisting) {
    const assetIds = validAssets.map((a) => a.asset_id)
    const { data: existing } = await supabase
      .from("assets")
      .select("asset_id")
      .in("asset_id", assetIds)
      .eq("user_id", options.userId)

    const existingIds = new Set(existing?.map((a) => a.asset_id) || [])

    if (options.skipDuplicates) {
      validAssets.forEach((asset, idx) => {
        if (existingIds.has(asset.asset_id)) {
          errors.push({
            row: idx + 1,
            error: `Asset ID ${asset.asset_id} already exists`,
          })
          failed++
        }
      })
    }
  }

  // Import assets in batches
  const batchSize = 100
  for (let i = 0; i < validAssets.length; i += batchSize) {
    const batch = validAssets.slice(i, i + batchSize)

    try {
      if (options.updateExisting) {
        // Upsert assets
        const { error } = await supabase.from("assets").upsert(batch, {
          onConflict: "asset_id,user_id",
        })

        if (error) throw error
      } else {
        // Insert new assets only
        const { error } = await supabase.from("assets").insert(batch)

        if (error) throw error
      }

      imported += batch.length
    } catch (error) {
      batch.forEach((_, idx) => {
        errors.push({
          row: i + idx + 1,
          error: error instanceof Error ? error.message : "Import failed",
        })
        failed++
      })
    }
  }

  return {
    success: failed === 0,
    imported,
    failed,
    errors,
    assets: validAssets,
  }
}

// Validate asset data
function validateAssetData(data: any, row: number): { valid: boolean; error?: string } {
  if (!data.name || typeof data.name !== "string") {
    return { valid: false, error: "Asset name is required" }
  }

  if (!data.asset_id || typeof data.asset_id !== "string") {
    return { valid: false, error: "Asset ID is required" }
  }

  if (!data.asset_type || typeof data.asset_type !== "string") {
    return { valid: false, error: "Asset type is required" }
  }

  const validStatuses = ["active", "inactive", "maintenance", "retired"]
  if (data.status && !validStatuses.includes(data.status)) {
    return { valid: false, error: "Invalid asset status" }
  }

  return { valid: true }
}

// Transform asset data to match database schema
function transformAssetData(data: any, userId: string, source: string): any {
  const now = new Date().toISOString()

  return {
    asset_id: data.asset_id || data.assetId || data.id,
    name: data.name,
    asset_type: data.asset_type || data.assetType || data.type,
    category: data.category || null,
    description: data.description || null,
    status: data.status || "active",
    purchase_cost: Number.parseFloat(data.purchase_cost || data.purchaseCost || 0) || null,
    current_value: Number.parseFloat(data.current_value || data.currentValue || 0) || null,
    purchase_date: data.purchase_date || data.purchaseDate || null,
    depreciation_rate: Number.parseFloat(data.depreciation_rate || data.depreciationRate || 0) || null,
    specifications: data.specifications || data.specs || null,
    current_location: data.current_location || data.location || null,
    iot_sensor_id: data.iot_sensor_id || data.sensorId || null,
    nfc_tag_id: data.nfc_tag_id || data.nfcTag || null,
    qr_code: data.qr_code || data.qrCode || null,
    risk_score: Number.parseFloat(data.risk_score || data.riskScore || 0) || null,
    metadata: {
      ...data.metadata,
      import_source: source,
      imported_at: now,
    },
    user_id: userId,
    created_at: now,
    updated_at: now,
  }
}

// Extract data from nested JSON using simple path notation
function extractDataFromPath(data: any, path: string): any {
  const parts = path.split(".")
  let current = data

  for (const part of parts) {
    if (current && typeof current === "object" && part in current) {
      current = current[part]
    } else {
      return data // Return original if path not found
    }
  }

  return current
}
