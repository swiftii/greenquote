// Vercel Serverless Function: Create Stripe Customer Portal Session
// Route: POST /api/billing/portal
//
// Creates a Stripe Billing Portal session for:
// - Updating payment method
// - Changing plans (if configured)
// - Canceling subscription
//
// REQUIRED ENV VARS (set in Vercel):
// - STRIPE_SECRET_KEY: Your Stripe secret key
// - APP_BASE_URL: The base URL of the app (e.g., https://app.getgreenquote.com)
// - SUPABASE_URL: Supabase project URL (server-side)
// - SUPABASE_SERVICE_ROLE_KEY: Supabase service role key (server-side)
//
// NOTE: Ensure Stripe Customer Portal is configured in Stripe Dashboard:
// Settings → Billing → Customer portal
// Enable: Payment method updates, Plan changes (optional), Cancellation

import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Initialize Supabase with service role key
const supabase = createClient(
  process.env.SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    console.error('[Portal] STRIPE_SECRET_KEY is not configured');
    return res.status(500).json({ error: 'Stripe is not configured' });
  }

  try {
    const { accountId, originUrl } = req.body;

    if (!accountId) {
      return res.status(400).json({ error: 'Account ID is required' });
    }

    console.log('[Portal] Creating portal session for account:', accountId);

    // Get account from Supabase
    const { data: account, error: fetchError } = await supabase
      .from('accounts')
      .select('stripe_customer_id')
      .eq('id', accountId)
      .single();

    if (fetchError || !account) {
      console.error('[Portal] Error fetching account:', fetchError);
      return res.status(404).json({ error: 'Account not found' });
    }

    if (!account.stripe_customer_id) {
      console.error('[Portal] No Stripe customer ID for account:', accountId);
      return res.status(400).json({ 
        error: 'No billing account found. Please contact support.',
        code: 'NO_STRIPE_CUSTOMER'
      });
    }

    // Use provided origin URL or fallback to APP_BASE_URL
    const baseUrl = originUrl || process.env.APP_BASE_URL || 'https://app.getgreenquote.com';
    const returnUrl = `${baseUrl}/dashboard`;

    console.log('[Portal] Return URL:', returnUrl);

    // Create Billing Portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: account.stripe_customer_id,
      return_url: returnUrl,
    });

    console.log('[Portal] Session created:', session.id);

    return res.status(200).json({
      url: session.url,
    });

  } catch (error) {
    console.error('[Portal] Error:', error);
    
    // Handle specific Stripe errors
    if (error.type === 'StripeInvalidRequestError') {
      return res.status(400).json({
        error: 'Unable to open billing portal. Please contact support.',
        details: error.message,
      });
    }
    
    return res.status(500).json({
      error: 'Failed to create portal session',
      details: error.message,
    });
  }
}
