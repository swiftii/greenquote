-- ============================================================================
-- GreenQuote Pro: Widget Installations Migration
-- ============================================================================
--
-- PURPOSE:
-- Creates the widget_installations table that maps public widget IDs to
-- account IDs. This enables secure widget embedding without exposing
-- internal account_id values in public HTML.
--
-- FEATURES:
-- - public_widget_id: Random non-guessable token (e.g., wg_xxxx)
-- - is_active: Toggle to enable/disable widget
-- - RLS policies for secure access
--
-- USER ACTION REQUIRED:
-- Run this SQL in your Supabase SQL Editor before using widget features.
-- ============================================================================

-- ============================================================================
-- STEP 1: Create widget_installations table
-- ============================================================================

CREATE TABLE IF NOT EXISTS widget_installations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    public_widget_id TEXT NOT NULL UNIQUE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE widget_installations IS 
    'Maps public widget IDs to accounts for secure widget embedding';

COMMENT ON COLUMN widget_installations.public_widget_id IS 
    'Random non-guessable token like wg_xxxx used in public embed code';

COMMENT ON COLUMN widget_installations.is_active IS 
    'Toggle to enable/disable the widget without deleting it';

-- ============================================================================
-- STEP 2: Create indexes for fast lookups
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_widget_installations_account_id 
    ON widget_installations(account_id);

CREATE INDEX IF NOT EXISTS idx_widget_installations_public_widget_id 
    ON widget_installations(public_widget_id);

-- ============================================================================
-- STEP 3: Create updated_at trigger
-- ============================================================================

-- First, create the trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for widget_installations
DROP TRIGGER IF EXISTS update_widget_installations_updated_at ON widget_installations;
CREATE TRIGGER update_widget_installations_updated_at
    BEFORE UPDATE ON widget_installations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- STEP 4: Enable RLS and create policies
-- ============================================================================

ALTER TABLE widget_installations ENABLE ROW LEVEL SECURITY;

-- Policy: Users can SELECT their own widget installations
CREATE POLICY "Users can view own widget installations"
    ON widget_installations FOR SELECT
    USING (
        account_id IN (
            SELECT id FROM accounts WHERE owner_user_id = auth.uid()
        )
    );

-- Policy: Users can INSERT widget installations for their accounts
CREATE POLICY "Users can create widget installations for own accounts"
    ON widget_installations FOR INSERT
    WITH CHECK (
        account_id IN (
            SELECT id FROM accounts WHERE owner_user_id = auth.uid()
        )
    );

-- Policy: Users can UPDATE their own widget installations
CREATE POLICY "Users can update own widget installations"
    ON widget_installations FOR UPDATE
    USING (
        account_id IN (
            SELECT id FROM accounts WHERE owner_user_id = auth.uid()
        )
    );

-- Policy: Users can DELETE their own widget installations
CREATE POLICY "Users can delete own widget installations"
    ON widget_installations FOR DELETE
    USING (
        account_id IN (
            SELECT id FROM accounts WHERE owner_user_id = auth.uid()
        )
    );

-- ============================================================================
-- STEP 5: Add source column to quotes table
-- ============================================================================

-- Add source column to track where quotes originate
ALTER TABLE quotes
ADD COLUMN IF NOT EXISTS source VARCHAR(20) DEFAULT 'pro_app';

COMMENT ON COLUMN quotes.source IS 
    'Origin of the quote: pro_app (dashboard) or widget (embedded)';

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify widget_installations table:
-- SELECT column_name, data_type, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'widget_installations';

-- Verify indexes:
-- SELECT indexname, indexdef 
-- FROM pg_indexes 
-- WHERE tablename = 'widget_installations';

-- Verify RLS policies:
-- SELECT policyname, cmd, qual 
-- FROM pg_policies 
-- WHERE tablename = 'widget_installations';

-- Verify quotes source column:
-- SELECT column_name, data_type, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'quotes' AND column_name = 'source';

-- ============================================================================
-- ROLLBACK (if needed)
-- ============================================================================

-- To rollback these changes:
-- DROP TABLE IF EXISTS widget_installations;
-- ALTER TABLE quotes DROP COLUMN IF EXISTS source;
