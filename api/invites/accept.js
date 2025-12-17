// Vercel Serverless Function: Accept Team Invite
// Route: POST /api/invites/accept
//
// Accepts an invitation and adds the user to the account
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
    console.error('[AcceptInvite] SUPABASE_SERVICE_ROLE_KEY not configured');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  try {
    // Get authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authorization required' });
    }

    const authToken = authHeader.replace('Bearer ', '');

    // Verify the user's JWT
    const { data: { user }, error: authError } = await supabase.auth.getUser(authToken);
    if (authError || !user) {
      console.error('[AcceptInvite] Auth error:', authError);
      return res.status(401).json({ error: 'Invalid authentication' });
    }

    const { token } = req.body;

    if (!token || typeof token !== 'string') {
      return res.status(400).json({ error: 'Invite token is required' });
    }

    console.log('[AcceptInvite] User:', user.id, 'accepting invite token:', token.substring(0, 8) + '...');

    // Look up the invite by token
    const { data: invite, error: inviteError } = await supabase
      .from('account_invites')
      .select('*')
      .eq('token', token)
      .single();

    if (inviteError || !invite) {
      console.error('[AcceptInvite] Invite lookup error:', inviteError);
      return res.status(404).json({ error: 'Invalid or expired invitation' });
    }

    // Validate invite status
    if (invite.status !== 'pending') {
      if (invite.status === 'accepted') {
        return res.status(400).json({ error: 'This invitation has already been accepted' });
      }
      if (invite.status === 'revoked') {
        return res.status(400).json({ error: 'This invitation has been revoked' });
      }
      return res.status(400).json({ error: 'This invitation is no longer valid' });
    }

    // Check expiration
    if (new Date(invite.expires_at) < new Date()) {
      // Update status to expired
      await supabase
        .from('account_invites')
        .update({ status: 'expired' })
        .eq('id', invite.id);
      
      return res.status(400).json({ error: 'This invitation has expired' });
    }

    // Verify email matches (case-insensitive)
    const userEmail = user.email?.toLowerCase();
    const invitedEmail = invite.invited_email?.toLowerCase();

    if (!userEmail || userEmail !== invitedEmail) {
      return res.status(403).json({ 
        error: 'This invitation was sent to a different email address',
        details: `Please log in with ${invite.invited_email}` 
      });
    }

    console.log('[AcceptInvite] Email verified, creating membership for account:', invite.account_id);

    // Check if user is already a member (idempotent)
    const { data: existingMembership } = await supabase
      .from('account_members')
      .select('id, role')
      .eq('account_id', invite.account_id)
      .eq('user_id', user.id)
      .single();

    if (existingMembership) {
      console.log('[AcceptInvite] User already a member, updating invite status');
      
      // Update invite status anyway
      await supabase
        .from('account_invites')
        .update({
          status: 'accepted',
          accepted_by_user_id: user.id,
          accepted_at: new Date().toISOString(),
        })
        .eq('id', invite.id);

      return res.status(200).json({ 
        ok: true, 
        account_id: invite.account_id,
        message: 'You are already a member of this team'
      });
    }

    // Create membership
    const { error: membershipError } = await supabase
      .from('account_members')
      .insert({
        account_id: invite.account_id,
        user_id: user.id,
        role: invite.role,
      });

    if (membershipError) {
      // Handle unique constraint violation gracefully
      if (membershipError.code === '23505') {
        console.log('[AcceptInvite] Membership already exists (race condition)');
      } else {
        console.error('[AcceptInvite] Membership insert error:', membershipError);
        return res.status(500).json({ error: 'Failed to join team' });
      }
    }

    // Update invite status
    const { error: updateError } = await supabase
      .from('account_invites')
      .update({
        status: 'accepted',
        accepted_by_user_id: user.id,
        accepted_at: new Date().toISOString(),
      })
      .eq('id', invite.id);

    if (updateError) {
      console.error('[AcceptInvite] Invite update error:', updateError);
      // Don't fail - membership was created successfully
    }

    console.log('[AcceptInvite] Successfully joined account:', invite.account_id);

    // Get account name for response
    const { data: account } = await supabase
      .from('accounts')
      .select('name')
      .eq('id', invite.account_id)
      .single();

    return res.status(200).json({ 
      ok: true, 
      account_id: invite.account_id,
      account_name: account?.name,
      role: invite.role,
      message: 'Successfully joined the team!' 
    });

  } catch (error) {
    console.error('[AcceptInvite] Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
}
