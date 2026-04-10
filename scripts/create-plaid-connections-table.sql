-- Migration: Create plaid_connections table
-- This table stores Plaid bank account connections for users

CREATE TABLE IF NOT EXISTS public.plaid_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id TEXT NOT NULL UNIQUE,
  access_token TEXT NOT NULL,
  institution_id TEXT,
  institution_name TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'disconnected', 'error')),
  error_message TEXT,
  last_synced_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_plaid_connections_user_id ON public.plaid_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_plaid_connections_item_id ON public.plaid_connections(item_id);
CREATE INDEX IF NOT EXISTS idx_plaid_connections_status ON public.plaid_connections(status);

-- Add RLS policies
ALTER TABLE public.plaid_connections ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only view their own connections
CREATE POLICY "Users can view own plaid connections"
  ON public.plaid_connections
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own connections
CREATE POLICY "Users can insert own plaid connections"
  ON public.plaid_connections
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own connections
CREATE POLICY "Users can update own plaid connections"
  ON public.plaid_connections
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own connections
CREATE POLICY "Users can delete own plaid connections"
  ON public.plaid_connections
  FOR DELETE
  USING (auth.uid() = user_id);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_plaid_connections_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_plaid_connections_updated_at_trigger
  BEFORE UPDATE ON public.plaid_connections
  FOR EACH ROW
  EXECUTE FUNCTION update_plaid_connections_updated_at();

-- Add comments
COMMENT ON TABLE public.plaid_connections IS 'Stores Plaid bank account connections for financial data integration';
COMMENT ON COLUMN public.plaid_connections.item_id IS 'Plaid item ID representing the connection';
COMMENT ON COLUMN public.plaid_connections.access_token IS 'Encrypted Plaid access token for API calls';
COMMENT ON COLUMN public.plaid_connections.institution_id IS 'Financial institution identifier from Plaid';
COMMENT ON COLUMN public.plaid_connections.status IS 'Connection status: active, disconnected, or error';
