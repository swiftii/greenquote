-- GreenQuote Pro - Multi-Tenant Database Schema
-- Run this SQL in Supabase SQL Editor

-- =====================================================
-- Table: accounts
-- Each Supabase user gets one account
-- =====================================================

CREATE TABLE accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create index for faster lookups by owner_user_id
CREATE INDEX idx_accounts_owner_user_id ON accounts(owner_user_id);

-- Enable Row Level Security
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only read their own account
CREATE POLICY "Users can view own account"
  ON accounts
  FOR SELECT
  USING (auth.uid() = owner_user_id);

-- Policy: Users can insert their own account
CREATE POLICY "Users can insert own account"
  ON accounts
  FOR INSERT
  WITH CHECK (auth.uid() = owner_user_id);

-- Policy: Users can update their own account
CREATE POLICY "Users can update own account"
  ON accounts
  FOR UPDATE
  USING (auth.uid() = owner_user_id);

-- =====================================================
-- Table: account_settings
-- Each account has one settings row
-- =====================================================

CREATE TABLE account_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL UNIQUE REFERENCES accounts(id) ON DELETE CASCADE,
  min_price_per_visit NUMERIC(10, 2) NOT NULL DEFAULT 50.00,
  price_per_sq_ft NUMERIC(10, 4) NOT NULL DEFAULT 0.10,
  addons JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create index for faster lookups by account_id
CREATE INDEX idx_account_settings_account_id ON account_settings(account_id);

-- Enable Row Level Security
ALTER TABLE account_settings ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view settings for their own account
CREATE POLICY "Users can view own account settings"
  ON account_settings
  FOR SELECT
  USING (
    account_id IN (
      SELECT id FROM accounts WHERE owner_user_id = auth.uid()
    )
  );

-- Policy: Users can insert settings for their own account
CREATE POLICY "Users can insert own account settings"
  ON account_settings
  FOR INSERT
  WITH CHECK (
    account_id IN (
      SELECT id FROM accounts WHERE owner_user_id = auth.uid()
    )
  );

-- Policy: Users can update settings for their own account
CREATE POLICY "Users can update own account settings"
  ON account_settings
  FOR UPDATE
  USING (
    account_id IN (
      SELECT id FROM accounts WHERE owner_user_id = auth.uid()
    )
  );

-- =====================================================
-- Function: Update updated_at timestamp
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Update updated_at on accounts table
CREATE TRIGGER update_accounts_updated_at
  BEFORE UPDATE ON accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger: Update updated_at on account_settings table
CREATE TRIGGER update_account_settings_updated_at
  BEFORE UPDATE ON account_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Verification Queries (Optional - Run after setup)
-- =====================================================

-- Check that tables were created
-- SELECT * FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('accounts', 'account_settings');

-- Check RLS policies
-- SELECT * FROM pg_policies WHERE tablename IN ('accounts', 'account_settings');
