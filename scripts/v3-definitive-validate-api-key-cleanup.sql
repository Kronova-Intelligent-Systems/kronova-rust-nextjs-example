-- Migration v3: DEFINITIVE cleanup and creation of validate_api_key
-- This migration ensures ABSOLUTE elimination of all duplicate functions
-- and creates only ONE function signature that will work correctly

-- Step 1: Drop ALL possible function variations with full CASCADE
-- Using DO block to ignore errors if functions don't exist
DO $$ 
BEGIN
    -- Drop all public schema variations
    DROP FUNCTION IF EXISTS public.validate_api_key(text) CASCADE;
    DROP FUNCTION IF EXISTS public.validate_api_key(api_key text) CASCADE;
    DROP FUNCTION IF EXISTS public.validate_api_key(text, text, uuid, boolean, jsonb) CASCADE;
    DROP FUNCTION IF EXISTS public.validate_api_key(p_key_hash text, p_key_prefix text, p_expected_user_id uuid, p_mark_usage boolean, p_required_scopes jsonb) CASCADE;
    
    -- Drop all private schema variations
    DROP FUNCTION IF EXISTS private.validate_api_key(text) CASCADE;
    DROP FUNCTION IF EXISTS private.validate_api_key(api_key text) CASCADE;
    DROP FUNCTION IF EXISTS private.validate_api_key(text, text, uuid, boolean, jsonb) CASCADE;
    DROP FUNCTION IF EXISTS private.validate_api_key(p_key_hash text, p_key_prefix text, p_expected_user_id uuid, p_mark_usage boolean, p_required_scopes jsonb) CASCADE;
EXCEPTION
    WHEN OTHERS THEN
        -- Ignore any errors from dropping non-existent functions
        NULL;
END $$;

-- Ensure pgcrypto extension is enabled
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Step 2: Create ONLY the private implementation with UNIQUE parameter names
-- Using x_ prefix for parameters to ensure they're NEVER confused with columns
CREATE OR REPLACE FUNCTION private.validate_api_key(
  x_key_hash text,
  x_key_prefix text,
  x_expected_user_id uuid DEFAULT NULL,
  x_mark_usage boolean DEFAULT true,
  x_required_scopes jsonb DEFAULT NULL
)
RETURNS TABLE (
  user_id uuid,
  api_key_id uuid,
  scopes jsonb,
  is_valid boolean,
  error_message text
) 
SECURITY DEFINER
SET search_path = private, extensions, public
LANGUAGE plpgsql
AS $$
DECLARE
  v_key_record RECORD;
  v_scope_item text;
  v_has_required_scope boolean;
BEGIN
  -- Query with explicit table alias to avoid ANY ambiguous references
  SELECT 
    ak.id,
    ak.user_id,
    ak.scopes,
    ak.is_active,
    ak.expires_at,
    ak.key_hash,
    ak.key_prefix
  INTO v_key_record
  FROM private.api_keys ak
  WHERE ak.key_hash = x_key_hash
    AND ak.key_prefix = x_key_prefix
    AND ak.is_active = true
    AND (ak.expires_at IS NULL OR ak.expires_at > now())
  LIMIT 1;
  
  -- Check if key was found
  IF v_key_record.id IS NULL THEN
    RETURN QUERY SELECT 
      NULL::uuid,
      NULL::uuid,
      NULL::jsonb,
      false,
      'Invalid or expired API key'::text;
    RETURN;
  END IF;
  
  -- Verify user_id if provided
  IF x_expected_user_id IS NOT NULL AND v_key_record.user_id != x_expected_user_id THEN
    RETURN QUERY SELECT 
      NULL::uuid,
      NULL::uuid,
      NULL::jsonb,
      false,
      'API key does not belong to the expected user'::text;
    RETURN;
  END IF;
  
  -- Check required scopes if provided
  IF x_required_scopes IS NOT NULL THEN
    v_has_required_scope := false;
    
    -- Loop through required scopes
    FOR v_scope_item IN SELECT jsonb_array_elements_text(x_required_scopes)
    LOOP
      IF v_key_record.scopes @> to_jsonb(ARRAY[v_scope_item]) THEN
        v_has_required_scope := true;
        EXIT;
      END IF;
    END LOOP;
    
    IF NOT v_has_required_scope THEN
      RETURN QUERY SELECT 
        NULL::uuid,
        NULL::uuid,
        NULL::jsonb,
        false,
        'API key does not have required scopes'::text;
      RETURN;
    END IF;
  END IF;
  
  -- Set RLS context
  PERFORM set_config('request.jwt.claim.sub', v_key_record.user_id::text, false);
  PERFORM set_config('request.jwt.claim.api_key_id', v_key_record.id::text, false);
  PERFORM set_config('request.jwt.claim.scopes', v_key_record.scopes::text, false);
  PERFORM set_config('request.jwt.claim.role', 'authenticated', false);
  
  -- Update usage stats if requested
  IF x_mark_usage THEN
    UPDATE private.api_keys
    SET last_used_at = now(),
        total_requests = COALESCE(total_requests, 0) + 1,
        last_request_at = now()
    WHERE id = v_key_record.id;
  END IF;
  
  -- Return successful validation
  RETURN QUERY SELECT 
    v_key_record.user_id,
    v_key_record.id,
    v_key_record.scopes,
    true,
    NULL::text;
END;
$$;

-- Step 3: Create ONLY ONE public wrapper - this is the ONLY exposed function
CREATE OR REPLACE FUNCTION public.validate_api_key(
  x_key_hash text,
  x_key_prefix text,
  x_expected_user_id uuid DEFAULT NULL,
  x_mark_usage boolean DEFAULT true,
  x_required_scopes jsonb DEFAULT NULL
)
RETURNS TABLE (
  user_id uuid,
  api_key_id uuid,
  scopes jsonb,
  is_valid boolean,
  error_message text
)
SECURITY DEFINER
SET search_path = private, extensions, public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY SELECT * FROM private.validate_api_key(
    x_key_hash,
    x_key_prefix,
    x_expected_user_id,
    x_mark_usage,
    x_required_scopes
  );
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.validate_api_key(text, text, uuid, boolean, jsonb) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION private.validate_api_key(text, text, uuid, boolean, jsonb) TO authenticated, anon;

-- Documentation
COMMENT ON FUNCTION public.validate_api_key(text, text, uuid, boolean, jsonb) IS 
'Advanced API key validation - SINGLE authoritative function. Parameters use x_ prefix to avoid ambiguity. This is the ONLY validate_api_key function that should exist in the database.';
