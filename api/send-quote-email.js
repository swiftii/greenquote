// Vercel Serverless Function for sending quote emails via Resend
// Route: POST /api/send-quote-email

import { Resend } from 'resend';

// Initialize Resend with API key from environment
const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Generate HTML email template for a quote
 */
function generateQuoteEmailHtml({
  customerName,
  businessName,
  propertyAddress,
  areaSqFt,
  basePrice,
  addons,
  totalPerVisit,
  frequency,
  monthlyEstimate,
}) {
  const addonsHtml = addons && addons.length > 0
    ? addons.map(addon => `
      <tr>
        <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
          ${addon.name}
        </td>
        <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">
          +$${parseFloat(addon.price).toFixed(2)}
        </td>
      </tr>
    `).join('')
    : '';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Quote from ${businessName}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f3f4f6; padding: 20px 0;">
    <tr>
      <td align="center">
        <table cellpadding="0" cellspacing="0" border="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #16a34a 0%, #22c55e 100%); padding: 30px 40px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">
                🌱 ${businessName}
              </h1>
              <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 14px;">
                Professional Lawn Care Services
              </p>
            </td>
          </tr>
          
          <!-- Greeting -->
          <tr>
            <td style="padding: 30px 40px 20px 40px;">
              <h2 style="color: #111827; margin: 0 0 10px 0; font-size: 20px;">
                Hello ${customerName},
              </h2>
              <p style="color: #6b7280; margin: 0; font-size: 15px; line-height: 1.6;">
                Thank you for your interest in our lawn care services! Below is your personalized quote based on your property details.
              </p>
            </td>
          </tr>
          
          <!-- Property Details -->
          <tr>
            <td style="padding: 0 40px 20px 40px;">
              <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px;">
                <h3 style="color: #374151; margin: 0 0 12px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">
                  Property Details
                </h3>
                <p style="color: #111827; margin: 0 0 8px 0; font-size: 15px;">
                  <strong>Address:</strong> ${propertyAddress || 'Not specified'}
                </p>
                <p style="color: #111827; margin: 0; font-size: 15px;">
                  <strong>Estimated Lawn Area:</strong> ${Number(areaSqFt).toLocaleString()} sq ft
                </p>
              </div>
            </td>
          </tr>
          
          <!-- Quote Breakdown -->
          <tr>
            <td style="padding: 0 40px 20px 40px;">
              <h3 style="color: #374151; margin: 0 0 15px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">
                Quote Breakdown
              </h3>
              <table cellpadding="0" cellspacing="0" border="0" width="100%" style="font-size: 15px;">
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #374151;">
                    Base Service
                  </td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right; color: #374151;">
                    $${parseFloat(basePrice).toFixed(2)}
                  </td>
                </tr>
                ${addonsHtml}
              </table>
            </td>
          </tr>
          
          <!-- Total -->
          <tr>
            <td style="padding: 0 40px 30px 40px;">
              <div style="background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); border-radius: 8px; padding: 20px; text-align: center;">
                <p style="color: #065f46; margin: 0 0 5px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">
                  Your Quote
                </p>
                <p style="color: #047857; margin: 0; font-size: 36px; font-weight: 700;">
                  $${parseFloat(totalPerVisit).toFixed(2)}
                  <span style="font-size: 16px; font-weight: 400;">/visit</span>
                </p>
                ${frequency ? `
                <p style="color: #065f46; margin: 10px 0 0 0; font-size: 14px;">
                  ${frequency} service
                  ${monthlyEstimate ? ` • Est. $${parseFloat(monthlyEstimate).toFixed(2)}/month` : ''}
                </p>
                ` : ''}
              </div>
            </td>
          </tr>
          
          <!-- CTA -->
          <tr>
            <td style="padding: 0 40px 30px 40px; text-align: center;">
              <p style="color: #6b7280; margin: 0 0 20px 0; font-size: 15px; line-height: 1.6;">
                Ready to get started? Simply reply to this email or give us a call to schedule your first service.
              </p>
              <a href="mailto:${process.env.RESEND_FROM_EMAIL}" style="display: inline-block; background-color: #16a34a; color: #ffffff; text-decoration: none; padding: 12px 30px; border-radius: 6px; font-size: 15px; font-weight: 600;">
                Accept This Quote
              </a>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 20px 40px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="color: #9ca3af; margin: 0; font-size: 13px;">
                This quote is valid for 30 days from the date sent.
              </p>
              <p style="color: #9ca3af; margin: 8px 0 0 0; font-size: 13px;">
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

/**
 * Generate plain text version of the email
 */
function generateQuoteEmailText({
  customerName,
  businessName,
  propertyAddress,
  areaSqFt,
  basePrice,
  addons,
  totalPerVisit,
  frequency,
  monthlyEstimate,
}) {
  const addonsText = addons && addons.length > 0
    ? addons.map(addon => `  - ${addon.name}: +$${parseFloat(addon.price).toFixed(2)}`).join('\n')
    : '';

  return `
${businessName}
Professional Lawn Care Services

Hello ${customerName},

Thank you for your interest in our lawn care services! Below is your personalized quote.

PROPERTY DETAILS
----------------
Address: ${propertyAddress || 'Not specified'}
Estimated Lawn Area: ${Number(areaSqFt).toLocaleString()} sq ft

QUOTE BREAKDOWN
---------------
Base Service: $${parseFloat(basePrice).toFixed(2)}
${addonsText}

YOUR QUOTE: $${parseFloat(totalPerVisit).toFixed(2)}/visit
${frequency ? `${frequency} service` : ''}
${monthlyEstimate ? `Estimated monthly: $${parseFloat(monthlyEstimate).toFixed(2)}` : ''}

Ready to get started? Simply reply to this email or give us a call to schedule your first service.

This quote is valid for 30 days from the date sent.

--
Powered by GreenQuote Pro
https://getgreenquote.com
  `.trim();
}

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check for API key
  if (!process.env.RESEND_API_KEY) {
    console.error('RESEND_API_KEY is not configured');
    return res.status(500).json({ error: 'Email service not configured' });
  }

  if (!process.env.RESEND_FROM_EMAIL) {
    console.error('RESEND_FROM_EMAIL is not configured');
    return res.status(500).json({ error: 'Email sender not configured' });
  }

  try {
    const {
      customerEmail,
      customerName,
      businessName,
      replyToEmail,
      propertyAddress,
      areaSqFt,
      basePrice,
      addons,
      totalPerVisit,
      frequency,
      monthlyEstimate,
    } = req.body;

    // Validate required fields
    if (!customerEmail) {
      return res.status(400).json({ error: 'Customer email is required' });
    }
    if (!customerName) {
      return res.status(400).json({ error: 'Customer name is required' });
    }
    if (!businessName) {
      return res.status(400).json({ error: 'Business name is required' });
    }

    // Generate email content
    const htmlContent = generateQuoteEmailHtml({
      customerName,
      businessName,
      propertyAddress,
      areaSqFt,
      basePrice,
      addons,
      totalPerVisit,
      frequency,
      monthlyEstimate,
    });

    const textContent = generateQuoteEmailText({
      customerName,
      businessName,
      propertyAddress,
      areaSqFt,
      basePrice,
      addons,
      totalPerVisit,
      frequency,
      monthlyEstimate,
    });

    // Prepare email options
    const emailOptions = {
      from: `${businessName} via GreenQuote <${process.env.RESEND_FROM_EMAIL}>`,
      to: customerEmail,
      subject: `Your Lawn Care Quote from ${businessName}`,
      html: htmlContent,
      text: textContent,
    };

    // Add reply-to if provided
    if (replyToEmail) {
      emailOptions.reply_to = replyToEmail;
    }

    // Add BCC if configured
    if (process.env.RESEND_BCC_EMAIL) {
      emailOptions.bcc = process.env.RESEND_BCC_EMAIL;
    }

    console.log('Sending quote email to:', customerEmail);

    // Send the email
    const { data, error } = await resend.emails.send(emailOptions);

    if (error) {
      console.error('Resend error:', error);
      return res.status(500).json({ 
        error: 'Failed to send email',
        details: error.message 
      });
    }

    console.log('Email sent successfully:', data?.id);

    return res.status(200).json({ 
      success: true,
      messageId: data?.id,
      message: 'Quote email sent successfully' 
    });

  } catch (error) {
    console.error('Error sending quote email:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
}
