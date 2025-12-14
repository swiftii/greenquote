# Widget Integration Setup

This document explains how to set up the GreenQuote Pro widget integration that allows customers to embed a quote widget on their websites.

## Overview

The widget integration consists of:
1. **widget_installations table** - Maps public widget IDs to accounts
2. **Widget Config API** - Returns account-specific pricing for the widget
3. **Widget Save Quote API** - Saves widget-generated quotes to the account
4. **Pro App Settings** - Embed code generator for customers

## Required Environment Variables

Add these to your Vercel project environment variables:

### Supabase Configuration (Required)

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Important Security Notes:**
- `SUPABASE_SERVICE_ROLE_KEY` is a secret key with full database access
- NEVER expose this key in client-side code
- Only use it in server-side API endpoints (Vercel functions)
- The frontend should continue using `REACT_APP_SUPABASE_ANON_KEY`

### Where to Find These Keys

1. Go to your Supabase project dashboard
2. Navigate to Settings → API
3. Copy the "Project URL" for `SUPABASE_URL`
4. Copy the "service_role" key (under "Project API keys") for `SUPABASE_SERVICE_ROLE_KEY`

## Database Setup

Run the SQL migration in your Supabase SQL Editor:

```sql
-- File: SUPABASE_WIDGET_INSTALLATIONS.sql
```

This creates:
- `widget_installations` table with RLS policies
- Adds `source` column to `quotes` table

## API Endpoints

### GET /api/widget/config

Fetches account pricing configuration for a widget.

**Query Parameters:**
- `wid` (required): Public widget ID (e.g., `wg_abc123xyz...`)

**Response:**
```json
{
  "accountId": "uuid",
  "businessName": "Your Lawn Care Co",
  "pricing": {
    "minPricePerVisit": 50,
    "pricePerSqFt": 0.01,
    "useTieredPricing": true,
    "tiers": [...]
  },
  "addons": [...],
  "frequency": {...}
}
```

### POST /api/widget/save-quote

Saves a quote generated from the widget.

**Request Body:**
```json
{
  "widgetId": "wg_...",
  "accountId": "uuid",
  "customerName": "John Doe",
  "customerEmail": "john@example.com",
  "customerPhone": "555-1234",
  "propertyAddress": "123 Main St",
  "areaSqFt": 8000,
  "frequency": "bi_weekly",
  "totalPricePerVisit": 85,
  ...
}
```

## How It Works

1. **Account Setup:**
   - When a user visits Settings, a `widget_installation` is auto-created
   - A unique `public_widget_id` (e.g., `wg_abc123...`) is generated

2. **Embed Code:**
   - Customer copies iframe embed code from Settings
   - Code contains their unique widget ID

3. **Widget Load:**
   - Widget reads `wid` from URL params
   - Calls `/api/widget/config?wid=...` to get pricing
   - Displays account-specific pricing and add-ons

4. **Quote Submission:**
   - Widget collects customer info and calculates price
   - Calls `/api/widget/save-quote` to save
   - Quote appears in Pro App pending quotes with `source='widget'`

## Security Considerations

1. **Public Widget ID:**
   - Random, non-guessable token
   - Does not expose internal account_id in HTML
   - Can be regenerated if compromised

2. **API Security:**
   - Config endpoint is public but only returns pricing info
   - Save endpoint validates widget ownership before inserting
   - Service role key used only server-side

3. **RLS Policies:**
   - Users can only manage their own widget installations
   - Widget APIs use service role to bypass RLS (server-side only)

## Testing Checklist

- [ ] Run SQL migration in Supabase
- [ ] Add env vars to Vercel
- [ ] Create test account
- [ ] Verify widget_installation row exists
- [ ] Settings shows embed snippet
- [ ] Copy button works
- [ ] Load iframe URL with wid
- [ ] Widget loads config correctly
- [ ] Generate quote from widget
- [ ] Quote appears in Pro App pending quotes with source='widget'
