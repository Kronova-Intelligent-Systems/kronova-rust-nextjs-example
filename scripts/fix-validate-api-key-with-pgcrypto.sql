-- Migration: Fix validate_api_key to properly use pgcrypto extension
-- This ensures the digest function is available and properly typed

-- First ensure pgcrypto extension is enabled
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Drop existing functions to avoid conflicts
DROP FUNCTION IF EXISTS public.validate_api_key(text);
DROP FUNCTION IF EXISTS private.validate_api_key(text);

-- Recreate private.validate_api_key with proper extension usage
CREATE OR REPLACE FUNCTION private.validate_api_key(api_key text)
RETURNS TABLE (
  user_id uuid,
  api_key_id uuid,
  scopes jsonb,
  valid boolean
) 
SECURITY DEFINER
-- Set search_path to ensure pgcrypto functions are accessible
SET search_path = private, extensions, public
LANGUAGE plpgsql
AS $$
DECLARE
  key_record private.api_keys;
  key_hash_to_check text;
BEGIN
  -- Hash the provided key using SHA-256 with explicit cast
  -- Note: 'sha256'::text ensures proper type resolution
  key_hash_to_check := encode(digest(api_key::bytea, 'sha256'::text), 'hex');
  
  -- Look up the key by hash
  SELECT * INTO key_record
  FROM private.api_keys
  WHERE key_hash = key_hash_to_check
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > now())
  LIMIT 1;
  
  IF key_record IS NOT NULL THEN
    -- Set RLS context for the user
    PERFORM set_config('request.jwt.claim.sub', key_record.user_id::text, false);
    PERFORM set_config('request.jwt.claim.api_key_id', key_record.id::text, false);
    PERFORM set_config('request.jwt.claim.scopes', key_record.scopes::text, false);
    PERFORM set_config('request.jwt.claim.role', 'authenticated', false);
    
    -- Update last_used_at timestamp
    UPDATE private.api_keys
    SET last_used_at = now(),
        total_requests = COALESCE(total_requests, 0) + 1,
        last_request_at = now()
    WHERE id = key_record.id;
    
    -- Return validation result
    RETURN QUERY SELECT 
      key_record.user_id,
      key_record.id,
      key_record.scopes,
      true;
  ELSE
    -- Invalid key
    RETURN QUERY SELECT 
      NULL::uuid,
      NULL::uuid,
      NULL::jsonb,
      false;
  END IF;
END;
$$;

-- Create public wrapper function that calls the private implementation
CREATE OR REPLACE FUNCTION public.validate_api_key(api_key text)
RETURNS TABLE (
  user_id uuid,
  api_key_id uuid,
  scopes jsonb,
  valid boolean
)
SECURITY DEFINER
SET search_path = private, extensions, public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Delegate to private schema function
  RETURN QUERY SELECT * FROM private.validate_api_key(api_key);
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.validate_api_key(text) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION private.validate_api_key(text) TO authenticated, anon;

-- Add helpful comments
COMMENT ON FUNCTION public.validate_api_key IS 
'Public wrapper for API key validation. Validates an API key and sets RLS context for authenticated requests.';

COMMENT ON FUNCTION private.validate_api_key IS 
'Private implementation of API key validation. Uses pgcrypto extension for SHA-256 hashing. Sets RLS context and tracks usage metrics.';
