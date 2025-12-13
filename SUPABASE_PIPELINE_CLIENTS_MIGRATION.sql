-- GreenQuote Pro - Quote Pipeline & Clients Migration
-- Run this SQL in Supabase SQL Editor
-- Adds quote status pipeline and creates clients table

-- =====================================================
-- Part 1: Update quotes table for pipeline
-- =====================================================

-- Add status column for quote pipeline
ALTER TABLE quotes 
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending';

-- Add services snapshot (includes base service + add-ons)
ALTER TABLE quotes 
ADD COLUMN IF NOT EXISTS services JSONB NULL;

-- Add customer name columns if not exist (separate first/last or combined)
ALTER TABLE quotes 
ADD COLUMN IF NOT EXISTS customer_first_name TEXT NULL;

ALTER TABLE quotes 
ADD COLUMN IF NOT EXISTS customer_last_name TEXT NULL;

-- Update column comments
COMMENT ON COLUMN quotes.status IS 'Quote pipeline status: pending, won, lost';
COMMENT ON COLUMN quotes.services IS 'JSON snapshot of services at time of quote: {baseService, addons: [{id, name, price}]}';
COMMENT ON COLUMN quotes.monthly_estimate IS 'Estimated monthly revenue based on frequency';

-- Create index for pipeline queries
CREATE INDEX IF NOT EXISTS idx_quotes_account_status_created
  ON quotes(account_id, status, created_at DESC);

-- =====================================================
-- Part 2: Create clients table
-- =====================================================

CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Account relationship (for multi-tenant)
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  
  -- Link to source quote (if created from quote)
  source_quote_id UUID NULL REFERENCES quotes(id) ON DELETE SET NULL,
  
  -- Client information
  customer_name TEXT NULL,
  customer_email TEXT NULL,
  customer_phone TEXT NULL,
  
  -- Property information
  property_address TEXT NOT NULL,
  property_type TEXT NULL,
  area_sq_ft NUMERIC(12, 2) NULL,
  
  -- Service information
  services JSONB NULL,
  frequency TEXT NULL,
  
  -- Pricing
  price_per_visit NUMERIC(10, 2) NULL,
  estimated_monthly_revenue NUMERIC(10, 2) NULL,
  
  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================
-- Indexes for clients table
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_clients_account_id
  ON clients(account_id);

CREATE INDEX IF NOT EXISTS idx_clients_source_quote
  ON clients(source_quote_id)
  WHERE source_quote_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_clients_account_active
  ON clients(account_id, is_active)
  WHERE is_active = true;

-- =====================================================
-- Row Level Security for clients
-- =====================================================

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Policy: Users can SELECT clients for accounts they own
CREATE POLICY "Users can view clients for their accounts"
  ON clients
  FOR SELECT
  USING (
    account_id IN (
      SELECT id FROM accounts WHERE owner_user_id = auth.uid()
      -- FUTURE: OR id IN (SELECT account_id FROM account_members WHERE user_id = auth.uid())
    )
  );

-- Policy: Users can INSERT clients for accounts they own
CREATE POLICY "Users can insert clients for their accounts"
  ON clients
  FOR INSERT
  WITH CHECK (
    account_id IN (
      SELECT id FROM accounts WHERE owner_user_id = auth.uid()
    )
  );

-- Policy: Users can UPDATE clients for accounts they own
CREATE POLICY "Users can update clients for their accounts"
  ON clients
  FOR UPDATE
  USING (
    account_id IN (
      SELECT id FROM accounts WHERE owner_user_id = auth.uid()
    )
  );

-- Policy: Users can DELETE clients for accounts they own
CREATE POLICY "Users can delete clients for their accounts"
  ON clients
  FOR DELETE
  USING (
    account_id IN (
      SELECT id FROM accounts WHERE owner_user_id = auth.uid()
    )
  );

-- =====================================================
-- Updated_at trigger for clients
-- =====================================================

CREATE OR REPLACE FUNCTION update_clients_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS clients_updated_at_trigger ON clients;

CREATE TRIGGER clients_updated_at_trigger
  BEFORE UPDATE ON clients
  FOR EACH ROW
  EXECUTE FUNCTION update_clients_updated_at();

-- =====================================================
-- Comments
-- =====================================================

COMMENT ON TABLE clients IS 'Active clients created from won quotes';
COMMENT ON COLUMN clients.account_id IS 'The account that owns this client (for multi-tenant)';
COMMENT ON COLUMN clients.source_quote_id IS 'The quote that was converted to this client (for tracking)';
COMMENT ON COLUMN clients.services IS 'JSON snapshot of services: {baseService, addons: [{id, name, price}]}';
COMMENT ON COLUMN clients.estimated_monthly_revenue IS 'Monthly revenue for dashboard rollup';

-- =====================================================
-- Verification Queries (Run after migration)
-- =====================================================

-- Verify quotes table has new columns
-- SELECT column_name, data_type, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'quotes' AND column_name IN ('status', 'services');

-- Verify clients table created
-- SELECT * FROM information_schema.tables WHERE table_name = 'clients';

-- Verify clients RLS policies
-- SELECT * FROM pg_policies WHERE tablename = 'clients';

-- Verify indexes
-- SELECT indexname, indexdef FROM pg_indexes WHERE tablename IN ('quotes', 'clients');
