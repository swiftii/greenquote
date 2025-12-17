// Vercel Serverless Function: Get Invite Info (Public)
// Route: GET /api/invites/info?token=xxx
//
// Returns basic invite information without requiring authentication
// Used to display invite details on signup page
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
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('[InviteInfo] SUPABASE_SERVICE_ROLE_KEY not configured');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  try {
    const { token } = req.query;

    if (!token || typeof token !== 'string') {
      return res.status(400).json({ error: 'Invite token is required' });
    }

    console.log('[InviteInfo] Looking up invite token:', token.substring(0, 8) + '...');

    // Look up the invite by token
    const { data: invite, error: inviteError } = await supabase
      .from('account_invites')
      .select('id, account_id, invited_email, role, status, expires_at')
      .eq('token', token)
      .single();

    if (inviteError || !invite) {
      console.error('[InviteInfo] Invite lookup error:', inviteError);
      return res.status(404).json({ error: 'Invalid invitation token' });
    }

    // Validate invite status
    if (invite.status !== 'pending') {
      if (invite.status === 'accepted') {
        return res.status(400).json({ error: 'This invitation has already been accepted', status: 'accepted' });
      }
      if (invite.status === 'revoked') {
        return res.status(400).json({ error: 'This invitation has been revoked', status: 'revoked' });
      }
      return res.status(400).json({ error: 'This invitation is no longer valid', status: invite.status });
    }

    // Check expiration
    if (new Date(invite.expires_at) < new Date()) {
      return res.status(400).json({ error: 'This invitation has expired', status: 'expired' });
    }

    // Get account name
    const { data: account } = await supabase
      .from('accounts')
      .select('name')
      .eq('id', invite.account_id)
      .single();

    console.log('[InviteInfo] Returning invite info for:', invite.invited_email);

    return res.status(200).json({
      ok: true,
      invite: {
        email: invite.invited_email,
        role: invite.role,
        account_name: account?.name || 'GreenQuote Pro Team',
        expires_at: invite.expires_at,
      }
    });

  } catch (error) {
    console.error('[InviteInfo] Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
}
