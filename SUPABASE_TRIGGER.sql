-- =====================================================
-- GreenQuote Pro - Auto-Provisioning Trigger & Backfill
-- =====================================================
-- 
-- This script creates a trigger that automatically creates
-- accounts and account_settings rows when a new user signs up.
--
-- Run this AFTER running SUPABASE_SCHEMA.sql
--
-- =====================================================

-- =====================================================
-- PART 1: Create the trigger function
-- =====================================================

-- Drop existing trigger and function if they exist (safe to re-run)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create the function that provisions account + settings for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER  -- Run with elevated privileges to bypass RLS
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  new_account_id UUID;
  account_name TEXT;
BEGIN
  -- Determine the account name from user metadata or email
  account_name := COALESCE(
    NEW.raw_user_meta_data->>'business_name',
    NEW.raw_user_meta_data->>'full_name',
    split_part(NEW.email, '@', 1),
    'My Account'
  );

  -- Insert the account row
  INSERT INTO public.accounts (owner_user_id, name)
  VALUES (NEW.id, account_name)
  RETURNING id INTO new_account_id;

  -- Insert the account_settings row with defaults
  INSERT INTO public.account_settings (account_id, min_price_per_visit, price_per_sq_ft, addons)
  VALUES (new_account_id, 50.00, 0.10, '[]'::jsonb);

  RETURN NEW;
END;
$$;

-- Create the trigger on auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Grant execute permission to authenticated users (not strictly needed but good practice)
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;

-- =====================================================
-- Verification: Check trigger was created
-- =====================================================
-- Run this to verify the trigger exists:
-- SELECT * FROM information_schema.triggers WHERE trigger_name = 'on_auth_user_created';

SELECT 'Trigger created successfully!' AS status;
