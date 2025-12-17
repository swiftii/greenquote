// Vercel Serverless Function: List Team Members and Invites
// Route: GET /api/invites/list
//
// Returns the list of team members and pending invitations
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
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('[ListTeam] SUPABASE_SERVICE_ROLE_KEY not configured');
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
      console.error('[ListTeam] Auth error:', authError);
      return res.status(401).json({ error: 'Invalid authentication' });
    }

    console.log('[ListTeam] User:', user.id, 'requesting team list');

    // Get the user's account via membership (must be owner/admin)
    const { data: membership, error: membershipError } = await supabase
      .from('account_members')
      .select('account_id, role')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })
      .limit(1)
      .single();

    if (membershipError || !membership) {
      console.error('[ListTeam] Membership lookup error:', membershipError);
      return res.status(403).json({ error: 'Account not found' });
    }

    const accountId = membership.account_id;
    const userRole = membership.role;

    // Get all team members
    const { data: members, error: membersError } = await supabase
      .from('account_members')
      .select('id, user_id, role, created_at')
      .eq('account_id', accountId)
      .order('created_at', { ascending: true });

    if (membersError) {
      console.error('[ListTeam] Members query error:', membersError);
      return res.status(500).json({ error: 'Failed to fetch team members' });
    }

    // Fetch user details for each member
    const memberDetails = await Promise.all(
      members.map(async (member) => {
        const { data: userData } = await supabase.auth.admin.getUserById(member.user_id);
        return {
          id: member.id,
          user_id: member.user_id,
          email: userData?.user?.email || 'Unknown',
          name: userData?.user?.user_metadata?.full_name || userData?.user?.email?.split('@')[0] || 'Unknown',
          role: member.role,
          joined_at: member.created_at,
          is_current_user: member.user_id === user.id,
        };
      })
    );

    // Get pending invites (only for owner/admin)
    let pendingInvites = [];
    if (userRole === 'owner' || userRole === 'admin') {
      const { data: invites, error: invitesError } = await supabase
        .from('account_invites')
        .select('id, invited_email, role, status, expires_at, created_at')
        .eq('account_id', accountId)
        .eq('status', 'pending')
        .gte('expires_at', new Date().toISOString())
        .order('created_at', { descending: true });

      if (!invitesError && invites) {
        pendingInvites = invites;
      }
    }

    console.log('[ListTeam] Returning', memberDetails.length, 'members and', pendingInvites.length, 'pending invites');

    return res.status(200).json({
      ok: true,
      account_id: accountId,
      current_user_role: userRole,
      can_manage_team: ['owner', 'admin'].includes(userRole),
      members: memberDetails,
      pending_invites: pendingInvites,
    });

  } catch (error) {
    console.error('[ListTeam] Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
}
