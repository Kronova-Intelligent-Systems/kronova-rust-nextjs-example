-- Migration: Create advanced validate_api_key function with hash-based validation
-- Enterprise-grade security: Uses private schema with public wrapper pattern
-- Fixed: Ensures only ONE function signature exists to prevent ambiguity

-- Ensure pgcrypto extension is enabled
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Drop ALL existing functions in both schemas with all possible signatures
-- This ensures we start completely clean
DROP FUNCTION IF EXISTS public.validate_api_key(text) CASCADE;
DROP FUNCTION IF EXISTS public.validate_api_key(text, text, uuid, boolean, jsonb) CASCADE;
DROP FUNCTION IF EXISTS private.validate_api_key(text) CASCADE;
DROP FUNCTION IF EXISTS private.validate_api_key(text, text, uuid, boolean, jsonb) CASCADE;

-- Create ONLY ONE private implementation with specific parameter names
CREATE OR REPLACE FUNCTION private.validate_api_key(
  p_key_hash text,
  p_key_prefix text,
  p_expected_user_id uuid DEFAULT NULL,
  p_mark_usage boolean DEFAULT true,
  p_required_scopes jsonb DEFAULT NULL
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
  -- Query with explicit table alias to avoid ambiguous column references
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
  WHERE ak.key_hash = p_key_hash
    AND ak.key_prefix = p_key_prefix
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
  IF p_expected_user_id IS NOT NULL AND v_key_record.user_id != p_expected_user_id THEN
    RETURN QUERY SELECT 
      NULL::uuid,
      NULL::uuid,
      NULL::jsonb,
      false,
      'API key does not belong to the expected user'::text;
    RETURN;
  END IF;
  
  -- Check required scopes if provided
  IF p_required_scopes IS NOT NULL THEN
    v_has_required_scope := false;
    
    -- Loop through required scopes and check if key has them
    FOR v_scope_item IN SELECT jsonb_array_elements_text(p_required_scopes)
    LOOP
      -- Check if the scope exists in the key's scopes array
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
  
  -- Set RLS context for the user
  PERFORM set_config('request.jwt.claim.sub', v_key_record.user_id::text, false);
  PERFORM set_config('request.jwt.claim.api_key_id', v_key_record.id::text, false);
  PERFORM set_config('request.jwt.claim.scopes', v_key_record.scopes::text, false);
  PERFORM set_config('request.jwt.claim.role', 'authenticated', false);
  
  -- Update usage stats if requested
  IF p_mark_usage THEN
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

-- Create ONLY ONE public wrapper function
CREATE OR REPLACE FUNCTION public.validate_api_key(
  p_key_hash text,
  p_key_prefix text,
  p_expected_user_id uuid DEFAULT NULL,
  p_mark_usage boolean DEFAULT true,
  p_required_scopes jsonb DEFAULT NULL
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
  -- Delegate to private implementation
  RETURN QUERY SELECT * FROM private.validate_api_key(
    p_key_hash,
    p_key_prefix,
    p_expected_user_id,
    p_mark_usage,
    p_required_scopes
  );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.validate_api_key(text, text, uuid, boolean, jsonb) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION private.validate_api_key(text, text, uuid, boolean, jsonb) TO authenticated, anon;

-- Add comments
COMMENT ON FUNCTION public.validate_api_key(text, text, uuid, boolean, jsonb) IS 
'Advanced API key validation with hash verification, user validation, scope checking, and usage tracking. Returns validation result with detailed error messages.';

COMMENT ON FUNCTION private.validate_api_key(text, text, uuid, boolean, jsonb) IS 
'Private implementation of advanced API key validation. Uses v_ prefix for all variables to avoid ambiguous column references. Validates key hash, prefix, user ownership, and required scopes.';
