import { supabase } from '@/lib/supabaseClient';

/**
 * Quote Service
 * Handles quote persistence and retrieval from Supabase
 * 
 * Quotes are stored for:
 * - Billing (count per account per month)
 * - Analytics (conversion tracking, revenue forecasting)
 * - Customer history
 * - Sales pipeline (pending, won, lost)
 */

/**
 * Frequency to visits per month mapping
 */
export const FREQUENCY_VISITS = {
  one_time: 1,
  weekly: 4,
  bi_weekly: 2,
  monthly: 1,
};

/**
 * Calculate estimated monthly revenue from price per visit and frequency
 */
export function calculateMonthlyRevenue(pricePerVisit, frequency) {
  const visits = FREQUENCY_VISITS[frequency] || 1;
  return parseFloat(pricePerVisit || 0) * visits;
}

/**
 * Plan tier limits for quote counting
 * These will eventually sync from Stripe subscription
 */
export const PLAN_LIMITS = {
  starter: {
    name: 'Starter',
    includedQuotesPerMonth: 25,
  },
  professional: {
    name: 'Professional',
    includedQuotesPerMonth: 100,
  },
  enterprise: {
    name: 'Enterprise',
    includedQuotesPerMonth: 999999, // Effectively unlimited
  },
};

/**
 * Default plan tier for new accounts
 */
export const DEFAULT_PLAN_TIER = 'starter';

/**
 * Get UTC month boundaries for quote counting
 * @returns {{ startOfMonth: string, startOfNextMonth: string }}
 */
export function getMonthBoundariesUTC() {
  const now = new Date();
  
  // Start of current month (UTC)
  const startOfMonth = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    1, 0, 0, 0, 0
  ));
  
  // Start of next month (UTC)
  const startOfNextMonth = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth() + 1,
    1, 0, 0, 0, 0
  ));
  
  return {
    startOfMonth: startOfMonth.toISOString(),
    startOfNextMonth: startOfNextMonth.toISOString(),
  };
}

/**
 * Save a quote to Supabase
 * This is called on every "Save Quote" click (billable event)
 * 
 * @param {Object} quoteData - Quote data to save
 * @returns {Promise<Object>} - Saved quote record
 */
export async function saveQuote(quoteData) {
  const {
    accountId,
    userId,
    customerName,
    customerEmail,
    customerPhone,
    propertyAddress,
    propertyType,
    areaSqFt,
    basePricePerVisit,
    addons,
    totalPricePerVisit,
    frequency,
    monthlyEstimate,
    sendToCustomer,
    services, // Base service + add-ons snapshot
    // Pricing snapshot fields
    pricingMode,
    pricingTiersSnapshot,
    flatRateSnapshot,
  } = quoteData;

  if (!accountId) {
    throw new Error('Account ID is required to save a quote');
  }

  // Calculate monthly revenue if not provided
  const estimatedMonthlyRevenue = monthlyEstimate || calculateMonthlyRevenue(totalPricePerVisit, frequency);

  try {
    const { data, error } = await supabase
      .from('quotes')
      .insert([{
        account_id: accountId,
        created_by_user_id: userId || null,
        customer_name: customerName || null,
        customer_email: customerEmail || null,
        customer_phone: customerPhone || null,
        property_address: propertyAddress || null,
        property_type: propertyType || null,
        area_sq_ft: areaSqFt ? parseFloat(areaSqFt) : null,
        base_price_per_visit: basePricePerVisit ? parseFloat(basePricePerVisit) : null,
        addons: addons || null,
        total_price_per_visit: totalPricePerVisit ? parseFloat(totalPricePerVisit) : null,
        frequency: frequency || null,
        monthly_estimate: estimatedMonthlyRevenue ? parseFloat(estimatedMonthlyRevenue) : null,
        send_to_customer: sendToCustomer || false,
        status: 'pending', // All new quotes start as pending
        services: services || null,
        // Pricing snapshot for historical accuracy
        pricing_mode: pricingMode || 'flat',
        pricing_tiers_snapshot: pricingTiersSnapshot || null,
        flat_rate_snapshot: flatRateSnapshot ? parseFloat(flatRateSnapshot) : null,
      }])
      .select()
      .single();

    if (error) {
      console.error('[QuoteService] Error saving quote:', error);
      throw new Error('Failed to save quote: ' + (error.message || 'Unknown error'));
    }

    console.log('[QuoteService] Quote saved successfully:', data?.id);
    return data;
  } catch (err) {
    console.error('[QuoteService] Exception saving quote:', err);
    throw err;
  }
}

/**
 * Update quote with email sent timestamp
 * Called after successful email delivery
 * 
 * @param {string} quoteId - Quote ID to update
 * @returns {Promise<Object>} - Updated quote
 */
export async function markQuoteEmailSent(quoteId) {
  try {
    const { data, error } = await supabase
      .from('quotes')
      .update({ email_sent_at: new Date().toISOString() })
      .eq('id', quoteId)
      .select()
      .single();

    if (error) {
      console.error('[QuoteService] Error marking email sent:', error);
      throw new Error('Failed to update quote: ' + (error.message || 'Unknown error'));
    }

    return data;
  } catch (err) {
    console.error('[QuoteService] Exception updating quote:', err);
    throw err;
  }
}

/**
 * Get quote count for current month (UTC) for an account
 * Used for dashboard display and overage calculation
 * 
 * @param {string} accountId - Account ID
 * @returns {Promise<number>} - Count of quotes this month
 */
