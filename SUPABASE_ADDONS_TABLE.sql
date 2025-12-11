-- =====================================================
-- GreenQuote Pro - Account Add-ons Table
-- =====================================================
--
-- This script creates the account_addons table for per-account
-- add-on configuration with custom pricing.
--
-- Run this in Supabase SQL Editor AFTER running SUPABASE_SCHEMA.sql
--
-- =====================================================

-- =====================================================
-- STEP 1: Create the account_addons table
-- =====================================================

CREATE TABLE IF NOT EXISTS public.account_addons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price_per_visit NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create index for faster lookups by account
CREATE INDEX IF NOT EXISTS idx_account_addons_account_id ON public.account_addons(account_id);

-- Create index for active addons (common query pattern)
CREATE INDEX IF NOT EXISTS idx_account_addons_active ON public.account_addons(account_id, is_active);

-- =====================================================
-- STEP 2: Enable Row Level Security
-- =====================================================

ALTER TABLE public.account_addons ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- STEP 3: Create RLS Policies
-- =====================================================

-- Policy: Users can SELECT their own account's add-ons
CREATE POLICY "Users can view own account addons"
  ON public.account_addons
  FOR SELECT
  USING (
    account_id IN (
      SELECT id FROM public.accounts WHERE owner_user_id = auth.uid()
    )
  );

-- Policy: Users can INSERT add-ons for their own account
CREATE POLICY "Users can create own account addons"
  ON public.account_addons
  FOR INSERT
  WITH CHECK (
    account_id IN (
      SELECT id FROM public.accounts WHERE owner_user_id = auth.uid()
    )
  );

-- Policy: Users can UPDATE their own account's add-ons
CREATE POLICY "Users can update own account addons"
  ON public.account_addons
  FOR UPDATE
  USING (
    account_id IN (
      SELECT id FROM public.accounts WHERE owner_user_id = auth.uid()
    )
  );

-- Policy: Users can DELETE their own account's add-ons
CREATE POLICY "Users can delete own account addons"
  ON public.account_addons
  FOR DELETE
  USING (
    account_id IN (
      SELECT id FROM public.accounts WHERE owner_user_id = auth.uid()
    )
  );

-- =====================================================
-- STEP 4: Create trigger to auto-update updated_at
-- =====================================================

CREATE OR REPLACE FUNCTION public.update_account_addons_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_account_addons_updated_at
  BEFORE UPDATE ON public.account_addons
  FOR EACH ROW
  EXECUTE FUNCTION public.update_account_addons_updated_at();

-- =====================================================
-- STEP 5: Seed default add-ons for existing accounts (optional)
-- =====================================================
-- This inserts common lawn care add-ons for all existing accounts
-- Comment out if you don't want to seed default data

-- INSERT INTO public.account_addons (account_id, name, description, price_per_visit, sort_order)
-- SELECT 
--   a.id,
--   addon.name,
--   addon.description,
--   addon.price,
--   addon.sort_order
-- FROM public.accounts a
-- CROSS JOIN (
--   VALUES 
--     ('Mulch Installation', 'Fresh mulch around beds and trees', 75.00, 1),
--     ('Flower Bed Maintenance', 'Weeding and care for flower beds', 35.00, 2),
--     ('Hedge Trimming', 'Shape and trim hedges and shrubs', 45.00, 3),
--     ('Leaf Removal', 'Seasonal leaf cleanup and removal', 55.00, 4),
--     ('Edging', 'Clean edges along driveways and walkways', 25.00, 5),
--     ('Weed Control', 'Pre and post-emergent weed treatment', 40.00, 6)
-- ) AS addon(name, description, price, sort_order)
-- WHERE NOT EXISTS (
--   SELECT 1 FROM public.account_addons aa 
--   WHERE aa.account_id = a.id AND aa.name = addon.name
-- );

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Verify table was created
SELECT 
  'account_addons table created' AS status,
  COUNT(*) AS row_count
FROM public.account_addons;

-- Verify RLS is enabled
SELECT 
  tablename, 
  rowsecurity 
FROM pg_tables 
WHERE tablename = 'account_addons';

-- Verify policies exist
SELECT 
  policyname, 
  cmd 
FROM pg_policies 
WHERE tablename = 'account_addons';
