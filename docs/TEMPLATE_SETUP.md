# Kronova Template Setup

This repository is a reference template. It contains no credentials. Configure environment variables in Vercel Project Settings or a local `.env.local` file.

## 1. Install and run

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

Never commit `.env.local` or any file containing real credentials.

## 2. Required Supabase setup

1. Create a Supabase project.
2. Copy the project URL to `NEXT_PUBLIC_SUPABASE_URL`.
3. Copy the browser-safe anon/publishable key to `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
4. Configure `SUPABASE_SERVICE_ROLE_KEY` and `SUPABASE_JWT_SECRET` only as server-side variables.
5. Set `NEXT_PUBLIC_SITE_URL` and `NEXT_PUBLIC_APP_URL` to the deployed app origin.
6. Add the app's `/auth/callback` route to the Supabase authentication redirect allow list.

Supabase RLS policies remain the authority for user data access. Do not replace the anon key with a service-role key in browser code.

## 3. Optional integrations

- **AI analytics:** set `OPENAI_API_KEY`. Keep it server-only.
- **Plaid:** set `PLAID_CLIENT_ID`, `PLAID_ENV`, and the matching environment secret (`PLAID_SANDBOX_SECRET` for sandbox or `PLAID_SECRET` for production). Add the exact OAuth redirect URI in Plaid when required.
- **Email:** set `RESEND_API_KEY` and verify the sending domain before enabling transactional mail.
- **Internal API/webhooks:** set `KRONOVA_API_KEY` and `KRONOVA_WEBHOOK_SECRET` only when using those protected routes.
- **Stripe:** set `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET`; validate prices server-side.
- **Blockchain imports:** set `ETHERSCAN_API_KEY` if those routes are enabled.

The integration status endpoint is available at `/api/system/integrations` and returns readiness booleans only. It never returns secret values.

## 4. Vercel deployment checklist

- Add variables separately for Development, Preview, and Production.
- Use different credentials for sandbox/preview and production where providers support it.
- Review `NEXT_PUBLIC_*` values: they are public and must not contain secrets.
- Rotate any credential that was ever committed or exposed.
- Confirm Supabase redirect URLs, Plaid redirect URIs, Resend domains, and Stripe webhooks match the deployed origin.
- Review the integration status endpoint after deployment.
