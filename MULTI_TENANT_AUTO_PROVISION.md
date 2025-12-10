# GreenQuote Pro - Auto-Provisioning Setup Guide

## Overview

This guide explains how to set up automatic account provisioning so that every user who signs up in Supabase automatically gets:
- One `accounts` row
- One `account_settings` row

## Prerequisites

1. You have a Supabase project set up
2. You have run `SUPABASE_SCHEMA.sql` to create the `accounts` and `account_settings` tables
3. You have access to the Supabase SQL Editor

---

## Step 1: Create the Auto-Provisioning Trigger

Run this SQL in your Supabase SQL Editor:

**File:** `SUPABASE_TRIGGER.sql`

```sql
-- Drop existing trigger and function if they exist (safe to re-run)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create the function that provisions account + settings for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
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

-- Grant permission
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;

SELECT 'Trigger created successfully!' AS status;
```

### What This Does:
- Creates a PostgreSQL function `handle_new_user()` that runs with elevated privileges
- Extracts the user's business name, full name, or email prefix for the account name
- Creates an `accounts` row linked to the new user
- Creates an `account_settings` row with default pricing values
- The trigger fires automatically AFTER INSERT on `auth.users`

---

## Step 2: Backfill Existing Users

If you have existing users who signed up before the trigger was created, run this SQL:

**File:** `SUPABASE_BACKFILL.sql`

```sql
-- Backfill accounts for users who don't have one
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

-- Backfill account_settings for accounts that don't have settings
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

-- Verification query - shows all users and their status
SELECT 
  u.id AS user_id,
  u.email,
  a.id AS account_id,
  s.id AS settings_id,
  CASE WHEN a.id IS NULL THEN 'MISSING' ELSE 'OK' END AS account_status,
  CASE WHEN s.id IS NULL THEN 'MISSING' ELSE 'OK' END AS settings_status
FROM auth.users u
LEFT JOIN public.accounts a ON a.owner_user_id = u.id
LEFT JOIN public.account_settings s ON s.account_id = a.id;
```

### What This Does:
- Inserts accounts for any users missing them
- Inserts settings for any accounts missing them
- Safe to run multiple times (idempotent)
- Shows a verification report at the end

---

## Step 3: Verify Everything Works

### Test 1: Check Trigger Exists
```sql
SELECT * FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';
```

### Test 2: Check All Users Have Accounts
```sql
SELECT 
  (SELECT COUNT(*) FROM auth.users) AS total_users,
  (SELECT COUNT(*) FROM public.accounts) AS total_accounts,
  (SELECT COUNT(*) FROM public.account_settings) AS total_settings;
```

All three counts should match.

### Test 3: Sign Up a New User
1. Go to your app at `https://app.getgreenquote.com/signup`
2. Create a new account
3. Check Supabase:
   ```sql
   SELECT * FROM accounts ORDER BY created_at DESC LIMIT 1;
   SELECT * FROM account_settings ORDER BY created_at DESC LIMIT 1;
   ```
4. The new user should have both rows automatically

---

## Files in This Repo

| File | Purpose |
|------|---------|
| `SUPABASE_SCHEMA.sql` | Creates `accounts` and `account_settings` tables with RLS |
| `SUPABASE_TRIGGER.sql` | Creates auto-provisioning trigger for new users |
| `SUPABASE_BACKFILL.sql` | Backfills existing users who are missing rows |

---

## App Code Changes

The frontend code in `frontend/src/services/accountService.js` has been updated to:

1. **Expect data to exist** - With the trigger, accounts and settings should always exist
2. **Fallback creation** - If rows are missing (edge case), it will create them
3. **Log warnings** - If fallback is used, it logs a warning so you know to check the trigger

### The flow is now:
```
User signs up
    ↓
Supabase trigger creates:
    → accounts row
    → account_settings row
    ↓
User visits /dashboard
    ↓
App queries existing data (fast!)
    ↓
Dashboard renders
```

---

## Troubleshooting

### "Permission denied" errors
Make sure RLS policies are correctly set up. Run `SUPABASE_SCHEMA.sql` again if needed.

### Trigger not firing
1. Check the trigger exists: `SELECT * FROM information_schema.triggers`
2. Check for errors in Supabase logs
3. Ensure the function has `SECURITY DEFINER`

### Users missing accounts after signup
1. Run the backfill script
2. Check the trigger is active
3. Check Supabase logs for function errors

---

## Default Settings

When auto-provisioned, accounts get these defaults:

| Setting | Default Value |
|---------|---------------|
| `min_price_per_visit` | $50.00 |
| `price_per_sq_ft` | $0.10 |
| `addons` | `[]` (empty array) |

Users can change these in `/settings` after logging in.
