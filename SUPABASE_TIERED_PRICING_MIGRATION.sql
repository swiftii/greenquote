-- GreenQuote Pro - Tiered Sq-Ft Pricing Migration
-- Run this SQL in Supabase SQL Editor
-- Adds tiered (banded) pricing with blended rates for volume discounts

-- =====================================================
-- Part 1: Update account_settings for tiered pricing
-- =====================================================

-- Add toggle for tiered pricing (default ON)
ALTER TABLE account_settings 
ADD COLUMN IF NOT EXISTS use_tiered_sqft_pricing BOOLEAN NOT NULL DEFAULT true;

-- Add pricing tiers configuration
ALTER TABLE account_settings 
ADD COLUMN IF NOT EXISTS sqft_pricing_tiers JSONB NOT NULL DEFAULT '[
  { "up_to_sqft": 5000, "rate_per_sqft": 0.012 },
  { "up_to_sqft": 20000, "rate_per_sqft": 0.008 },
  { "up_to_sqft": null, "rate_per_sqft": 0.005 }
]'::jsonb;

-- Comments
COMMENT ON COLUMN account_settings.use_tiered_sqft_pricing IS 'Toggle for volume-based tiered pricing. When OFF, uses flat price_per_sq_ft.';
COMMENT ON COLUMN account_settings.sqft_pricing_tiers IS 'Array of pricing tiers. Each tier: {up_to_sqft: number|null, rate_per_sqft: number}. null means no upper limit.';

-- =====================================================
-- Part 2: Update quotes table for pricing snapshot
-- =====================================================

-- Add pricing mode to track which method was used
ALTER TABLE quotes 
ADD COLUMN IF NOT EXISTS pricing_mode TEXT DEFAULT 'flat';

-- Add pricing tiers snapshot (tiers used at quote time)
ALTER TABLE quotes 
ADD COLUMN IF NOT EXISTS pricing_tiers_snapshot JSONB NULL;

-- Comments
COMMENT ON COLUMN quotes.pricing_mode IS 'Pricing method used: tiered or flat';
COMMENT ON COLUMN quotes.pricing_tiers_snapshot IS 'Snapshot of pricing tiers at time of quote creation for historical accuracy';

-- =====================================================
-- Verification Queries (Run after migration)
-- =====================================================

-- Verify account_settings columns
-- SELECT column_name, data_type, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'account_settings' 
-- AND column_name IN ('use_tiered_sqft_pricing', 'sqft_pricing_tiers');

-- Verify quotes columns
-- SELECT column_name, data_type, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'quotes' 
-- AND column_name IN ('pricing_mode', 'pricing_tiers_snapshot');

-- Check default tiers for all accounts
-- SELECT id, use_tiered_sqft_pricing, sqft_pricing_tiers FROM account_settings;
