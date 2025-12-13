-- ============================================================================
-- GreenQuote Pro: Tiered Square-Footage Pricing Migration
-- ============================================================================
-- 
-- PURPOSE:
-- Add tiered (banded) square-foot pricing with blended rates to account_settings.
-- This allows lawn care companies to automatically apply volume discounts for
-- larger lawns while keeping configuration simple and intuitive.
--
-- FEATURES:
-- - Default ON: New accounts get tiered pricing by default
-- - Toggle: Can be disabled to use flat price_per_sq_ft (backward compatible)
-- - Blended Rates: Pricing tiers apply progressively (like tax brackets)
--
-- USER ACTION REQUIRED:
-- Run this SQL in your Supabase SQL Editor before using tiered pricing features.
-- ============================================================================

-- ============================================================================
-- STEP 1: Add tiered pricing columns to account_settings
-- ============================================================================

-- Add use_tiered_sqft_pricing boolean (default TRUE - new accounts get tiered pricing)
ALTER TABLE account_settings
ADD COLUMN IF NOT EXISTS use_tiered_sqft_pricing BOOLEAN NOT NULL DEFAULT true;

-- Add sqft_pricing_tiers JSONB with default tiers
-- Tiers are assumed to be ordered ascending by up_to_sqft
-- up_to_sqft = null means "no upper limit" (catch-all for largest lawns)
ALTER TABLE account_settings
ADD COLUMN IF NOT EXISTS sqft_pricing_tiers JSONB NOT NULL DEFAULT '[
  { "up_to_sqft": 5000, "rate_per_sqft": 0.012 },
  { "up_to_sqft": 20000, "rate_per_sqft": 0.008 },
  { "up_to_sqft": null, "rate_per_sqft": 0.005 }
]'::jsonb;

COMMENT ON COLUMN account_settings.use_tiered_sqft_pricing IS 
  'When true, use tiered blended pricing for sq-ft. When false, use flat price_per_sq_ft.';

COMMENT ON COLUMN account_settings.sqft_pricing_tiers IS 
  'Array of pricing tiers ordered by up_to_sqft ascending. Last tier should have up_to_sqft: null for unlimited.';

-- ============================================================================
-- STEP 2: Add pricing snapshot columns to quotes table
-- ============================================================================

-- Store pricing mode used when quote was created
ALTER TABLE quotes
ADD COLUMN IF NOT EXISTS pricing_mode VARCHAR(20) DEFAULT 'flat';

-- Store snapshot of pricing tiers used (for tiered quotes)
ALTER TABLE quotes
ADD COLUMN IF NOT EXISTS pricing_tiers_snapshot JSONB;

-- Store the flat rate used (for flat pricing mode)
ALTER TABLE quotes
ADD COLUMN IF NOT EXISTS flat_rate_snapshot DECIMAL(10, 6);

COMMENT ON COLUMN quotes.pricing_mode IS 
  'Pricing mode used: tiered or flat';

COMMENT ON COLUMN quotes.pricing_tiers_snapshot IS 
  'Snapshot of pricing tiers at quote time (for tiered mode)';

COMMENT ON COLUMN quotes.flat_rate_snapshot IS 
  'Snapshot of flat price per sq ft at quote time (for flat mode)';

-- ============================================================================
-- STEP 3: Update existing accounts to use tiered pricing by default
-- ============================================================================

-- Existing accounts will get tiered pricing ON with default tiers
-- The existing price_per_sq_ft is preserved for when tiered pricing is disabled
UPDATE account_settings
SET 
  use_tiered_sqft_pricing = true,
  sqft_pricing_tiers = '[
    { "up_to_sqft": 5000, "rate_per_sqft": 0.012 },
    { "up_to_sqft": 20000, "rate_per_sqft": 0.008 },
    { "up_to_sqft": null, "rate_per_sqft": 0.005 }
  ]'::jsonb
WHERE sqft_pricing_tiers IS NULL;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify columns were added to account_settings:
-- SELECT column_name, data_type, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'account_settings' 
--   AND column_name IN ('use_tiered_sqft_pricing', 'sqft_pricing_tiers');

-- Verify columns were added to quotes:
-- SELECT column_name, data_type, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'quotes' 
--   AND column_name IN ('pricing_mode', 'pricing_tiers_snapshot', 'flat_rate_snapshot');

-- Check sample account settings:
-- SELECT id, account_id, use_tiered_sqft_pricing, sqft_pricing_tiers, price_per_sq_ft 
-- FROM account_settings 
-- LIMIT 5;

-- ============================================================================
-- ROLLBACK (if needed)
-- ============================================================================

-- To rollback these changes, run:
-- ALTER TABLE account_settings DROP COLUMN IF EXISTS use_tiered_sqft_pricing;
-- ALTER TABLE account_settings DROP COLUMN IF EXISTS sqft_pricing_tiers;
-- ALTER TABLE quotes DROP COLUMN IF EXISTS pricing_mode;
-- ALTER TABLE quotes DROP COLUMN IF EXISTS pricing_tiers_snapshot;
-- ALTER TABLE quotes DROP COLUMN IF EXISTS flat_rate_snapshot;
