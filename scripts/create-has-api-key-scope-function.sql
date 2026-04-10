-- Migration: Create has_api_key_scope function
-- This function checks if the current API key has the required scope
-- It reads from the RLS context set by validate_api_key

-- First ensure pgcrypto extension is enabled (in case it wasn't already)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create the has_api_key_scope function in the public schema
CREATE OR REPLACE FUNCTION public.has_api_key_scope(required_scope text)
RETURNS boolean
SECURITY DEFINER
SET search_path = private, public
LANGUAGE plpgsql
AS $$
DECLARE
  api_key_scopes text;
  scopes_array jsonb;
BEGIN
  -- Get the scopes from the RLS context set by validate_api_key
  api_key_scopes := current_setting('request.jwt.claim.scopes', true);
  
  -- If no scopes are set, return false
  IF api_key_scopes IS NULL OR api_key_scopes = '' THEN
    RETURN false;
  END IF;
  
  -- Parse the scopes JSON string
  BEGIN
    scopes_array := api_key_scopes::jsonb;
  EXCEPTION WHEN OTHERS THEN
    -- If parsing fails, return false
    RETURN false;
  END;
  
  -- Check if the required scope exists in the scopes array
  -- The scopes are stored as a JSON array like ["agents:execute", "workflows:execute"]
  RETURN scopes_array ? required_scope;
END;
$$;

-- Grant execute permissions to authenticated and anonymous users
GRANT EXECUTE ON FUNCTION public.has_api_key_scope(text) TO authenticated, anon;

-- Add helpful comment
COMMENT ON FUNCTION public.has_api_key_scope IS 
'Checks if the current API key (identified via RLS context) has the specified scope. Must be called after validate_api_key sets the RLS context.';
