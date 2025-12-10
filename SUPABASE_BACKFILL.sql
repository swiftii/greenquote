-- =====================================================
-- GreenQuote Pro - Backfill Existing Users
-- =====================================================
--
-- This script backfills accounts and account_settings for
-- any existing users who don't have them yet.
--
-- SAFE TO RUN MULTIPLE TIMES (idempotent)
--
-- Run this AFTER:
--   1. SUPABASE_SCHEMA.sql (creates tables)
--   2. SUPABASE_TRIGGER.sql (creates trigger for new users)
--
-- =====================================================

-- =====================================================
-- STEP 1: Backfill accounts for users who don't have one
-- =====================================================

INSERT INTO public.accounts (owner_user_id, name)
SELECT 
  u.id AS owner_user_id,
  COALESCE(
    u.raw_user_meta_data->>'business_name',
    u.raw_user_meta_data->>'full_name',
    split_part(u.email, '@', 1),
    'My Account'
  ) AS name
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.accounts a WHERE a.owner_user_id = u.id
);

-- Report how many accounts were created
DO $$
DECLARE
  accounts_created INTEGER;
BEGIN
  GET DIAGNOSTICS accounts_created = ROW_COUNT;
  RAISE NOTICE 'Backfill complete: % new accounts created', accounts_created;
END $$;

-- =====================================================
-- STEP 2: Backfill account_settings for accounts that don't have settings
-- =====================================================

INSERT INTO public.account_settings (account_id, min_price_per_visit, price_per_sq_ft, addons)
SELECT 
  a.id AS account_id,
  50.00 AS min_price_per_visit,
  0.10 AS price_per_sq_ft,
  '[]'::jsonb AS addons
FROM public.accounts a
WHERE NOT EXISTS (
  SELECT 1 FROM public.account_settings s WHERE s.account_id = a.id
);

-- Report how many settings were created
DO $$
DECLARE
  settings_created INTEGER;
BEGIN
  GET DIAGNOSTICS settings_created = ROW_COUNT;
  RAISE NOTICE 'Backfill complete: % new account_settings created', settings_created;
END $$;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Show all users and their account status
SELECT 
  u.id AS user_id,
  u.email,
  a.id AS account_id,
  a.name AS account_name,
  s.id AS settings_id,
  CASE WHEN a.id IS NULL THEN 'MISSING ACCOUNT' ELSE 'OK' END AS account_status,
  CASE WHEN s.id IS NULL THEN 'MISSING SETTINGS' ELSE 'OK' END AS settings_status
FROM auth.users u
LEFT JOIN public.accounts a ON a.owner_user_id = u.id
LEFT JOIN public.account_settings s ON s.account_id = a.id
ORDER BY u.created_at DESC;

-- Count summary
SELECT 
  (SELECT COUNT(*) FROM auth.users) AS total_users,
  (SELECT COUNT(*) FROM public.accounts) AS total_accounts,
  (SELECT COUNT(*) FROM public.account_settings) AS total_settings,
  (SELECT COUNT(*) FROM auth.users u WHERE NOT EXISTS (SELECT 1 FROM public.accounts a WHERE a.owner_user_id = u.id)) AS users_missing_accounts,
  (SELECT COUNT(*) FROM public.accounts a WHERE NOT EXISTS (SELECT 1 FROM public.account_settings s WHERE s.account_id = a.id)) AS accounts_missing_settings;
