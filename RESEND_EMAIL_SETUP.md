# Resend Email Integration Guide

## Overview

GreenQuote Pro uses [Resend](https://resend.com) to send professional quote emails to customers when a quote is created.

## Required Environment Variables

Add these to your **Vercel Environment Variables**:

| Variable | Required | Description |
|----------|----------|-------------|
| `RESEND_API_KEY` | Yes | Your Resend API key |
| `RESEND_FROM_EMAIL` | Yes | Verified sender email (e.g., `quotes@getgreenquote.com`) |
| `RESEND_BCC_EMAIL` | No | Optional BCC for internal tracking |

## Setup Steps

### 1. Create a Resend Account

1. Go to [resend.com](https://resend.com) and sign up
2. Get your API key from the dashboard

### 2. Verify Your Domain

1. In Resend dashboard, go to "Domains"
2. Add your domain (e.g., `getgreenquote.com`)
3. Add the required DNS records:
   - SPF record
   - DKIM records
   - MX record (optional)
4. Wait for verification (usually a few minutes)

### 3. Set Environment Variables in Vercel

1. Go to your Vercel project
2. Navigate to **Settings → Environment Variables**
3. Add the variables:
   ```
   RESEND_API_KEY=re_xxxxxxxxxx
   RESEND_FROM_EMAIL=quotes@getgreenquote.com
   RESEND_BCC_EMAIL=admin@getgreenquote.com  (optional)
   ```
4. Redeploy the app

## How It Works

### Email Flow

1. User creates a quote in `/quote`
2. Enters customer info including email
3. Clicks "Save & Email Quote"
4. Backend API sends email via Resend
5. Customer receives professional quote email

### Email Template

The quote email includes:
- Business name (from account settings)
- Customer greeting
- Property address and lawn area
- Quote breakdown:
  - Base service price
  - Selected add-ons with prices
- Total price per visit
- Monthly estimate
- Call-to-action to accept

### Reply-To

- Emails are sent from your verified domain
- Reply-To is set to the GreenQuote user's email
- Customer replies go directly to the business owner

## API Endpoint

**POST** `/api/send-quote-email`

Request body:
```json
{
  "customerEmail": "customer@example.com",
  "customerName": "John Smith",
  "businessName": "ABC Lawn Care",
  "replyToEmail": "owner@abclawncare.com",
  "propertyAddress": "123 Main St",
  "areaSqFt": 5000,
  "basePrice": 75,
  "addons": [{"name": "Mulch", "price": 25}],
  "totalPerVisit": 100,
  "frequency": "Weekly",
  "monthlyEstimate": 400
}
```

Response:
```json
{
  "success": true,
  "messageId": "xxxx-xxxx-xxxx",
  "message": "Quote email sent successfully"
}
```

## Troubleshooting

### "Email service not configured"
- Check that `RESEND_API_KEY` is set in Vercel
- Ensure the variable is available in the production environment
- Redeploy after adding variables

### "Failed to send email"
- Verify your Resend API key is valid
- Check that your domain is verified in Resend
- Ensure `RESEND_FROM_EMAIL` uses a verified domain

### Emails going to spam
- Make sure DNS records are properly configured
- Use a professional sender name
- Include both HTML and plain text versions (already implemented)

## Files

| File | Purpose |
|------|---------|
| `/api/send-quote-email.js` | Vercel serverless function for sending emails |
| `/frontend/src/services/emailService.js` | Frontend service for API calls |
| `/frontend/src/pages/Quote.js` | Quote form with email integration |

## Testing

1. Use a test email you control
2. Create a quote with all fields filled
3. Check the email arrives with correct:
   - Subject line
   - Business name
   - Quote details
   - Reply-To header
4. Test replying to verify it goes to the right place
