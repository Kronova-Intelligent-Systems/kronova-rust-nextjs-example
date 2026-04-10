# Supabase API Key Migration Guide

## Overview

Supabase has introduced new API key formats to improve security and developer experience. This guide explains how to migrate from legacy JWT-based keys to the new publishable and secret keys.

## Key Changes

### Legacy Keys (JWT-based) ❌ Deprecated
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - JWT format, 10-year expiry
- `SUPABASE_SERVICE_ROLE_KEY` - JWT format, full database access

### New Keys (Recommended) ✅
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` - Format: `sb_publishable_...`
- `SUPABASE_SECRET_KEY` - Format: `sb_secret_...`

## Why Migrate?

The new key system provides several advantages:

1. **Independent Rotation** - Rotate keys without downtime or JWT secret changes
2. **Better Security** - Secret keys actively prevent browser usage (HTTP 401)
3. **Flexible Management** - Create multiple keys per environment
4. **Easy Rollback** - Delete and recreate keys without affecting JWT secret
5. **Mobile-Friendly** - No forced app updates when rotating keys

## Migration Steps

### 1. Obtain New Keys

1. Open your Supabase project dashboard
2. Navigate to **Settings** → **API Keys**
3. Click **Create new API Keys** (if no publishable key exists)
4. Copy your new keys:
   - **Publishable key** (starts with `sb_publishable_`)
   - **Secret key** (starts with `sb_secret_`)

### 2. Update Environment Variables

The Kronova codebase now supports **both** legacy and new keys for zero-downtime migration:

#### Option A: Use New Keys Only (Recommended)
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
SUPABASE_SECRET_KEY=sb_secret_...
```

#### Option B: Dual Mode (Transition Period)
Keep both sets active during migration:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co

# New keys (preferred)
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
SUPABASE_SECRET_KEY=sb_secret_...

# Legacy keys (fallback)
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 3. Deploy and Test

1. Deploy your application with new environment variables
2. Test all authentication flows:
   - User login/signup
   - Password reset
   - Session management
3. Verify API routes work correctly
4. Check admin/service operations

### 4. Monitor Legacy Key Usage

In the Supabase dashboard:
1. Go to **Settings** → **API Keys** → **Legacy API Keys** tab
2. Check the "Last Used" indicator for `anon` and `service_role` keys
3. Once inactive for sufficient time, you can deactivate them

### 5. Deactivate Legacy Keys (Optional)

After confirming all services use new keys:
1. In the Legacy API Keys tab, click **Deactivate** on old keys
2. You can re-activate them if issues arise
3. Consider keeping them deactivated but not deleted for emergency rollback

## Code Changes

Kronova automatically detects and prefers new keys. No code changes required!

The client initialization checks for keys in this order:
1. `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (new)
2. `NEXT_PUBLIC_SUPABASE_ANON_KEY` (legacy fallback)

Service role client checks:
1. `SUPABASE_SECRET_KEY` (new)
2. `SUPABASE_SERVICE_ROLE_KEY` (legacy fallback)

## Affected Components

The following files have been updated to support both key types:

- `lib/supabase/client.ts` - Browser client
- `lib/supabase/server.ts` - Server client & service role
- `middleware.ts` - Authentication middleware

## Vercel Deployment

### Update Environment Variables

1. Go to your Vercel project settings
2. Navigate to **Environment Variables**
3. Add new variables for all environments (Production, Preview, Development):
   ```
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
   SUPABASE_SECRET_KEY
   ```
4. Redeploy your application

### Zero-Downtime Migration

1. Add **new** variables alongside existing ones
2. Deploy
3. Verify everything works
4. Remove **old** variables when ready

## Troubleshooting

### "Supabase environment variables not configured"
**Solution:** Ensure you've set either new or legacy keys. New keys are preferred.

### HTTP 401 Unauthorized with secret key
**Solution:** Secret keys cannot be used in browsers. Only use in server-side code (API routes, server components, Edge Functions).

### Legacy keys still being used
**Solution:** Ensure new keys are set. The code prioritizes new keys over legacy.

### Need to rotate a compromised secret key
**Solution:** In Supabase dashboard → API Keys, create a new secret key, update your environment variables, then delete the old one. This is instant with no downtime.

## Security Best Practices

### Publishable Keys
✅ **Safe to expose:**
- Web pages (bundled in source code)
- Mobile/desktop apps
- GitHub Actions workflows
- CLI tools

### Secret Keys
❌ **Never expose:**
- Client-side JavaScript
- Git repositories
- URLs or query parameters
- Insecure logs
- Public environments

✅ **Use only in:**
- API routes (Next.js `/app/api/*`)
- Server Components
- Edge Functions
- Secure backend services

## Resources

- [Supabase API Keys Documentation](https://supabase.com/docs/guides/api/api-keys)
- [API Key Change Announcement](https://github.com/orgs/supabase/discussions/29260)
- [Kronova Environment Variables](/docs/ENV_VARIABLES.md)

## Support

If you encounter issues during migration:
1. Check the [Troubleshooting](#troubleshooting) section
2. Review Supabase dashboard for key status
3. Contact Kronova support with migration logs
