// Vercel Serverless Function: Start Trial or Get Subscription Status
// Route: POST /api/billing/start-trial
//
// This endpoint:
// 1. Creates a Stripe customer if needed
// 2. Creates a Pro subscription with 14-day trial
// 3. Updates the account in Supabase with billing info
//
// REQUIRED ENV VARS (set in Vercel):
// - STRIPE_SECRET_KEY: Your Stripe secret key
// - STRIPE_PRO_PRICE_ID: The Price ID for the Pro plan
// - SUPABASE_URL: Supabase project URL (server-side)
// - SUPABASE_SERVICE_ROLE_KEY: Supabase service role key (server-side)

import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Initialize Supabase with service role key for server-side operations
const supabase = createClient(
  process.env.SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check for required env vars
  if (!process.env.STRIPE_SECRET_KEY) {
    console.error('STRIPE_SECRET_KEY is not configured');
    return res.status(500).json({ error: 'Stripe is not configured' });
  }

  if (!process.env.STRIPE_PRO_PRICE_ID) {
    console.error('STRIPE_PRO_PRICE_ID is not configured');
    return res.status(500).json({ error: 'Stripe price not configured' });
  }

  try {
    const { accountId, userId, userEmail, accountName } = req.body;

    if (!accountId) {
      return res.status(400).json({ error: 'Account ID is required' });
    }

    console.log('[StartTrial] Processing for account:', accountId);

    // Get current account from Supabase
    const { data: account, error: fetchError } = await supabase
      .from('accounts')
      .select('*')
      .eq('id', accountId)
      .single();

    if (fetchError || !account) {
      console.error('[StartTrial] Error fetching account:', fetchError);
      return res.status(404).json({ error: 'Account not found' });
    }

    // If subscription already exists, check its status
    if (account.stripe_subscription_id) {
      const status = account.subscription_status;
      
      if (status === 'trialing' || status === 'active') {
        return res.status(200).json({
          ok: true,
          status: status,
          message: `Subscription is ${status}`,
          trialEnd: account.trial_end,
          currentPeriodEnd: account.current_period_end,
        });
      }
      
      // Subscription exists but is not active/trialing - need checkout
      return res.status(200).json({
        ok: false,
        status: status,
        needsCheckout: true,
        message: 'Subscription needs renewal',
      });
    }

    // No subscription yet - create one with trial
    console.log('[StartTrial] Creating new subscription with trial...');

    // Step 1: Create or get Stripe customer
    let customerId = account.stripe_customer_id;

    if (!customerId) {
      console.log('[StartTrial] Creating Stripe customer...');
      const customer = await stripe.customers.create({
        email: userEmail,
        name: accountName || userEmail,
        metadata: {
          account_id: accountId,
          user_id: userId || '',
        },
      });
      customerId = customer.id;
      console.log('[StartTrial] Created Stripe customer:', customerId);
    }

    // Step 2: Create subscription with 14-day trial
    console.log('[StartTrial] Creating subscription with trial...');
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: process.env.STRIPE_PRO_PRICE_ID }],
      trial_period_days: 14,
      payment_behavior: 'default_incomplete',
      payment_settings: {
        save_default_payment_method: 'on_subscription',
      },
      expand: ['latest_invoice.payment_intent'],
      metadata: {
        account_id: accountId,
      },
    });

    console.log('[StartTrial] Subscription created:', subscription.id, 'Status:', subscription.status);

    // Step 3: Update Supabase with billing info
    const { error: updateError } = await supabase
      .from('accounts')
      .update({
        stripe_customer_id: customerId,
        stripe_subscription_id: subscription.id,
        subscription_status: subscription.status,
        trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
        current_period_end: subscription.current_period_end ? new Date(subscription.current_period_end * 1000).toISOString() : null,
      })
      .eq('id', accountId);

    if (updateError) {
      console.error('[StartTrial] Error updating account:', updateError);
      // Don't fail - subscription was created, we can sync later via webhook
    }

    return res.status(200).json({
      ok: true,
      status: subscription.status,
      subscriptionId: subscription.id,
      trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
      currentPeriodEnd: subscription.current_period_end ? new Date(subscription.current_period_end * 1000).toISOString() : null,
      message: 'Trial started successfully',
    });

  } catch (error) {
    console.error('[StartTrial] Error:', error);
    return res.status(500).json({
      error: 'Failed to start trial',
      details: error.message,
    });
  }
}
