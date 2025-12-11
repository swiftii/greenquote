/**
 * Email Service
 * Handles sending quote emails via the Resend API
 */

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || '';

/**
 * Send a quote email to the customer
 * 
 * @param {Object} params - Email parameters
 * @param {string} params.customerEmail - Customer's email address
 * @param {string} params.customerName - Customer's full name
 * @param {string} params.businessName - Business name of the GreenQuote user
 * @param {string} params.replyToEmail - Reply-to email (business owner's email)
 * @param {string} params.propertyAddress - Property address
 * @param {number} params.areaSqFt - Lawn area in square feet
 * @param {number} params.basePrice - Base price for the service
 * @param {Array} params.addons - Array of add-ons [{name, price}]
 * @param {number} params.totalPerVisit - Total price per visit
 * @param {string} params.frequency - Service frequency (e.g., "Weekly", "Bi-Weekly")
 * @param {number} params.monthlyEstimate - Estimated monthly cost
 * @returns {Promise<Object>} - API response
 */
export async function sendQuoteEmail({
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
}) {
  try {
    // Build the API URL - use relative path for same-domain API
    const apiUrl = `${API_BASE_URL}/api/send-quote-email`;
    
    console.log('[EmailService] Sending quote email to:', customerEmail);
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
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
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[EmailService] Failed to send email:', data);
      throw new Error(data.error || 'Failed to send quote email');
    }

    console.log('[EmailService] Email sent successfully:', data.messageId);
    return data;
  } catch (error) {
    console.error('[EmailService] Error sending quote email:', error);
    throw error;
  }
}

/**
 * Check if email service is configured
 * Returns true if the API endpoint is expected to work
 */
export function isEmailServiceAvailable() {
  // Email service is available if we have a backend URL or are on the same domain
  return true;
}
