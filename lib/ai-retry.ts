/**
 * Enterprise-grade retry utility for AI SDK calls
 * Handles transient errors (502, 503, 429) with exponential backoff
 */

export interface RetryConfig {
  maxRetries?: number
  initialDelayMs?: number
  maxDelayMs?: number
  backoffMultiplier?: number
  retryableStatusCodes?: number[]
}

const DEFAULT_CONFIG: Required<RetryConfig> = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 10000,
  backoffMultiplier: 2,
  retryableStatusCodes: [408, 429, 500, 502, 503, 504],
}

/**
 * Add jitter to prevent thundering herd
 */
function addJitter(delay: number): number {
  return delay + Math.random() * delay * 0.1 // Add 0-10% jitter
}

/**
 * Calculate exponential backoff delay
 */
function calculateDelay(attempt: number, config: Required<RetryConfig>): number {
  const delay = Math.min(config.initialDelayMs * Math.pow(config.backoffMultiplier, attempt - 1), config.maxDelayMs)
  return addJitter(delay)
}

/**
 * Check if error is retryable
 */
function isRetryableError(error: any, config: Required<RetryConfig>): boolean {
  // Check for network errors
  if (error.name === "AI_APICallError" || error.type === "AI_APICallError") {
    return true
  }

  // Check for specific status codes
  if (error.statusCode && config.retryableStatusCodes.includes(error.statusCode)) {
    return true
  }

  // Check for rate limit errors
  if (error.message?.includes("rate limit") || error.message?.includes("429")) {
    return true
  }

  // Check for Bad Gateway
  if (error.message?.includes("Bad Gateway") || error.message?.includes("502")) {
    return true
  }

  return false
}

/**
 * Retry wrapper for AI SDK generateText calls
 */
export async function retryGenerateText<T>(generateFn: () => Promise<T>, config: RetryConfig = {}): Promise<T> {
  const fullConfig = { ...DEFAULT_CONFIG, ...config }
  let lastError: any

  for (let attempt = 1; attempt <= fullConfig.maxRetries; attempt++) {
    try {
      console.log(`[v0] AI call attempt ${attempt}/${fullConfig.maxRetries}`)
      return await generateFn()
    } catch (error: any) {
      lastError = error
      console.error(`[v0] AI call attempt ${attempt} failed:`, error.message)

      // Don't retry if not a retryable error
      if (!isRetryableError(error, fullConfig)) {
        console.log("[v0] Error is not retryable, failing immediately")
        throw error
      }

      // Don't retry on last attempt
      if (attempt === fullConfig.maxRetries) {
        console.log("[v0] Max retries reached, failing")
        break
      }

      // Calculate delay and wait
      const delay = calculateDelay(attempt, fullConfig)
      console.log(`[v0] Retrying in ${delay}ms...`)
      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }

  throw lastError
}

/**
 * Retry wrapper for AI SDK generateObject calls
 */
export async function retryGenerateObject<T>(generateFn: () => Promise<T>, config: RetryConfig = {}): Promise<T> {
  return retryGenerateText(generateFn, config)
}
