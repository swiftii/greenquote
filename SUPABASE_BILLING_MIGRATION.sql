-- GreenQuote Pro - Billing Fields Migration
-- Run this SQL in Supabase SQL Editor
-- Adds Stripe subscription fields to the accounts table

-- =====================================================
-- Add billing columns to accounts table
-- =====================================================

-- Stripe customer ID for linking account to Stripe
ALTER TABLE accounts 
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT NULL;

-- Stripe subscription ID for the Pro plan subscription
ALTER TABLE accounts 
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT NULL;

-- Subscription status from Stripe
-- Values: trialing, active, past_due, canceled, unpaid, incomplete, incomplete_expired, paused
ALTER TABLE accounts 
ADD COLUMN IF NOT EXISTS subscription_status TEXT NULL;

-- When the trial ends (UTC timestamp)
ALTER TABLE accounts 
ADD COLUMN IF NOT EXISTS trial_end TIMESTAMPTZ NULL;

-- When the current billing period ends (UTC timestamp)
ALTER TABLE accounts 
ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMPTZ NULL;

-- =====================================================
-- Indexes for billing queries
-- =====================================================

-- Index for looking up accounts by Stripe customer ID
CREATE INDEX IF NOT EXISTS idx_accounts_stripe_customer_id 
  ON accounts(stripe_customer_id) 
  WHERE stripe_customer_id IS NOT NULL;

-- Index for looking up accounts by Stripe subscription ID
CREATE INDEX IF NOT EXISTS idx_accounts_stripe_subscription_id 
  ON accounts(stripe_subscription_id) 
  WHERE stripe_subscription_id IS NOT NULL;

-- =====================================================
-- Comments
-- =====================================================

COMMENT ON COLUMN accounts.stripe_customer_id IS 'Stripe Customer ID for billing';
COMMENT ON COLUMN accounts.stripe_subscription_id IS 'Stripe Subscription ID for Pro plan';
COMMENT ON COLUMN accounts.subscription_status IS 'Subscription status from Stripe: trialing, active, past_due, canceled, unpaid, incomplete';
COMMENT ON COLUMN accounts.trial_end IS 'UTC timestamp when trial ends';
COMMENT ON COLUMN accounts.current_period_end IS 'UTC timestamp when current billing period ends';

-- =====================================================
-- Verification Queries (Run after migration)
-- =====================================================

-- Verify columns were added
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'accounts' 
-- AND column_name IN ('stripe_customer_id', 'stripe_subscription_id', 'subscription_status', 'trial_end', 'current_period_end');

-- Verify indexes
-- SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'accounts';
