// Vercel Serverless Function: Get Billing Status
// Route: POST /api/billing/status
//
// Returns the current billing/subscription status for an account
//
// REQUIRED ENV VARS (set in Vercel):
// - SUPABASE_URL: Supabase project URL (server-side)
// - SUPABASE_SERVICE_ROLE_KEY: Supabase service role key (server-side)

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

  try {
    const { accountId } = req.body;

    if (!accountId) {
      return res.status(400).json({ error: 'Account ID is required' });
    }

    // Get account billing info
    const { data: account, error } = await supabase
      .from('accounts')
      .select('stripe_customer_id, stripe_subscription_id, subscription_status, trial_end, current_period_end')
      .eq('id', accountId)
      .single();

    if (error || !account) {
      console.error('[BillingStatus] Error fetching account:', error);
      return res.status(404).json({ error: 'Account not found' });
    }

    // Determine if access should be granted
    const now = new Date();
    const status = account.subscription_status;
    const trialEnd = account.trial_end ? new Date(account.trial_end) : null;
    const periodEnd = account.current_period_end ? new Date(account.current_period_end) : null;

    // Access allowed if:
    // 1. Status is 'trialing' or 'active'
    // 2. OR trial_end is in the future
    const hasActiveSubscription = status === 'trialing' || status === 'active';
    const hasActiveTrialByDate = trialEnd && trialEnd > now;
    const hasAccess = hasActiveSubscription || hasActiveTrialByDate;

    // Calculate days remaining in trial
    let trialDaysRemaining = 0;
    if (trialEnd && trialEnd > now) {
      trialDaysRemaining = Math.ceil((trialEnd - now) / (1000 * 60 * 60 * 24));
    }

    return res.status(200).json({
      hasAccess,
      status: status || 'none',
      isTrialing: status === 'trialing',
      isActive: status === 'active',
      trialEnd: account.trial_end,
      trialDaysRemaining,
      currentPeriodEnd: account.current_period_end,
      hasStripeCustomer: !!account.stripe_customer_id,
      hasSubscription: !!account.stripe_subscription_id,
    });

  } catch (error) {
    console.error('[BillingStatus] Error:', error);
    return res.status(500).json({
      error: 'Failed to get billing status',
      details: error.message,
    });
  }
}
