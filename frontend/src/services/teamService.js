import { supabase } from '@/lib/supabaseClient';

// Use relative URLs for same-origin API calls on Vercel
const BACKEND_URL = '';

/**
 * Team Service
 * Handles team member and invite operations
 */

/**
 * Get auth token for API calls
 */
async function getAuthToken() {
  const session = await supabase.auth.getSession();
  return session.data.session?.access_token;
}

/**
 * Send team invitation
 * @param {string} email - Email to invite
 * @param {string} role - Role (admin or member)
 */
export async function sendInvite(email, role = 'member') {
  const token = await getAuthToken();
  if (!token) throw new Error('Not authenticated');
  
  const response = await fetch(`${BACKEND_URL}/api/invites/create`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      invited_email: email,
      role: role,
    }),
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || 'Failed to send invitation');
  }
  
  return data;
}

/**
 * Accept team invitation
 * @param {string} inviteToken - Invitation token from URL
 */
export async function acceptInvite(inviteToken) {
  const authToken = await getAuthToken();
  if (!authToken) throw new Error('Not authenticated');
  
  const response = await fetch(`${BACKEND_URL}/api/invites/accept`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ token: inviteToken }),
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || data.details || 'Failed to accept invitation');
  }
  
  return data;
}

/**
 * List team members and pending invites
 */
export async function listTeam() {
  const token = await getAuthToken();
  if (!token) throw new Error('Not authenticated');
  
  const response = await fetch(`${BACKEND_URL}/api/invites/list`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || 'Failed to load team');
  }
  
  return data;
}

/**
 * Revoke a pending invitation
 * @param {string} inviteId - Invite ID to revoke
 */
export async function revokeInvite(inviteId) {
  const token = await getAuthToken();
  if (!token) throw new Error('Not authenticated');
  
  const response = await fetch(`${BACKEND_URL}/api/invites/revoke`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ invite_id: inviteId }),
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || 'Failed to revoke invitation');
  }
  
  return data;
}
