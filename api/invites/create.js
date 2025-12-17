// Vercel Serverless Function: Create Team Invite
// Route: POST /api/invites/create
//
// Creates an invitation for a new team member to join an account
//
// REQUIRED ENV VARS:
// - SUPABASE_URL: Supabase project URL
// - SUPABASE_SERVICE_ROLE_KEY: Supabase service role key
// - RESEND_API_KEY: Resend API key for sending emails
// - RESEND_FROM_EMAIL: Email sender address
// - APP_BASE_URL: Base URL (e.g., https://app.getgreenquote.com)

import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import crypto from 'crypto';

// Initialize Supabase with service role key
const supabase = createClient(
  process.env.SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Generate a secure random token
 */
function generateToken(length = 32) {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Generate invite email HTML
 */
function generateInviteEmailHtml({ inviterName, accountName, inviteUrl, role }) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>You're Invited to Join ${accountName}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f3f4f6;">
  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f3f4f6; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table cellpadding="0" cellspacing="0" border="0" width="500" style="max-width: 500px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #16a34a 0%, #22c55e 100%); padding: 40px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">
                🌱 GreenQuote Pro
              </h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 14px;">
                Team Invitation
              </p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="color: #111827; margin: 0 0 20px 0; font-size: 22px; text-align: center;">
                You're Invited!
              </h2>
              <p style="color: #4b5563; margin: 0 0 25px 0; font-size: 16px; line-height: 1.6; text-align: center;">
                <strong>${inviterName}</strong> has invited you to join <strong>${accountName}</strong> on GreenQuote Pro as a <strong>${role}</strong>.
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${inviteUrl}" style="display: inline-block; background-color: #16a34a; color: #ffffff; text-decoration: none; padding: 14px 40px; border-radius: 8px; font-size: 16px; font-weight: 600;">
                  Accept Invitation
                </a>
              </div>
              
              <p style="color: #6b7280; margin: 25px 0 0 0; font-size: 14px; text-align: center;">
                This invitation will expire in 7 days.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 25px 40px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="color: #9ca3af; margin: 0; font-size: 13px;">
                If you didn't expect this invitation, you can safely ignore this email.
              </p>
              <p style="color: #9ca3af; margin: 10px 0 0 0; font-size: 12px;">
                Powered by <a href="https://getgreenquote.com" style="color: #16a34a; text-decoration: none;">GreenQuote Pro</a>
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Validate environment variables
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('[Invites] SUPABASE_SERVICE_ROLE_KEY not configured');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM_EMAIL) {
    console.error('[Invites] Resend not configured');
    return res.status(500).json({ error: 'Email service not configured' });
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
      console.error('[Invites] Auth error:', authError);
      return res.status(401).json({ error: 'Invalid authentication' });
    }

    const { invited_email, role = 'member' } = req.body;

    // Validate input
    if (!invited_email || typeof invited_email !== 'string') {
      return res.status(400).json({ error: 'Email address is required' });
    }

    const normalizedEmail = invited_email.toLowerCase().trim();
    if (!normalizedEmail.includes('@')) {
      return res.status(400).json({ error: 'Invalid email address' });
    }

    if (!['admin', 'member'].includes(role)) {
      return res.status(400).json({ error: 'Role must be admin or member' });
    }

    console.log('[Invites] Creating invite for:', normalizedEmail, 'by user:', user.id);

    // Get the user's account via membership
    const { data: membership, error: membershipError } = await supabase
      .from('account_members')
      .select('account_id, role')
      .eq('user_id', user.id)
      .in('role', ['owner', 'admin'])
      .order('created_at', { ascending: true })
      .limit(1)
      .single();

    if (membershipError || !membership) {
      console.error('[Invites] Membership lookup error:', membershipError);
      return res.status(403).json({ error: 'You must be an owner or admin to invite team members' });
    }

    const accountId = membership.account_id;

    // Get account details
    const { data: account, error: accountError } = await supabase
      .from('accounts')
      .select('id, name')
      .eq('id', accountId)
      .single();

    if (accountError || !account) {
      console.error('[Invites] Account lookup error:', accountError);
      return res.status(404).json({ error: 'Account not found' });
    }

    // Check if email is already a member
    const { data: existingUser } = await supabase.auth.admin.listUsers();
    const targetUser = existingUser?.users?.find(
      u => u.email?.toLowerCase() === normalizedEmail
    );

    if (targetUser) {
      const { data: existingMembership } = await supabase
        .from('account_members')
        .select('id')
        .eq('account_id', accountId)
        .eq('user_id', targetUser.id)
        .single();

      if (existingMembership) {
        return res.status(400).json({ error: 'This user is already a member of your team' });
      }
    }

    // Check for existing pending invite
    const { data: existingInvite } = await supabase
      .from('account_invites')
      .select('id, status, expires_at')
      .eq('account_id', accountId)
      .eq('invited_email', normalizedEmail)
      .eq('status', 'pending')
      .gte('expires_at', new Date().toISOString())
      .single();

    if (existingInvite) {
      return res.status(400).json({ error: 'An active invitation already exists for this email' });
    }

    // Generate invite token
    const inviteToken = generateToken(32);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    // Create invite record
    const { data: invite, error: inviteError } = await supabase
      .from('account_invites')
      .insert({
        account_id: accountId,
        invited_email: normalizedEmail,
        role: role,
        token: inviteToken,
        status: 'pending',
        invited_by_user_id: user.id,
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (inviteError) {
      console.error('[Invites] Insert error:', inviteError);
      return res.status(500).json({ error: 'Failed to create invitation' });
    }

    console.log('[Invites] Invite created:', invite.id);

    // Build invite URL
    const baseUrl = process.env.APP_BASE_URL || 'https://app.getgreenquote.com';
    const inviteUrl = `${baseUrl}/accept-invite?token=${inviteToken}`;

    // Get inviter name
    const inviterName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'A team member';

    // Send invite email
    const emailHtml = generateInviteEmailHtml({
      inviterName,
      accountName: account.name || 'GreenQuote Pro Team',
      inviteUrl,
      role: role === 'admin' ? 'Admin' : 'Team Member',
    });

    const { error: emailError } = await resend.emails.send({
      from: `GreenQuote Pro <${process.env.RESEND_FROM_EMAIL}>`,
      to: normalizedEmail,
      subject: `You're invited to join ${account.name || 'a team'} on GreenQuote Pro`,
      html: emailHtml,
    });

    if (emailError) {
      console.error('[Invites] Email error:', emailError);
      // Don't fail - invite is created, email just didn't send
      return res.status(200).json({ 
        ok: true, 
        invite_id: invite.id,
        warning: 'Invitation created but email could not be sent' 
      });
    }

    console.log('[Invites] Email sent to:', normalizedEmail);

    return res.status(200).json({ 
      ok: true, 
      invite_id: invite.id,
      message: 'Invitation sent successfully' 
    });

  } catch (error) {
    console.error('[Invites] Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
}
