import { supabase } from '@/lib/supabaseClient';

/**
 * Add-ons Service
 * Handles CRUD operations for per-account add-ons
 */

/**
 * Safely extract error message
 */
function getSafeErrorMessage(error) {
  if (!error) return 'Unknown error';
  try {
    if (typeof error === 'string') return error;
    if (error.message && typeof error.message === 'string') {
      return error.message;
    }
    return 'Database operation failed';
  } catch {
    return 'Database operation failed';
  }
}

/**
 * Get all add-ons for an account
 * @param {string} accountId - Account ID
 * @param {boolean} activeOnly - If true, only return active add-ons
 * @returns {Promise<Array>} - Array of add-on objects
 */
export async function getAccountAddons(accountId, activeOnly = false) {
  try {
    let query = supabase
      .from('account_addons')
      .select('*')
      .eq('account_id', accountId)
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true });

    if (activeOnly) {
      query = query.eq('is_active', true);
    }

    const result = await query;

    if (result.error) {
      // Check if table doesn't exist (new feature)
      if (result.error.code === '42P01') {
        console.warn('[AddonsService] account_addons table does not exist yet');
        return [];
      }
      throw new Error('Failed to fetch add-ons: ' + getSafeErrorMessage(result.error));
    }

    return result.data || [];
  } catch (e) {
    if (e.message && e.message.includes('Failed to fetch')) {
      throw e;
    }
    console.error('[AddonsService] Exception fetching add-ons:', getSafeErrorMessage(e));
    // Return empty array if table doesn't exist yet
    return [];
  }
}

/**
 * Get active add-ons for an account (for quote flow)
 * @param {string} accountId - Account ID
 * @returns {Promise<Array>} - Array of active add-on objects
 */
export async function getActiveAddons(accountId) {
  return getAccountAddons(accountId, true);
}

/**
 * Create a new add-on
 * @param {string} accountId - Account ID
 * @param {Object} addonData - Add-on data {name, description, price_per_visit, is_active, sort_order}
 * @returns {Promise<Object>} - Created add-on
 */
export async function createAddon(accountId, addonData) {
  try {
    const result = await supabase
      .from('account_addons')
      .insert([{
        account_id: accountId,
        name: addonData.name,
        description: addonData.description || null,
        price_per_visit: parseFloat(addonData.price_per_visit) || 0,
        is_active: addonData.is_active !== false,
        sort_order: addonData.sort_order || 0,
      }])
      .select()
      .single();

    if (result.error) {
      throw new Error('Failed to create add-on: ' + getSafeErrorMessage(result.error));
    }

    return result.data;
  } catch (e) {
    if (e.message && e.message.includes('Failed to create')) {
      throw e;
    }
    console.error('[AddonsService] Exception creating add-on:', getSafeErrorMessage(e));
    throw new Error('Failed to create add-on: ' + getSafeErrorMessage(e));
  }
}

/**
 * Update an existing add-on
 * @param {string} addonId - Add-on ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} - Updated add-on
 */
export async function updateAddon(addonId, updates) {
  try {
    const updateData = {};
    
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.price_per_visit !== undefined) updateData.price_per_visit = parseFloat(updates.price_per_visit);
    if (updates.is_active !== undefined) updateData.is_active = updates.is_active;
    if (updates.sort_order !== undefined) updateData.sort_order = updates.sort_order;

    const result = await supabase
      .from('account_addons')
      .update(updateData)
      .eq('id', addonId)
      .select()
      .single();

    if (result.error) {
      throw new Error('Failed to update add-on: ' + getSafeErrorMessage(result.error));
    }

    return result.data;
  } catch (e) {
    if (e.message && e.message.includes('Failed to update')) {
      throw e;
    }
    console.error('[AddonsService] Exception updating add-on:', getSafeErrorMessage(e));
    throw new Error('Failed to update add-on: ' + getSafeErrorMessage(e));
  }
}

/**
 * Delete an add-on
 * @param {string} addonId - Add-on ID
 * @returns {Promise<void>}
 */
export async function deleteAddon(addonId) {
  try {
    const result = await supabase
      .from('account_addons')
      .delete()
      .eq('id', addonId);

    if (result.error) {
      throw new Error('Failed to delete add-on: ' + getSafeErrorMessage(result.error));
    }
  } catch (e) {
    if (e.message && e.message.includes('Failed to delete')) {
      throw e;
    }
    console.error('[AddonsService] Exception deleting add-on:', getSafeErrorMessage(e));
    throw new Error('Failed to delete add-on: ' + getSafeErrorMessage(e));
  }
}

/**
 * Toggle add-on active status
 * @param {string} addonId - Add-on ID
 * @param {boolean} isActive - New active status
 * @returns {Promise<Object>} - Updated add-on
 */
export async function toggleAddonActive(addonId, isActive) {
  return updateAddon(addonId, { is_active: isActive });
}

/**
 * Batch update add-ons (for reordering or bulk changes)
 * @param {Array} addons - Array of addon objects with id and updated fields
 * @returns {Promise<Array>} - Updated add-ons
 */
export async function batchUpdateAddons(addons) {
  const results = [];
  
  for (const addon of addons) {
    if (addon.id) {
      const updated = await updateAddon(addon.id, addon);
      results.push(updated);
    }
  }
  
  return results;
}

/**
 * Create default add-ons for a new account
 * @param {string} accountId - Account ID
 * @returns {Promise<Array>} - Created add-ons
 */
export async function createDefaultAddons(accountId) {
  const defaultAddons = [
    { name: 'Mulch Installation', description: 'Fresh mulch around beds and trees', price_per_visit: 75.00, sort_order: 1 },
    { name: 'Flower Bed Maintenance', description: 'Weeding and care for flower beds', price_per_visit: 35.00, sort_order: 2 },
    { name: 'Hedge Trimming', description: 'Shape and trim hedges and shrubs', price_per_visit: 45.00, sort_order: 3 },
    { name: 'Leaf Removal', description: 'Seasonal leaf cleanup and removal', price_per_visit: 55.00, sort_order: 4 },
    { name: 'Edging', description: 'Clean edges along driveways and walkways', price_per_visit: 25.00, sort_order: 5 },
  ];

  const results = [];
  
  for (const addon of defaultAddons) {
    try {
      const created = await createAddon(accountId, addon);
      results.push(created);
    } catch (e) {
      console.error('[AddonsService] Failed to create default addon:', addon.name, e);
    }
  }
  
  return results;
}
