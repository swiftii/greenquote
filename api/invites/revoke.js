// Vercel Serverless Function: Revoke Team Invite
// Route: POST /api/invites/revoke
//
// Revokes a pending invitation
//
// REQUIRED ENV VARS:
// - SUPABASE_URL: Supabase project URL
// - SUPABASE_SERVICE_ROLE_KEY: Supabase service role key

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase with service role key
const supabase = createClient(
  process.env.SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('[RevokeInvite] SUPABASE_SERVICE_ROLE_KEY not configured');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  try {
    // Get authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authorization required' });
    }

    const token = authHeader.replace('Bearer ', '');

    // Verify the user's JWT
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      console.error('[RevokeInvite] Auth error:', authError);
      return res.status(401).json({ error: 'Invalid authentication' });
    }

    const { invite_id } = req.body;

    if (!invite_id) {
      return res.status(400).json({ error: 'Invite ID is required' });
    }

    console.log('[RevokeInvite] User:', user.id, 'revoking invite:', invite_id);

    // Get the user's account via membership (must be owner/admin)
    const { data: membership, error: membershipError } = await supabase
      .from('account_members')
      .select('account_id, role')
      .eq('user_id', user.id)
      .in('role', ['owner', 'admin'])
      .order('created_at', { ascending: true })
      .limit(1)
      .single();

    if (membershipError || !membership) {
      console.error('[RevokeInvite] Membership lookup error:', membershipError);
      return res.status(403).json({ error: 'You must be an owner or admin to revoke invitations' });
    }

    const accountId = membership.account_id;

    // Get the invite
    const { data: invite, error: inviteError } = await supabase
      .from('account_invites')
      .select('id, account_id, status')
      .eq('id', invite_id)
      .single();

    if (inviteError || !invite) {
      console.error('[RevokeInvite] Invite lookup error:', inviteError);
      return res.status(404).json({ error: 'Invitation not found' });
    }

    // Verify invite belongs to user's account
    if (invite.account_id !== accountId) {
      return res.status(403).json({ error: 'You cannot revoke this invitation' });
    }

    // Check if already revoked or accepted
    if (invite.status === 'revoked') {
      return res.status(400).json({ error: 'This invitation has already been revoked' });
    }
    if (invite.status === 'accepted') {
      return res.status(400).json({ error: 'This invitation has already been accepted' });
    }

    // Update invite status to revoked
    const { error: updateError } = await supabase
      .from('account_invites')
      .update({ status: 'revoked' })
      .eq('id', invite_id);

    if (updateError) {
      console.error('[RevokeInvite] Update error:', updateError);
      return res.status(500).json({ error: 'Failed to revoke invitation' });
    }

    console.log('[RevokeInvite] Invitation revoked:', invite_id);

    return res.status(200).json({ 
      ok: true,
      message: 'Invitation revoked successfully' 
    });

  } catch (error) {
    console.error('[RevokeInvite] Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
}
