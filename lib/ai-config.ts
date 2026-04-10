"use server"

/**
 * Get the configured AI model for analytics
 * Uses Vercel AI Gateway with the model string format
 *
 * To bypass rate limits, add credits to your Vercel account at:
 * https://vercel.com/[team]/~/ai?modal=top-up
 */
export async function getAIModel(modelName = "gpt-4o-mini") {
  // This works reliably with Vercel's infrastructure
  return `openai/${modelName}`
}
