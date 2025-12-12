// Vercel Serverless Function: Create Stripe Checkout Session
// Route: POST /api/billing/create-checkout-session
//
// Creates a Stripe Checkout Session for subscribing to the Pro plan
//
// REQUIRED ENV VARS (set in Vercel):
// - STRIPE_SECRET_KEY: Your Stripe secret key
// - STRIPE_PRO_PRICE_ID: The Price ID for the Pro plan
// - APP_BASE_URL: The base URL of the app (e.g., https://app.getgreenquote.com)
// - SUPABASE_URL: Supabase project URL (server-side)
// - SUPABASE_SERVICE_ROLE_KEY: Supabase service role key (server-side)

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
    console.error('STRIPE_SECRET_KEY is not configured');
    return res.status(500).json({ error: 'Stripe is not configured' });
  }

  if (!process.env.STRIPE_PRO_PRICE_ID) {
    console.error('STRIPE_PRO_PRICE_ID is not configured');
    return res.status(500).json({ error: 'Stripe price not configured' });
  }

  try {
    const { accountId, userId, userEmail, accountName, originUrl } = req.body;

    if (!accountId) {
      return res.status(400).json({ error: 'Account ID is required' });
    }

    // Use provided origin URL or fallback to APP_BASE_URL
    const baseUrl = originUrl || process.env.APP_BASE_URL || 'https://app.getgreenquote.com';
    const successUrl = `${baseUrl}/billing/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${baseUrl}/billing`;

    console.log('[CreateCheckout] Creating session for account:', accountId);
    console.log('[CreateCheckout] Success URL:', successUrl);
    console.log('[CreateCheckout] Cancel URL:', cancelUrl);

    // Get or create Stripe customer
    const { data: account } = await supabase
      .from('accounts')
      .select('stripe_customer_id')
      .eq('id', accountId)
      .single();

    let customerId = account?.stripe_customer_id;

    if (!customerId) {
      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email: userEmail,
        name: accountName || userEmail,
        metadata: {
          account_id: accountId,
          user_id: userId || '',
        },
      });
      customerId = customer.id;

      // Save customer ID to account
      await supabase
        .from('accounts')
        .update({ stripe_customer_id: customerId })
        .eq('id', accountId);

      console.log('[CreateCheckout] Created new customer:', customerId);
    }

    // Create Checkout Session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: process.env.STRIPE_PRO_PRICE_ID,
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      subscription_data: {
        metadata: {
          account_id: accountId,
        },
      },
      metadata: {
        account_id: accountId,
      },
    });

    console.log('[CreateCheckout] Session created:', session.id);

    return res.status(200).json({
      url: session.url,
      sessionId: session.id,
    });

  } catch (error) {
    console.error('[CreateCheckout] Error:', error);
    return res.status(500).json({
      error: 'Failed to create checkout session',
      details: error.message,
    });
  }
}
