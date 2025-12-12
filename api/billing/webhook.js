// Vercel Serverless Function: Stripe Webhook Handler
// Route: POST /api/billing/webhook
//
// Handles Stripe webhook events to keep Supabase in sync
//
// REQUIRED ENV VARS (set in Vercel):
// - STRIPE_SECRET_KEY: Your Stripe secret key
// - STRIPE_WEBHOOK_SECRET: Your Stripe webhook signing secret
// - SUPABASE_URL: Supabase project URL (server-side)
// - SUPABASE_SERVICE_ROLE_KEY: Supabase service role key (server-side)

import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { buffer } from 'micro';

// Disable body parsing - we need raw body for webhook verification
export const config = {
  api: {
    bodyParser: false,
  },
};

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Initialize Supabase with service role key
const supabase = createClient(
  process.env.SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Update account billing info in Supabase
 */
async function updateAccountBilling(subscriptionId, updates) {
  console.log('[Webhook] Updating account for subscription:', subscriptionId, updates);

  // First, find the account by subscription ID
  const { data: account, error: findError } = await supabase
    .from('accounts')
    .select('id')
    .eq('stripe_subscription_id', subscriptionId)
    .single();

  if (findError || !account) {
    // Try to find by customer ID from subscription metadata
    console.log('[Webhook] Account not found by subscription ID, checking metadata...');
    return null;
  }

  // Update the account
  const { error: updateError } = await supabase
    .from('accounts')
    .update(updates)
    .eq('id', account.id);

  if (updateError) {
    console.error('[Webhook] Error updating account:', updateError);
    return null;
  }

  console.log('[Webhook] Account updated successfully:', account.id);
  return account.id;
}

/**
 * Find account by Stripe customer ID
 */
async function findAccountByCustomerId(customerId) {
  const { data: account, error } = await supabase
    .from('accounts')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single();

  if (error || !account) {
    console.log('[Webhook] Account not found for customer:', customerId);
    return null;
  }

  return account.id;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.error('STRIPE_WEBHOOK_SECRET is not configured');
    return res.status(500).json({ error: 'Webhook secret not configured' });
  }

  try {
    // Get raw body for signature verification
    const rawBody = await buffer(req);
    const sig = req.headers['stripe-signature'];

    // Verify webhook signature
    let event;
    try {
      event = stripe.webhooks.constructEvent(
        rawBody,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error('[Webhook] Signature verification failed:', err.message);
      return res.status(400).json({ error: 'Invalid signature' });
    }

    console.log('[Webhook] Received event:', event.type, event.id);

    // Handle subscription events
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        const accountId = subscription.metadata?.account_id;

        const updates = {
          stripe_subscription_id: subscription.id,
          subscription_status: subscription.status,
          trial_end: subscription.trial_end 
            ? new Date(subscription.trial_end * 1000).toISOString() 
            : null,
          current_period_end: subscription.current_period_end 
            ? new Date(subscription.current_period_end * 1000).toISOString() 
            : null,
        };

        if (accountId) {
          // Update by account ID from metadata
          const { error } = await supabase
            .from('accounts')
            .update(updates)
            .eq('id', accountId);

          if (error) {
            console.error('[Webhook] Error updating by account_id:', error);
          } else {
            console.log('[Webhook] Updated account:', accountId);
          }
        } else {
          // Fallback: update by subscription ID or customer ID
          await updateAccountBilling(subscription.id, updates);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const accountId = subscription.metadata?.account_id;

        const updates = {
          subscription_status: 'canceled',
          current_period_end: subscription.current_period_end 
            ? new Date(subscription.current_period_end * 1000).toISOString() 
            : null,
        };

        if (accountId) {
          await supabase
            .from('accounts')
            .update(updates)
            .eq('id', accountId);
        } else {
          await updateAccountBilling(subscription.id, updates);
        }
        
        console.log('[Webhook] Subscription canceled');
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object;
        if (invoice.subscription) {
          // Get subscription details
          const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
          const accountId = subscription.metadata?.account_id;

          const updates = {
            subscription_status: subscription.status,
            current_period_end: subscription.current_period_end 
              ? new Date(subscription.current_period_end * 1000).toISOString() 
              : null,
          };

          if (accountId) {
            await supabase
              .from('accounts')
              .update(updates)
              .eq('id', accountId);
          } else {
            await updateAccountBilling(subscription.id, updates);
          }

          console.log('[Webhook] Payment succeeded, status:', subscription.status);
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        if (invoice.subscription) {
          const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
          const accountId = subscription.metadata?.account_id;

          const updates = {
            subscription_status: subscription.status, // Will be 'past_due' or 'unpaid'
          };

          if (accountId) {
            await supabase
              .from('accounts')
              .update(updates)
              .eq('id', accountId);
          } else {
            await updateAccountBilling(subscription.id, updates);
          }

          console.log('[Webhook] Payment failed, status:', subscription.status);
        }
        break;
      }

      case 'checkout.session.completed': {
        const session = event.data.object;
        const accountId = session.metadata?.account_id;

        if (session.subscription && accountId) {
          // Get subscription details
          const subscription = await stripe.subscriptions.retrieve(session.subscription);

          await supabase
            .from('accounts')
            .update({
              stripe_customer_id: session.customer,
              stripe_subscription_id: subscription.id,
              subscription_status: subscription.status,
              trial_end: subscription.trial_end 
                ? new Date(subscription.trial_end * 1000).toISOString() 
                : null,
              current_period_end: subscription.current_period_end 
                ? new Date(subscription.current_period_end * 1000).toISOString() 
                : null,
            })
            .eq('id', accountId);

          console.log('[Webhook] Checkout completed, subscription:', subscription.id);
        }
        break;
      }

      default:
        console.log('[Webhook] Unhandled event type:', event.type);
    }

    return res.status(200).json({ received: true });

  } catch (error) {
    console.error('[Webhook] Error:', error);
    return res.status(500).json({ error: 'Webhook processing failed' });
  }
}
