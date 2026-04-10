-- Migration: Create public wrapper functions for private.api_keys table
-- These functions allow controlled access to the private.api_keys table through public RPC calls

-- Drop existing functions first to avoid return type conflicts
DROP FUNCTION IF EXISTS public.get_user_api_keys(uuid, boolean, integer);
DROP FUNCTION IF EXISTS public.create_api_key(uuid, text, text, text, timestamptz, jsonb);
DROP FUNCTION IF EXISTS public.update_api_key(uuid, text, boolean, timestamptz);
DROP FUNCTION IF EXISTS public.delete_api_key(uuid);

-- Function to get API keys for a user
CREATE OR REPLACE FUNCTION public.get_user_api_keys(
  p_user_id uuid,
  p_is_active boolean DEFAULT NULL,
  p_limit integer DEFAULT 100
)
-- Match exact column order and types from private.api_keys table
RETURNS TABLE (
  created_at timestamptz,
  expires_at timestamptz,
  id uuid,
  is_active boolean,
  key_hash text,
  key_prefix text,
  last_request_at timestamptz,
  last_used_at timestamptz,
  name text,
  scopes jsonb,
  total_requests integer,
  updated_at timestamptz,
  user_id uuid
)
SECURITY DEFINER
SET search_path = private, public, extensions
LANGUAGE plpgsql
AS $$
BEGIN
  -- Verify the requesting user matches the user_id parameter
  -- This ensures users can only access their own API keys
  IF p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized: Cannot access other users API keys';
  END IF;

  RETURN QUERY
  -- Return columns in exact order matching RETURNS TABLE definition
  SELECT 
    ak.created_at,
    ak.expires_at,
    ak.id,
    ak.is_active,
    ak.key_hash,
    ak.key_prefix,
    ak.last_request_at,
    ak.last_used_at,
    ak.name,
    ak.scopes,
    ak.total_requests::integer,
    ak.updated_at,
    ak.user_id
  FROM private.api_keys ak
  WHERE ak.user_id = p_user_id
    AND (p_is_active IS NULL OR ak.is_active = p_is_active)
  ORDER BY ak.created_at DESC
  LIMIT p_limit;
END;
$$;

-- Function to create a new API key
CREATE OR REPLACE FUNCTION public.create_api_key(
  p_user_id uuid,
  p_name text,
  p_key_hash text,
  p_key_prefix text,
  p_expires_at timestamptz DEFAULT NULL,
  p_scopes jsonb DEFAULT '[]'::jsonb
)
-- Return only essential fields after creation
RETURNS TABLE (
  id uuid,
  user_id uuid,
  name text,
  key_prefix text,
  scopes jsonb,
  is_active boolean,
  created_at timestamptz,
  expires_at timestamptz
)
SECURITY DEFINER
SET search_path = private, public, extensions
LANGUAGE plpgsql
AS $$
DECLARE
  new_key private.api_keys;
  generated_id uuid;
BEGIN
  -- Verify the requesting user matches the user_id parameter
  IF p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized: Cannot create API keys for other users';
  END IF;

  -- Generate UUID for the new key
  generated_id := gen_random_uuid();

  -- Insert the new API key with explicit ID
  INSERT INTO private.api_keys (
    id,
    user_id,
    name,
    key_hash,
    key_prefix,
    expires_at,
    scopes,
    is_active,
    created_at,
    updated_at
  )
  VALUES (
    generated_id,
    p_user_id,
    p_name,
    p_key_hash,
    p_key_prefix,
    p_expires_at,
    p_scopes,
    true,
    now(),
    now()
  )
  RETURNING * INTO new_key;

  -- Return the created key
  RETURN QUERY
  SELECT 
    new_key.id,
    new_key.user_id,
    new_key.name,
    new_key.key_prefix,
    new_key.scopes,
    new_key.is_active,
    new_key.created_at,
    new_key.expires_at;
END;
$$;

-- Function to update an API key
CREATE OR REPLACE FUNCTION public.update_api_key(
  p_key_id uuid,
  p_name text DEFAULT NULL,
  p_is_active boolean DEFAULT NULL,
  p_expires_at timestamptz DEFAULT NULL
)
-- Return essential fields with updated_at included
RETURNS TABLE (
  id uuid,
  user_id uuid,
  name text,
  key_prefix text,
  scopes jsonb,
  is_active boolean,
  created_at timestamptz,
  updated_at timestamptz,
  expires_at timestamptz
)
SECURITY DEFINER
SET search_path = private, public, extensions
LANGUAGE plpgsql
AS $$
DECLARE
  existing_key private.api_keys;
  updated_key private.api_keys;
BEGIN
  -- Get the existing key and verify ownership
  SELECT * INTO existing_key
  FROM private.api_keys
  WHERE private.api_keys.id = p_key_id;

  IF existing_key IS NULL THEN
    RAISE EXCEPTION 'API key not found';
  END IF;

  IF existing_key.user_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized: Cannot update other users API keys';
  END IF;

  -- Update the key
  UPDATE private.api_keys
  SET
    name = COALESCE(p_name, private.api_keys.name),
    is_active = COALESCE(p_is_active, private.api_keys.is_active),
    expires_at = COALESCE(p_expires_at, private.api_keys.expires_at),
    updated_at = now()
  WHERE private.api_keys.id = p_key_id
  RETURNING * INTO updated_key;

  -- Return the updated key
  RETURN QUERY
  SELECT 
    updated_key.id,
    updated_key.user_id,
    updated_key.name,
    updated_key.key_prefix,
    updated_key.scopes,
    updated_key.is_active,
    updated_key.created_at,
    updated_key.updated_at,
    updated_key.expires_at;
END;
$$;

-- Function to delete an API key
CREATE OR REPLACE FUNCTION public.delete_api_key(
  p_key_id uuid
)
RETURNS boolean
SECURITY DEFINER
SET search_path = private, public, extensions
LANGUAGE plpgsql
AS $$
DECLARE
  existing_key private.api_keys;
BEGIN
  -- Get the existing key and verify ownership
  SELECT * INTO existing_key
  FROM private.api_keys
  WHERE private.api_keys.id = p_key_id;

  IF existing_key IS NULL THEN
    RAISE EXCEPTION 'API key not found';
  END IF;

  IF existing_key.user_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized: Cannot delete other users API keys';
  END IF;

  -- Delete the key
  DELETE FROM private.api_keys
  WHERE private.api_keys.id = p_key_id;

  RETURN true;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.get_user_api_keys(uuid, boolean, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_api_key(uuid, text, text, text, timestamptz, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_api_key(uuid, text, boolean, timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_api_key(uuid) TO authenticated;

-- Add comments documenting the functions
COMMENT ON FUNCTION public.get_user_api_keys IS 'Retrieves API keys for the authenticated user from the private schema';
COMMENT ON FUNCTION public.create_api_key IS 'Creates a new API key in the private schema with proper authorization checks';
COMMENT ON FUNCTION public.update_api_key IS 'Updates an existing API key in the private schema with ownership verification';
COMMENT ON FUNCTION public.delete_api_key IS 'Deletes an API key from the private schema with ownership verification';
