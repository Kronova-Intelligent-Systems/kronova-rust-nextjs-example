-- Migration: Add environment variable documentation for Stripe and Plaid
-- This is a reference file documenting required environment variables

/*
STRIPE ENVIRONMENT VARIABLES (Required for Stripe integration):
- STRIPE_SECRET_KEY: Your Stripe secret key (starts with sk_test_ or sk_live_)
- STRIPE_PUBLISHABLE_KEY: Your Stripe publishable key (starts with pk_test_ or pk_live_)
- NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: Public Stripe key for client-side usage
- STRIPE_WEBHOOK_SECRET: Webhook signing secret (starts with whsec_)

PLAID ENVIRONMENT VARIABLES (Required for Plaid integration):
- PLAID_CLIENT_ID: Your Plaid client ID
- PLAID_SECRET: Your Plaid secret key
- PLAID_ENV: Plaid environment (sandbox, development, or production)

HOW TO ADD THESE TO YOUR PROJECT:
1. In Vercel Dashboard: Settings > Environment Variables
2. Add each variable with the appropriate value
3. Restart your deployment for changes to take effect

HOW TO GET THESE VALUES:
- Stripe: https://dashboard.stripe.com/apikeys
- Stripe Webhooks: https://dashboard.stripe.com/webhooks
- Plaid: https://dashboard.plaid.com/developers/keys
*/

-- This table stores webhook event logs for debugging
CREATE TABLE IF NOT EXISTS public.stripe_webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT NOT NULL UNIQUE,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  processed BOOLEAN DEFAULT FALSE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index for querying webhook logs
CREATE INDEX IF NOT EXISTS idx_stripe_webhook_logs_event_type ON public.stripe_webhook_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_stripe_webhook_logs_created_at ON public.stripe_webhook_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stripe_webhook_logs_processed ON public.stripe_webhook_logs(processed);

COMMENT ON TABLE public.stripe_webhook_logs IS 'Logs all Stripe webhook events for debugging and audit purposes';
