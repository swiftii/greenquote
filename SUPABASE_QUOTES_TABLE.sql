-- GreenQuote Pro - Quotes Table Migration
-- Run this SQL in Supabase SQL Editor
-- This table tracks all generated quotes for billing and analytics

-- =====================================================
-- Table: quotes
-- Stores every quote generated (billable event)
-- =====================================================

CREATE TABLE quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Account relationship (for multi-tenant billing)
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  
  -- User who created the quote (for audit trail)
  -- NULL if system-generated or user deleted
  created_by_user_id UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Customer information
  customer_name TEXT NULL,
  customer_email TEXT NULL,
  customer_phone TEXT NULL,
  
  -- Property information
  property_address TEXT NULL,
  property_type TEXT NULL,  -- 'residential' or 'commercial'
  
  -- Quote details
  area_sq_ft NUMERIC(12, 2) NULL,
  base_price_per_visit NUMERIC(10, 2) NULL,
  addons JSONB NULL,  -- Snapshot of selected add-ons [{id, name, price}]
  total_price_per_visit NUMERIC(10, 2) NULL,
  frequency TEXT NULL,  -- 'one_time', 'weekly', 'bi_weekly', 'monthly'
  monthly_estimate NUMERIC(10, 2) NULL,
  
  -- Email tracking
  send_to_customer BOOLEAN NOT NULL DEFAULT false,
  email_sent_at TIMESTAMPTZ NULL,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================
-- Indexes
-- =====================================================

-- Index for fast monthly quote counting by account
-- This is the primary index for billing queries
CREATE INDEX idx_quotes_account_created 
  ON quotes(account_id, created_at DESC);

-- Index for user-specific queries
CREATE INDEX idx_quotes_created_by_user 
  ON quotes(created_by_user_id) 
  WHERE created_by_user_id IS NOT NULL;

-- =====================================================
-- Row Level Security
-- =====================================================

ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;

-- Policy: Users can SELECT quotes for accounts they own
-- NOTE: When multi-user per account is added, update this policy
-- to check against an account_members table instead of owner_user_id
CREATE POLICY "Users can view quotes for their accounts"
  ON quotes
  FOR SELECT
  USING (
    account_id IN (
      SELECT id FROM accounts WHERE owner_user_id = auth.uid()
      -- FUTURE: OR id IN (SELECT account_id FROM account_members WHERE user_id = auth.uid())
    )
  );

-- Policy: Users can INSERT quotes for accounts they own
-- NOTE: When multi-user per account is added, update this policy
CREATE POLICY "Users can insert quotes for their accounts"
  ON quotes
  FOR INSERT
  WITH CHECK (
    account_id IN (
      SELECT id FROM accounts WHERE owner_user_id = auth.uid()
      -- FUTURE: OR id IN (SELECT account_id FROM account_members WHERE user_id = auth.uid())
    )
  );

-- Policy: Users can UPDATE their own quotes (optional, for marking email sent)
CREATE POLICY "Users can update quotes for their accounts"
  ON quotes
  FOR UPDATE
  USING (
    account_id IN (
      SELECT id FROM accounts WHERE owner_user_id = auth.uid()
    )
  );

-- =====================================================
-- Comments
-- =====================================================

COMMENT ON TABLE quotes IS 'Stores all generated quotes. Each row is a billable event.';
COMMENT ON COLUMN quotes.account_id IS 'The account that owns this quote (for billing)';
COMMENT ON COLUMN quotes.created_by_user_id IS 'The user who created this quote (for audit trail)';
COMMENT ON COLUMN quotes.addons IS 'JSON snapshot of selected add-ons at time of quote creation';
COMMENT ON COLUMN quotes.send_to_customer IS 'Whether the user checked "Send quote to customer"';
COMMENT ON COLUMN quotes.email_sent_at IS 'Timestamp when email was successfully sent (NULL if not sent)';

-- =====================================================
-- Verification Queries (Run after migration)
-- =====================================================

-- Verify table created
-- SELECT * FROM information_schema.tables WHERE table_name = 'quotes';

-- Verify columns
-- SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'quotes';

-- Verify RLS policies
-- SELECT * FROM pg_policies WHERE tablename = 'quotes';

-- Verify indexes
-- SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'quotes';
