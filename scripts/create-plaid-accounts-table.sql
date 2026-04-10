-- Migration: Create plaid_accounts table
-- This table stores individual bank account data from Plaid connections

CREATE TABLE IF NOT EXISTS public.plaid_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plaid_connection_id UUID NOT NULL REFERENCES public.plaid_connections(id) ON DELETE CASCADE,
  plaid_account_id TEXT NOT NULL UNIQUE,
  item_id TEXT NOT NULL,
  
  -- Account identification
  name TEXT NOT NULL,
  official_name TEXT,
  mask TEXT,
  
  -- Account classification
  account_type TEXT NOT NULL,
  account_subtype TEXT,
  
  -- Balance information
  current_balance DECIMAL(15, 2),
  available_balance DECIMAL(15, 2),
  currency_code TEXT DEFAULT 'USD',
  credit_limit DECIMAL(15, 2),
  
  -- Institution details
  institution_id TEXT,
  institution_name TEXT,
  
  -- Status and metadata
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'error')),
  is_imported_as_asset BOOLEAN DEFAULT FALSE,
  linked_asset_id UUID REFERENCES public.assets(id) ON DELETE SET NULL,
  
  -- Raw Plaid data
  plaid_metadata JSONB,
  
  -- Timestamps
  last_synced_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_plaid_accounts_user_id ON public.plaid_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_plaid_accounts_connection_id ON public.plaid_accounts(plaid_connection_id);
CREATE INDEX IF NOT EXISTS idx_plaid_accounts_item_id ON public.plaid_accounts(item_id);
CREATE INDEX IF NOT EXISTS idx_plaid_accounts_plaid_account_id ON public.plaid_accounts(plaid_account_id);
CREATE INDEX IF NOT EXISTS idx_plaid_accounts_status ON public.plaid_accounts(status);
CREATE INDEX IF NOT EXISTS idx_plaid_accounts_linked_asset ON public.plaid_accounts(linked_asset_id) WHERE linked_asset_id IS NOT NULL;

-- Add RLS policies
ALTER TABLE public.plaid_accounts ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only view their own accounts
CREATE POLICY "Users can view own plaid accounts"
  ON public.plaid_accounts
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own accounts
CREATE POLICY "Users can insert own plaid accounts"
  ON public.plaid_accounts
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own accounts
CREATE POLICY "Users can update own plaid accounts"
  ON public.plaid_accounts
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own accounts
CREATE POLICY "Users can delete own plaid accounts"
  ON public.plaid_accounts
  FOR DELETE
  USING (auth.uid() = user_id);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_plaid_accounts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_plaid_accounts_updated_at_trigger
  BEFORE UPDATE ON public.plaid_accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_plaid_accounts_updated_at();

-- Add comments
COMMENT ON TABLE public.plaid_accounts IS 'Stores individual bank account data from Plaid connections';
COMMENT ON COLUMN public.plaid_accounts.plaid_account_id IS 'Unique account ID from Plaid';
COMMENT ON COLUMN public.plaid_accounts.item_id IS 'Plaid item ID (references the connection)';
COMMENT ON COLUMN public.plaid_accounts.account_type IS 'Type: depository, credit, loan, investment, etc.';
COMMENT ON COLUMN public.plaid_accounts.account_subtype IS 'Subtype: checking, savings, credit card, etc.';
COMMENT ON COLUMN public.plaid_accounts.is_imported_as_asset IS 'Whether this account has been imported as a tracked asset';
COMMENT ON COLUMN public.plaid_accounts.linked_asset_id IS 'Reference to asset if imported into assets table';