export async function getQuotesThisMonth(accountId) {
  if (!accountId) {
    console.warn('[QuoteService] No account ID provided for quote count');
    return 0;
  }

  try {
    const { startOfMonth, startOfNextMonth } = getMonthBoundariesUTC();

    const { count, error } = await supabase
      .from('quotes')
      .select('*', { count: 'exact', head: true })
      .eq('account_id', accountId)
      .gte('created_at', startOfMonth)
      .lt('created_at', startOfNextMonth);

    if (error) {
      console.error('[QuoteService] Error getting quote count:', error);
      throw new Error('Failed to get quote count: ' + (error.message || 'Unknown error'));
    }

    console.log('[QuoteService] Quotes this month:', count);
    return count || 0;
  } catch (err) {
    console.error('[QuoteService] Exception getting quote count:', err);
    throw err;
  }
}

/**
 * Calculate overage information for an account
 * 
 * @param {number} quotesThisMonth - Current quote count
 * @param {string} planTier - Account's plan tier (starter, professional, enterprise)
 * @returns {Object} - Overage information
 */
export function calculateOverage(quotesThisMonth, planTier = DEFAULT_PLAN_TIER) {
  const plan = PLAN_LIMITS[planTier] || PLAN_LIMITS[DEFAULT_PLAN_TIER];
  const includedLimit = plan.includedQuotesPerMonth;
  const overageCount = Math.max(0, quotesThisMonth - includedLimit);
  const isOverLimit = overageCount > 0;
  const remainingIncluded = Math.max(0, includedLimit - quotesThisMonth);
  const usagePercentage = Math.min(100, Math.round((quotesThisMonth / includedLimit) * 100));

  return {
    planName: plan.name,
    includedLimit,
    quotesThisMonth,
    overageCount,
    isOverLimit,
    remainingIncluded,
    usagePercentage,
  };
}

/**
 * Get all quotes for an account (paginated)
 * For future use in quote history/analytics
 * 
 * @param {string} accountId - Account ID
 * @param {Object} options - Pagination options
 * @returns {Promise<{quotes: Array, total: number}>}
 */
export async function getQuotesByAccount(accountId, options = {}) {
  const { page = 1, limit = 20 } = options;
  const offset = (page - 1) * limit;

  if (!accountId) {
    return { quotes: [], total: 0 };
  }

  try {
    // Get total count
    const { count } = await supabase
      .from('quotes')
      .select('*', { count: 'exact', head: true })
      .eq('account_id', accountId);

    // Get quotes with pagination
    const { data, error } = await supabase
      .from('quotes')
      .select('*')
      .eq('account_id', accountId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('[QuoteService] Error getting quotes:', error);
      throw new Error('Failed to get quotes: ' + (error.message || 'Unknown error'));
    }

    return {
      quotes: data || [],
      total: count || 0,
    };
  } catch (err) {
    console.error('[QuoteService] Exception getting quotes:', err);
    throw err;
  }
}


/**
 * Get quotes by status for pipeline views
 * @param {string} accountId - Account ID
 * @param {string} status - Quote status (pending, won, lost)
 * @param {Object} options - Sorting and pagination options
 * @returns {Promise<Array>} - List of quotes
 */
export async function getQuotesByStatus(accountId, status, options = {}) {
  const { 
    sortBy = 'created_at', 
    sortOrder = 'desc',
    limit = 100 
  } = options;

  if (!accountId) {
    return [];
  }

  try {
    let query = supabase
      .from('quotes')
      .select('*')
      .eq('account_id', accountId)
      .eq('status', status)
      .limit(limit);

    // Apply sorting
    const ascending = sortOrder === 'asc';
    switch (sortBy) {
      case 'property_address':
        query = query.order('property_address', { ascending });
        break;
      case 'monthly_estimate':
        query = query.order('monthly_estimate', { ascending });
        break;
      case 'frequency':
        query = query.order('frequency', { ascending });
        break;
      case 'created_at':
      default:
        query = query.order('created_at', { ascending });
        break;
    }

    const { data, error } = await query;

    if (error) {
      console.error('[QuoteService] Error getting quotes by status:', error);
      throw new Error('Failed to get quotes: ' + error.message);
    }

    return data || [];
  } catch (err) {
    console.error('[QuoteService] Exception getting quotes by status:', err);
    throw err;
  }
}

/**
 * Update quote status (for pipeline)
 * @param {string} quoteId - Quote ID
 * @param {string} status - New status (pending, won, lost)
 * @returns {Promise<Object>} - Updated quote
 */
export async function updateQuoteStatus(quoteId, status) {
  if (!['pending', 'won', 'lost'].includes(status)) {
    throw new Error('Invalid status. Must be: pending, won, or lost');
  }

  try {
    const { data, error } = await supabase
      .from('quotes')
      .update({ status })
      .eq('id', quoteId)
      .select()
      .single();

    if (error) {
      console.error('[QuoteService] Error updating quote status:', error);
      throw new Error('Failed to update quote: ' + error.message);
    }

    console.log('[QuoteService] Quote status updated:', quoteId, '->', status);
    return data;
  } catch (err) {
    console.error('[QuoteService] Exception updating quote status:', err);
    throw err;
  }
}

/**
 * Get count of quotes by status
 * @param {string} accountId - Account ID
 * @param {string} status - Quote status
 * @returns {Promise<number>} - Count
 */
export async function getQuoteCountByStatus(accountId, status) {
  if (!accountId) {
    return 0;
  }

  try {
    const { count, error } = await supabase
      .from('quotes')
      .select('*', { count: 'exact', head: true })
      .eq('account_id', accountId)
      .eq('status', status);

    if (error) {
      console.error('[QuoteService] Error getting quote count by status:', error);
      return 0;
    }

    return count || 0;
  } catch (err) {
    console.error('[QuoteService] Exception getting quote count:', err);
    return 0;
  }
}

