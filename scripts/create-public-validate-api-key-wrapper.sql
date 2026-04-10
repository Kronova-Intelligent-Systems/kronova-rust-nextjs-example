-- Migration: Create public wrapper for private.validate_api_key
-- This allows the REST API to call the private function through a public interface

-- Create public wrapper function that calls the private function
CREATE OR REPLACE FUNCTION public.validate_api_key(api_key text)
RETURNS TABLE (
  user_id uuid,
  api_key_id uuid,
  scopes jsonb,
  valid boolean
) 
SECURITY DEFINER
SET search_path = public, private, extensions
LANGUAGE plpgsql
AS $$
BEGIN
  -- Simply delegate to the private function
  RETURN QUERY SELECT * FROM private.validate_api_key(api_key);
END;
$$;

-- Grant execute permissions to authenticated and anon roles
GRANT EXECUTE ON FUNCTION public.validate_api_key(text) TO authenticated, anon;

-- Add comment documenting the wrapper
COMMENT ON FUNCTION public.validate_api_key IS 'Public wrapper for private.validate_api_key. This function is exposed via REST API and delegates to the secure private implementation.';
