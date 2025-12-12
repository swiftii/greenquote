// Vercel Serverless Function: Create Stripe Customer Portal Session
// Route: POST /api/billing/portal
//
// Creates a Stripe Billing Portal session for:
// - Updating payment method
// - Changing plans (if configured)
// - Canceling subscription
//
// If no Stripe customer exists, one will be auto-created.
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

export default async function handler(req, res) {
  // Diagnostic logging (safe - no secrets)
  console.log('[Portal] Request method:', req.method);
  console.log('[Portal] STRIPE_SECRET_KEY exists:', !!process.env.STRIPE_SECRET_KEY);
  console.log('[Portal] APP_BASE_URL:', process.env.APP_BASE_URL || 'NOT SET');
  console.log('[Portal] SUPABASE_URL exists:', !!process.env.SUPABASE_URL);
  console.log('[Portal] REACT_APP_SUPABASE_URL exists:', !!process.env.REACT_APP_SUPABASE_URL);
  console.log('[Portal] SUPABASE_SERVICE_ROLE_KEY exists:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  // Validate environment variables
  if (!process.env.STRIPE_SECRET_KEY) {
    console.error('[Portal] STRIPE_SECRET_KEY is not configured');
    return res.status(500).json({ ok: false, error: 'Server configuration error: STRIPE_SECRET_KEY not set' });
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    console.error('[Portal] SUPABASE_URL is not configured');
    return res.status(500).json({ ok: false, error: 'Server configuration error: SUPABASE_URL not set' });
  }

  if (!serviceRoleKey) {
    console.error('[Portal] SUPABASE_SERVICE_ROLE_KEY is not configured');
    return res.status(500).json({ ok: false, error: 'Server configuration error: SUPABASE_SERVICE_ROLE_KEY not set' });
  }

  // Initialize Stripe and Supabase inside handler
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  try {
    const { accountId, userEmail, accountName, originUrl } = req.body || {};

    console.log('[Portal] Account ID:', accountId);
    console.log('[Portal] User email provided:', !!userEmail);
    console.log('[Portal] Origin URL:', originUrl);

    if (!accountId) {
      return res.status(400).json({ ok: false, error: 'Account ID is required' });
    }

    // Get account from Supabase
    const { data: account, error: fetchError } = await supabase
      .from('accounts')
      .select('stripe_customer_id, name, owner_user_id')
      .eq('id', accountId)
      .single();

    if (fetchError) {
      console.error('[Portal] Supabase fetch error:', fetchError);
      return res.status(404).json({ 
        ok: false, 
        error: 'Account not found or database error',
        details: fetchError.message 
      });
    }

    if (!account) {
      return res.status(404).json({ ok: false, error: 'Account not found' });
    }

    console.log('[Portal] Account found, stripe_customer_id exists:', !!account.stripe_customer_id);

    let customerId = account.stripe_customer_id;

    // Auto-create Stripe customer if not exists
    if (!customerId) {
      console.log('[Portal] No Stripe customer ID found, creating new customer...');
      
      if (!userEmail) {
        return res.status(400).json({ 
          ok: false,
          error: 'User email is required to create billing account',
          code: 'EMAIL_REQUIRED'
        });
      }

      try {
        const customer = await stripe.customers.create({
          email: userEmail,
          name: accountName || account.name || userEmail,
          metadata: {
            account_id: accountId,
            owner_user_id: account.owner_user_id || '',
          },
        });

        customerId = customer.id;
        console.log('[Portal] Created Stripe customer:', customerId);

        // Save the new stripe_customer_id to the account
        const { error: updateError } = await supabase
          .from('accounts')
          .update({ stripe_customer_id: customerId })
          .eq('id', accountId);

        if (updateError) {
          console.error('[Portal] Error saving stripe_customer_id:', updateError);
          // Continue anyway - customer was created in Stripe
        } else {
          console.log('[Portal] Saved stripe_customer_id to account');
        }
      } catch (createError) {
        console.error('[Portal] Error creating Stripe customer:', createError);
        return res.status(500).json({
          ok: false,
          error: 'Failed to create billing account. Please try again.',
          details: String(createError?.message || createError),
        });
      }
    }

    // Use provided origin URL or fallback to APP_BASE_URL
    const baseUrl = originUrl || process.env.APP_BASE_URL || 'https://app.getgreenquote.com';
    const returnUrl = `${baseUrl}/dashboard`;

    console.log('[Portal] Return URL:', returnUrl);
    console.log('[Portal] Creating portal session for customer:', customerId);

    // Create Billing Portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });

    console.log('[Portal] Session created:', session.id);
    console.log('[Portal] Session URL exists:', !!session.url);

    return res.status(200).json({
      ok: true,
      url: session.url,
    });

  } catch (error) {
    console.error('[Portal] Unexpected error:', error);
    
    // Handle specific Stripe errors
    if (error.type === 'StripeInvalidRequestError') {
      return res.status(400).json({
        ok: false,
        error: 'Unable to open billing portal. Please contact support.',
        details: String(error?.message || error),
      });
    }
    
    return res.status(500).json({
      ok: false,
      error: 'Failed to create portal session',
      details: String(error?.message || error),
    });
  }
}
