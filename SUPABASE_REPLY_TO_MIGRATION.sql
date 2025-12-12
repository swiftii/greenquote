-- GreenQuote Pro - Add customer_reply_email to account_settings
-- Run this SQL in Supabase SQL Editor

-- =====================================================
-- Migration: Add customer_reply_email column
-- This allows users to set a custom Reply-To address
-- for quote emails sent to their customers
-- =====================================================

-- Add the customer_reply_email column
ALTER TABLE account_settings 
ADD COLUMN IF NOT EXISTS customer_reply_email TEXT DEFAULT NULL;

-- Add a comment explaining the column
COMMENT ON COLUMN account_settings.customer_reply_email IS 
  'Custom email address for Reply-To header in customer quote emails. Falls back to account owner email if NULL.';

-- =====================================================
-- Verification Query (Run after migration)
-- =====================================================

-- Verify the column was added
-- SELECT column_name, data_type, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'account_settings' 
-- AND column_name = 'customer_reply_email';
