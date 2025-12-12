/**
 * Billing Service
 * Handles subscription and trial management
 */

/**
 * Get the API base URL
 * Uses the origin for dynamic URL construction
 */
function getApiBaseUrl() {
  // In production, use the same origin
  // This works because Vercel routes /api/* to serverless functions
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return process.env.REACT_APP_BACKEND_URL || '';
}

/**
 * Start a free trial for the account
 * Creates Stripe customer and subscription with trial
 */
export async function startTrial({ accountId, userId, userEmail, accountName }) {
  const baseUrl = getApiBaseUrl();
  
  try {
    const response = await fetch(`${baseUrl}/api/billing/start-trial`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        accountId,
        userId,
        userEmail,
        accountName,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('[BillingService] Error starting trial:', error);
    throw error;
  }
}

/**
 * Get the current billing status for an account
 */
export async function getBillingStatus(accountId) {
  const baseUrl = getApiBaseUrl();
  
  try {
    const response = await fetch(`${baseUrl}/api/billing/status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ accountId }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('[BillingService] Error getting billing status:', error);
    throw error;
  }
}

/**
 * Create a Stripe Checkout session for subscription
 * Returns the checkout URL to redirect to
 */
export async function createCheckoutSession({ accountId, userId, userEmail, accountName }) {
  const baseUrl = getApiBaseUrl();
  const originUrl = typeof window !== 'undefined' ? window.location.origin : baseUrl;
  
  try {
    const response = await fetch(`${baseUrl}/api/billing/create-checkout-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        accountId,
        userId,
        userEmail,
        accountName,
        originUrl,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('[BillingService] Error creating checkout session:', error);
    throw error;
  }
}

/**
 * Check if the account has access based on subscription status
 * @param {Object} billingStatus - The billing status from getBillingStatus
 * @returns {boolean}
 */
export function hasAccess(billingStatus) {
  if (!billingStatus) return false;
  return billingStatus.hasAccess === true;
}

/**
 * Format trial end date for display
 */
export function formatTrialEnd(trialEnd) {
  if (!trialEnd) return null;
  const date = new Date(trialEnd);
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Get human-readable subscription status
 */
export function getStatusLabel(status) {
  const labels = {
    trialing: 'Free Trial',
    active: 'Active',
    past_due: 'Past Due',
    canceled: 'Canceled',
    unpaid: 'Unpaid',
    incomplete: 'Incomplete',
    incomplete_expired: 'Expired',
    paused: 'Paused',
    none: 'No Subscription',
  };
  return labels[status] || status;
}

/**
 * Create a Stripe Customer Portal session
 * Returns the portal URL to redirect to
 * 
 * @param {string} accountId - The account ID
 * @param {string} userEmail - User's email (for auto-creating Stripe customer if needed)
 * @param {string} accountName - Account/business name (optional)
 */
export async function createPortalSession(accountId, userEmail, accountName) {
  const baseUrl = getApiBaseUrl();
  const originUrl = typeof window !== 'undefined' ? window.location.origin : baseUrl;
  
  try {
    const response = await fetch(`${baseUrl}/api/billing/portal`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        accountId,
        userEmail,
        accountName,
        originUrl,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('[BillingService] Error creating portal session:', error);
    throw error;
  }
}
