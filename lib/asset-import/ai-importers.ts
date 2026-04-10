import { createClient } from "@/lib/supabase/client"
import { generateText } from "ai"

export interface AIImportResult {
  success: boolean
  imported: number
  failed: number
  errors: Array<{ row: number; error: string }>
  assets?: any[]
  insights?: string[]
}

// Vector Database Import (Pinecone, Weaviate, Qdrant)
export async function importFromVectorDB(
  config: {
    provider: "pinecone" | "weaviate" | "qdrant"
    apiKey: string
    endpoint: string
    index: string
    namespace?: string
    filter?: Record<string, any>
    limit?: number
  },
  options: { userId: string },
): Promise<AIImportResult> {
  try {
    const response = await fetch("/api/asset-import/vector-db", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ config, options }),
    })

    if (!response.ok) {
      throw new Error("Vector DB import failed")
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
          error: error instanceof Error ? error.message : "Vector DB import failed",
        },
      ],
    }
  }
}

// AI-Powered Document Extraction
export async function importFromDocuments(
  files: File[],
  options: {
    userId: string
    extractionPrompt?: string
    aiModel?: string
  },
): Promise<AIImportResult> {
  const supabase = createClient()
  const errors: Array<{ row: number; error: string }> = []
  const assets: any[] = []
  const insights: string[] = []
  let imported = 0
  let failed = 0

  for (let i = 0; i < files.length; i++) {
    const file = files[i]

    try {
      // Extract text from document
      const text = await extractTextFromFile(file)

      // Use AI to extract structured asset data
      const extractionPrompt =
        options.extractionPrompt ||
        `Extract asset information from the following text and return a JSON array of assets. Each asset should have: asset_id, name, asset_type, description, current_value, status, and any other relevant fields.

Text:
${text}

Return only valid JSON array, no additional text.`

      const { text: aiResponse } = await generateText({
        model: options.aiModel || "openai/gpt-4o-mini",
        prompt: extractionPrompt,
      })

      // Parse AI response
      const extractedAssets = parseAIResponse(aiResponse)

      for (const asset of extractedAssets) {
        const transformedAsset = {
          ...asset,
          user_id: options.userId,
          metadata: {
            ...asset.metadata,
            import_source: "ai_document",
            source_file: file.name,
            extracted_at: new Date().toISOString(),
          },
        }

        const { error } = await supabase.from("assets").insert(transformedAsset)

        if (error) {
          errors.push({
            row: i + 1,
            error: error.message,
          })
          failed++
        } else {
          assets.push(transformedAsset)
          imported++
        }
      }

      insights.push(`Extracted ${extractedAssets.length} assets from ${file.name}`)
    } catch (error) {
      errors.push({
        row: i + 1,
        error: error instanceof Error ? error.message : "Document extraction failed",
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
    insights,
  }
}

// AI-Powered Image Recognition for Asset Import
export async function importFromImages(
  images: File[],
  options: {
    userId: string
    recognitionPrompt?: string
    aiModel?: string
  },
): Promise<AIImportResult> {
  const supabase = createClient()
  const errors: Array<{ row: number; error: string }> = []
  const assets: any[] = []
  const insights: string[] = []
  let imported = 0
  let failed = 0

  for (let i = 0; i < images.length; i++) {
    const image = images[i]

    try {
      // Convert image to base64
      const base64Image = await fileToBase64(image)

      // Use AI vision model to extract asset information
      const recognitionPrompt =
        options.recognitionPrompt ||
        `Analyze this image and extract asset information. Identify the asset type, condition, any visible identifiers (serial numbers, labels), and estimate its value if possible. Return the information as a JSON object with fields: name, asset_type, description, status, estimated_value, visible_identifiers.`

      const { text: aiResponse } = await generateText({
        model: options.aiModel || "openai/gpt-4o",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: recognitionPrompt },
              {
                type: "image",
                image: base64Image,
              },
            ],
          },
        ],
      })

      // Parse AI response
      const assetData = parseAIResponse(aiResponse)[0]

      if (assetData) {
        const transformedAsset = {
          asset_id: `IMG-${Date.now()}-${i}`,
          ...assetData,
          user_id: options.userId,
          metadata: {
            ...assetData.metadata,
            import_source: "ai_image",
            source_image: image.name,
            recognized_at: new Date().toISOString(),
          },
        }

        const { error } = await supabase.from("assets").insert(transformedAsset)

        if (error) {
          errors.push({
            row: i + 1,
            error: error.message,
          })
          failed++
        } else {
          assets.push(transformedAsset)
          imported++
        }
      }

      insights.push(`Recognized asset from ${image.name}`)
    } catch (error) {
      errors.push({
        row: i + 1,
        error: error instanceof Error ? error.message : "Image recognition failed",
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
    insights,
  }
}

// AI-Powered Data Enrichment
export async function enrichAssetData(
  assetId: string,
  options: {
    enrichmentType: "market_value" | "specifications" | "maintenance" | "risk_assessment" | "all"
    aiModel?: string
  },
): Promise<{ success: boolean; enrichedData: any; insights: string[] }> {
  const supabase = createClient()

  try {
    // Get asset data
    const { data: asset, error } = await supabase.from("assets").select("*").eq("id", assetId).single()

    if (error || !asset) {
      throw new Error("Asset not found")
    }

    const enrichmentPrompts: Record<string, string> = {
      market_value: `Based on this asset information, estimate the current market value and provide depreciation insights: ${JSON.stringify(asset)}`,
      specifications: `Provide detailed technical specifications for this asset type: ${asset.asset_type} - ${asset.name}`,
      maintenance: `Generate a comprehensive maintenance schedule and recommendations for: ${asset.asset_type} - ${asset.name}`,
      risk_assessment: `Assess the risk factors and provide a risk score (0-10) for this asset: ${JSON.stringify(asset)}`,
    }

    const insights: string[] = []
    const enrichedData: any = {}

    const typesToEnrich = options.enrichmentType === "all" ? Object.keys(enrichmentPrompts) : [options.enrichmentType]

    for (const type of typesToEnrich) {
      const { text: aiResponse } = await generateText({
        model: options.aiModel || "openai/gpt-4o-mini",
        prompt: enrichmentPrompts[type],
      })

      enrichedData[type] = aiResponse
      insights.push(`Enriched ${type} data using AI`)
    }

    // Update asset with enriched data
    const updateData: any = {
      metadata: {
        ...asset.metadata,
        ai_enrichment: enrichedData,
        enriched_at: new Date().toISOString(),
      },
    }

    if (enrichedData.market_value) {
      // Extract value from AI response
      const valueMatch = enrichedData.market_value.match(/\$?([\d,]+\.?\d*)/)
      if (valueMatch) {
        updateData.current_value = Number.parseFloat(valueMatch[1].replace(/,/g, ""))
      }
    }

    if (enrichedData.risk_assessment) {
      // Extract risk score from AI response
      const riskMatch = enrichedData.risk_assessment.match(/(\d+\.?\d*)\s*\/\s*10/)
      if (riskMatch) {
        updateData.risk_score = Number.parseFloat(riskMatch[1])
      }
    }

    await supabase.from("assets").update(updateData).eq("id", assetId)

    return {
      success: true,
      enrichedData,
      insights,
    }
  } catch (error) {
    return {
      success: false,
      enrichedData: {},
      insights: [error instanceof Error ? error.message : "Enrichment failed"],
    }
  }
}

// Helper functions
async function extractTextFromFile(file: File): Promise<string> {
  const fileType = file.type

  if (fileType === "text/plain") {
    return await file.text()
  }

  if (fileType === "application/pdf") {
    // Use PDF.js or similar library
    // For now, return placeholder
    return "PDF text extraction not implemented"
  }

  if (fileType.includes("word") || fileType.includes("document")) {
    // Use mammoth.js or similar library
    return "Word document extraction not implemented"
  }

  return await file.text()
}

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const base64 = reader.result as string
      resolve(base64)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function parseAIResponse(response: string): any[] {
  try {
    // Try to extract JSON from response
    const jsonMatch = response.match(/\[[\s\S]*\]|\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      return Array.isArray(parsed) ? parsed : [parsed]
    }
    return []
  } catch (error) {
    console.error("[v0] Failed to parse AI response:", error)
    return []
  }
}
