"use server"

import { openai } from "@ai-sdk/openai"

/**
 * Returns a typed AI SDK v4 model object for use with generateText / generateObject.
 * AI SDK v4 requires a provider model instance — plain strings ("openai/gpt-4o-mini")
 * are a v5/AI Gateway pattern and cause AI_UnsupportedModelVersionError at runtime.
 */
export async function getAIModel(modelName = "gpt-4o-mini") {
  return openai(modelName)
}
