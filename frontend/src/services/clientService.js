import { supabase } from '@/lib/supabaseClient';

/**
 * Client Service
 * Handles client CRUD operations and revenue calculations
 */

/**
 * Get all active clients for an account
 * @param {string} accountId - Account ID
 * @returns {Promise<Array>} - List of clients
 */
export async function getClients(accountId) {
  if (!accountId) {
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('account_id', accountId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[ClientService] Error getting clients:', error);
      throw new Error('Failed to get clients: ' + error.message);
    }

    return data || [];
  } catch (err) {
    console.error('[ClientService] Exception getting clients:', err);
    throw err;
  }
}

/**
 * Get total estimated monthly revenue from active clients
 * @param {string} accountId - Account ID
 * @returns {Promise<number>} - Total monthly revenue
 */
export async function getTotalMonthlyRevenue(accountId) {
  if (!accountId) {
    return 0;
  }

  try {
    const { data, error } = await supabase
      .from('clients')
      .select('estimated_monthly_revenue')
      .eq('account_id', accountId)
      .eq('is_active', true);

    if (error) {
      console.error('[ClientService] Error getting revenue:', error);
      return 0;
    }

    const total = (data || []).reduce((sum, client) => {
      return sum + (parseFloat(client.estimated_monthly_revenue) || 0);
    }, 0);

    console.log('[ClientService] Total monthly revenue:', total);
    return total;
  } catch (err) {
    console.error('[ClientService] Exception getting revenue:', err);
    return 0;
  }
}

/**
 * Get count of active clients
 * @param {string} accountId - Account ID
 * @returns {Promise<number>} - Client count
 */
export async function getClientCount(accountId) {
  if (!accountId) {
    return 0;
  }

  try {
    const { count, error } = await supabase
      .from('clients')
      .select('*', { count: 'exact', head: true })
      .eq('account_id', accountId)
      .eq('is_active', true);

    if (error) {
      console.error('[ClientService] Error getting client count:', error);
      return 0;
    }

    return count || 0;
  } catch (err) {
    console.error('[ClientService] Exception getting client count:', err);
    return 0;
  }
}

/**
 * Create a client from a won quote
 * @param {Object} quoteData - Quote data to create client from
 * @returns {Promise<Object>} - Created client
 */
export async function createClientFromQuote(quoteData) {
  const {
    accountId,
    quoteId,
    customerName,
    customerEmail,
    customerPhone,
    propertyAddress,
    propertyType,
    areaSqFt,
    services,
    frequency,
    pricePerVisit,
    estimatedMonthlyRevenue,
  } = quoteData;

  if (!accountId || !propertyAddress) {
    throw new Error('Account ID and property address are required');
  }

  try {
    // Check if client already exists for this quote
    if (quoteId) {
      const { data: existing } = await supabase
        .from('clients')
        .select('id')
        .eq('source_quote_id', quoteId)
        .single();

      if (existing) {
        console.log('[ClientService] Client already exists for quote:', quoteId);
        return existing;
      }
    }

    const { data, error } = await supabase
      .from('clients')
      .insert([{
        account_id: accountId,
        source_quote_id: quoteId || null,
        customer_name: customerName || null,
        customer_email: customerEmail || null,
        customer_phone: customerPhone || null,
        property_address: propertyAddress,
        property_type: propertyType || null,
        area_sq_ft: areaSqFt ? parseFloat(areaSqFt) : null,
        services: services || null,
        frequency: frequency || null,
        price_per_visit: pricePerVisit ? parseFloat(pricePerVisit) : null,
        estimated_monthly_revenue: estimatedMonthlyRevenue ? parseFloat(estimatedMonthlyRevenue) : null,
        is_active: true,
      }])
      .select()
      .single();

    if (error) {
      console.error('[ClientService] Error creating client:', error);
      throw new Error('Failed to create client: ' + error.message);
    }

    console.log('[ClientService] Client created:', data?.id);
    return data;
  } catch (err) {
    console.error('[ClientService] Exception creating client:', err);
    throw err;
  }
}

/**
 * Update a client
 * @param {string} clientId - Client ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} - Updated client
 */
export async function updateClient(clientId, updates) {
  try {
    const { data, error } = await supabase
      .from('clients')
      .update(updates)
      .eq('id', clientId)
      .select()
      .single();

    if (error) {
      console.error('[ClientService] Error updating client:', error);
      throw new Error('Failed to update client: ' + error.message);
    }

    return data;
  } catch (err) {
    console.error('[ClientService] Exception updating client:', err);
    throw err;
  }
}

/**
 * Deactivate a client (soft delete)
 * @param {string} clientId - Client ID
 * @returns {Promise<Object>} - Updated client
 */
export async function deactivateClient(clientId) {
  return updateClient(clientId, { is_active: false });
}
