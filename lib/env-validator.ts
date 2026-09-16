type IntegrationName = "supabase" | "plaid" | "ai" | "email" | "stripe" | "blockchain"

const warnedIntegrations = new Set<IntegrationName>()

function hasValue(name: string) {
  return Boolean(process.env[name]?.trim())
}

function warnOnce(integration: IntegrationName, message: string) {
  if (warnedIntegrations.has(integration)) return
  warnedIntegrations.add(integration)
  console.warn(`[env] ${message}`)
}

export function validateServerEnvironment() {
  const required = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY"]
  const missing = required.filter((name) => !hasValue(name))

  if (missing.length > 0 && process.env.NODE_ENV === "production") {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`)
  }

  if (missing.length > 0) {
    console.warn(`[env] Missing required variables: ${missing.join(", ")}. Supabase features are disabled.`)
  }

  if (!hasValue("OPENAI_API_KEY")) warnOnce("ai", "OPENAI_API_KEY is not configured; AI analytics are disabled.")
  if (!hasValue("RESEND_API_KEY")) warnOnce("email", "RESEND_API_KEY is not configured; email delivery is disabled.")
  if (!hasValue("ETHERSCAN_API_KEY")) warnOnce("blockchain", "ETHERSCAN_API_KEY is not configured; blockchain imports are disabled.")
  if (!hasValue("STRIPE_SECRET_KEY")) warnOnce("stripe", "STRIPE_SECRET_KEY is not configured; billing is disabled.")

  const plaidReady = hasValue("PLAID_CLIENT_ID") && (hasValue("PLAID_SANDBOX_SECRET") || hasValue("PLAID_SECRET"))
  if (!plaidReady) warnOnce("plaid", "Plaid credentials are not configured; bank connections are disabled.")

  return {
    supabase: missing.length === 0,
    plaid: plaidReady,
    ai: hasValue("OPENAI_API_KEY"),
    email: hasValue("RESEND_API_KEY"),
    stripe: hasValue("STRIPE_SECRET_KEY"),
    blockchain: hasValue("ETHERSCAN_API_KEY"),
  }
}

export function getIntegrationStatus() {
  return validateServerEnvironment()
}
