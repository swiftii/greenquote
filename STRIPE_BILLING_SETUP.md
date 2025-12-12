# GreenQuote Pro - Stripe Billing Setup

## Overview

This document explains how to set up Stripe billing with a 14-day free trial for GreenQuote Pro.

## Required Environment Variables (Vercel)

Add these environment variables in Vercel Project Settings → Environment Variables:

### Stripe Variables

| Variable | Description | How to Get |
|----------|-------------|------------|
| `STRIPE_SECRET_KEY` | Stripe secret API key | Stripe Dashboard → Developers → API keys |
| `STRIPE_WEBHOOK_SECRET` | Webhook signing secret | Stripe Dashboard → Developers → Webhooks |
| `STRIPE_PRO_PRICE_ID` | Price ID for Pro plan | Stripe Dashboard → Products → Create/Select Product → Price ID |

### Supabase Server-Side Variables

| Variable | Description | How to Get |
|----------|-------------|------------|
| `SUPABASE_URL` | Supabase project URL | Supabase Dashboard → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (server-side only) | Supabase Dashboard → Settings → API → service_role key |

### App Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `APP_BASE_URL` | Your app's base URL | `https://app.getgreenquote.com` |

## Stripe Setup Steps

### 1. Create a Product in Stripe

1. Go to Stripe Dashboard → Products
2. Click "Add product"
3. Name: "GreenQuote Pro"
4. Pricing model: Recurring
5. Price: Set your monthly price (e.g., $29/month)
6. Copy the **Price ID** (starts with `price_`)

### 2. Set Up Webhook

1. Go to Stripe Dashboard → Developers → Webhooks
2. Click "Add endpoint"
3. Endpoint URL: `https://app.getgreenquote.com/api/billing/webhook`
4. Select events to listen to:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `checkout.session.completed`
5. Click "Add endpoint"
6. Copy the **Signing secret** (starts with `whsec_`)

### 3. Get API Keys

1. Go to Stripe Dashboard → Developers → API keys
2. Copy the **Secret key** (starts with `sk_test_` for test mode or `sk_live_` for production)

## Supabase Migration

Run the SQL migration in Supabase SQL Editor:

```sql
-- Add billing columns to accounts table
ALTER TABLE accounts 
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT NULL;

ALTER TABLE accounts 
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT NULL;

ALTER TABLE accounts 
ADD COLUMN IF NOT EXISTS subscription_status TEXT NULL;

ALTER TABLE accounts 
ADD COLUMN IF NOT EXISTS trial_end TIMESTAMPTZ NULL;

ALTER TABLE accounts 
ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMPTZ NULL;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_accounts_stripe_customer_id 
  ON accounts(stripe_customer_id) 
  WHERE stripe_customer_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_accounts_stripe_subscription_id 
  ON accounts(stripe_subscription_id) 
  WHERE stripe_subscription_id IS NOT NULL;
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/billing/start-trial` | POST | Start 14-day free trial |
| `/api/billing/create-checkout-session` | POST | Create Stripe Checkout for payment |
| `/api/billing/status` | POST | Get current billing status |
| `/api/billing/webhook` | POST | Stripe webhook handler |

## How It Works

### New User Flow

1. User signs up
2. Account is created in Supabase
3. On first dashboard access, `SubscriptionGuard` checks subscription status
4. If no subscription, automatically calls `/api/billing/start-trial`
5. Trial creates:
   - Stripe Customer
   - Stripe Subscription with 14-day trial
   - Updates Supabase with billing info
6. User has access during trial

### Trial Expiration Flow

1. Trial expires (14 days)
2. Stripe sends `customer.subscription.updated` webhook
3. Status changes to `past_due` or `canceled`
4. User is redirected to `/billing` paywall
5. User clicks "Start Subscription"
6. Redirected to Stripe Checkout
7. Payment successful → webhook updates Supabase
8. User regains access

### Billing Page Access

- `/billing` - Shows subscription status, prompts payment
- `/billing/success` - Confirms successful payment

## Testing

### Test Card Numbers

Use these in test mode:
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- Requires auth: `4000 0025 0000 3155`

### Simulating Trial End

In Stripe Dashboard:
1. Go to Customers → Select customer
2. Find the subscription
3. Click "..." → "Update subscription"
4. Set trial end to "End now"

## Troubleshooting

### Webhook Not Receiving Events

1. Check webhook URL is correct
2. Verify `STRIPE_WEBHOOK_SECRET` is set
3. Check Vercel function logs for errors
4. Test with Stripe CLI: `stripe listen --forward-to localhost:3000/api/billing/webhook`

### Subscription Not Creating

1. Check `STRIPE_PRO_PRICE_ID` is correct
2. Verify `STRIPE_SECRET_KEY` is set
3. Check Vercel function logs

### User Can't Access Dashboard

1. Check `subscription_status` in Supabase
2. Verify `trial_end` is in the future
3. Check billing status endpoint response
