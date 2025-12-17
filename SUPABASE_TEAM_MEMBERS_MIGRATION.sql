-- ============================================================
-- GREENQUOTE PRO: Multi-User Accounts (Team Members) Migration
-- ============================================================
-- 
-- This migration adds support for multiple users per account:
-- - account_members: Links users to accounts with roles
-- - account_invites: Tracks email invitations
-- - RLS policies for secure access
-- - Backfills existing account owners as members
--
-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard → SQL Editor → New Query
-- ============================================================

-- ============================================================
-- 1. CREATE account_members TABLE
-- ============================================================
-- Join table linking auth users to accounts with role-based access

CREATE TABLE IF NOT EXISTS public.account_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  created_at timestamptz DEFAULT now(),
  
  -- Ensure one membership per user per account
  CONSTRAINT unique_account_member UNIQUE (account_id, user_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_account_members_account_id ON public.account_members(account_id);
CREATE INDEX IF NOT EXISTS idx_account_members_user_id ON public.account_members(user_id);

-- Add table comment
COMMENT ON TABLE public.account_members IS 'Links users to accounts with role-based permissions (owner/admin/member)';

-- ============================================================
-- 2. CREATE account_invites TABLE
-- ============================================================
-- Tracks pending email invitations to join accounts

CREATE TABLE IF NOT EXISTS public.account_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  invited_email text NOT NULL,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  token text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'revoked', 'expired')),
  invited_by_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  expires_at timestamptz NOT NULL,
  accepted_by_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  accepted_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_account_invites_account_id ON public.account_invites(account_id);
CREATE INDEX IF NOT EXISTS idx_account_invites_invited_email ON public.account_invites(invited_email);
CREATE INDEX IF NOT EXISTS idx_account_invites_token ON public.account_invites(token);
CREATE INDEX IF NOT EXISTS idx_account_invites_status ON public.account_invites(status);

-- Add table comment
COMMENT ON TABLE public.account_invites IS 'Tracks email invitations for team members to join accounts';

-- ============================================================
-- 3. ENABLE RLS ON NEW TABLES
-- ============================================================

ALTER TABLE public.account_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_invites ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 4. RLS POLICIES FOR account_members
-- ============================================================

-- Policy: Users can SELECT their own memberships
CREATE POLICY "Users can view their own memberships"
  ON public.account_members
  FOR SELECT
  USING (user_id = auth.uid());

-- Policy: Users can SELECT memberships of accounts they belong to
CREATE POLICY "Users can view memberships of their accounts"
  ON public.account_members
  FOR SELECT
  USING (
    account_id IN (
      SELECT am.account_id 
      FROM public.account_members am 
      WHERE am.user_id = auth.uid()
    )
  );

-- Policy: Owner/Admin can INSERT new memberships (for invites)
-- Note: Typically handled via service role, but allow admin access
CREATE POLICY "Owners and admins can add members"
  ON public.account_members
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 
      FROM public.account_members am 
      WHERE am.account_id = account_members.account_id 
        AND am.user_id = auth.uid() 
        AND am.role IN ('owner', 'admin')
    )
  );

-- Policy: Owner can UPDATE memberships (change roles)
CREATE POLICY "Owners can update member roles"
  ON public.account_members
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 
      FROM public.account_members am 
      WHERE am.account_id = account_members.account_id 
        AND am.user_id = auth.uid() 
        AND am.role = 'owner'
    )
  );

-- Policy: Owner can DELETE memberships (remove team members)
CREATE POLICY "Owners can remove members"
  ON public.account_members
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 
      FROM public.account_members am 
      WHERE am.account_id = account_members.account_id 
        AND am.user_id = auth.uid() 
        AND am.role = 'owner'
    )
    -- Prevent deleting the owner themselves
    AND role != 'owner'
  );

-- ============================================================
-- 5. RLS POLICIES FOR account_invites
-- ============================================================

-- Policy: Owner/Admin can SELECT invites for their account
CREATE POLICY "Owners and admins can view invites"
  ON public.account_invites
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 
      FROM public.account_members am 
      WHERE am.account_id = account_invites.account_id 
        AND am.user_id = auth.uid() 
        AND am.role IN ('owner', 'admin')
    )
  );

-- Policy: Owner/Admin can INSERT invites
CREATE POLICY "Owners and admins can create invites"
  ON public.account_invites
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 
      FROM public.account_members am 
      WHERE am.account_id = account_invites.account_id 
        AND am.user_id = auth.uid() 
        AND am.role IN ('owner', 'admin')
    )
  );

-- Policy: Owner/Admin can UPDATE invites (revoke)
CREATE POLICY "Owners and admins can update invites"
  ON public.account_invites
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 
      FROM public.account_members am 
      WHERE am.account_id = account_invites.account_id 
        AND am.user_id = auth.uid() 
        AND am.role IN ('owner', 'admin')
    )
  );

-- ============================================================
-- 6. BACKFILL EXISTING ACCOUNT OWNERS
-- ============================================================
-- Insert owner memberships for all existing accounts
-- Uses ON CONFLICT DO NOTHING to be idempotent

INSERT INTO public.account_members (account_id, user_id, role)
SELECT id, owner_user_id, 'owner'
FROM public.accounts
WHERE owner_user_id IS NOT NULL
ON CONFLICT (account_id, user_id) DO NOTHING;

-- ============================================================
-- 7. UPDATE TRIGGER FOR NEW ACCOUNTS
-- ============================================================
-- When a new account is created, automatically add owner membership

CREATE OR REPLACE FUNCTION public.create_owner_membership()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.account_members (account_id, user_id, role)
  VALUES (NEW.id, NEW.owner_user_id, 'owner')
  ON CONFLICT (account_id, user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_account_created_add_owner ON public.accounts;

-- Create trigger to auto-create owner membership
CREATE TRIGGER on_account_created_add_owner
  AFTER INSERT ON public.accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.create_owner_membership();

-- ============================================================
-- 8. HELPER FUNCTION: Get user's account(s) via membership
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_user_accounts(p_user_id uuid)
RETURNS TABLE (
  account_id uuid,
  account_name text,
  role text,
  joined_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id as account_id,
    a.name as account_name,
    am.role,
    am.created_at as joined_at
  FROM public.account_members am
  JOIN public.accounts a ON a.id = am.account_id
  WHERE am.user_id = p_user_id
  ORDER BY am.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- MIGRATION COMPLETE
-- ============================================================
-- 
-- Summary of changes:
-- ✓ Created account_members table with RLS
-- ✓ Created account_invites table with RLS  
-- ✓ Added indexes for performance
-- ✓ Backfilled existing account owners
-- ✓ Created trigger for new accounts
-- ✓ Created helper function for account lookup
--
-- Next steps:
-- 1. Run this migration in Supabase SQL Editor
-- 2. Deploy API routes for invite management
-- 3. Update frontend to use membership-based account resolution
-- ============================================================
