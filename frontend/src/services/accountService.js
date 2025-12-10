import { supabase } from '@/lib/supabaseClient';

/**
 * Account Service
 * Handles all account and account_settings operations
 * 
 * NOTE: With the Supabase trigger in place, accounts and account_settings
 * are auto-created when a user signs up. This service is now primarily
 * for READING data, with fallback creation logic just in case.
 */

/**
 * Safely get error message without triggering Response body issues
 * @param {any} error - Error object
 * @returns {string} - Safe error message
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
 * Get account and settings for the current user
 * 
 * With the Supabase trigger, these should already exist.
 * If they don't (edge case), we create them as a fallback.
 * 
 * @param {Object} user - Supabase user object
 * @returns {Promise<{account: Object, settings: Object}>}
 */
export async function ensureUserAccount(user) {
  if (!user || !user.id) {
    throw new Error('User not authenticated');
  }

  console.log('[AccountService] Getting account for user:', user.id);

  // Step 1: Get existing account (should exist from trigger)
  let account = null;
  
  try {
    const result = await supabase
      .from('accounts')
      .select('*')
      .eq('owner_user_id', user.id)
      .single();
    
    account = result.data;
    
    // If no account found (PGRST116), we'll create one below
    if (result.error && result.error.code !== 'PGRST116') {
      throw new Error('Failed to fetch account: ' + getSafeErrorMessage(result.error));
    }
  } catch (e) {
    // Re-throw if it's our custom error
    if (e.message && e.message.includes('Failed to fetch')) {
      throw e;
    }
    console.error('[AccountService] Exception fetching account:', getSafeErrorMessage(e));
    throw new Error('Failed to fetch account: ' + getSafeErrorMessage(e));
  }

  // Step 2: Create account if missing (fallback - trigger should handle this)
  if (!account) {
    console.warn('[AccountService] Account missing - creating fallback. Check if trigger is working.');
    
    const accountName = 
      user.user_metadata?.business_name || 
      user.user_metadata?.full_name || 
      user.email?.split('@')[0] || 
      'My Account';

    try {
      const result = await supabase
        .from('accounts')
        .insert([{ owner_user_id: user.id, name: accountName }])
        .select()
        .single();
      
      if (result.error) {
        throw new Error('Failed to create account: ' + getSafeErrorMessage(result.error));
      }
      
      account = result.data;
      console.log('[AccountService] Fallback account created:', account?.id);
    } catch (e) {
      if (e.message && e.message.includes('Failed to create')) {
        throw e;
      }
      console.error('[AccountService] Exception creating account:', getSafeErrorMessage(e));
      throw new Error('Failed to create account: ' + getSafeErrorMessage(e));
    }
  } else {
    console.log('[AccountService] Found existing account:', account.id);
  }

  if (!account || !account.id) {
    throw new Error('Unable to get or create account');
  }

  // Step 3: Get existing settings (should exist from trigger)
  let settings = null;
  
  try {
    const result = await supabase
      .from('account_settings')
      .select('*')
      .eq('account_id', account.id)
      .single();
    
    settings = result.data;
    
    // If no settings found (PGRST116), we'll create them below
    if (result.error && result.error.code !== 'PGRST116') {
      throw new Error('Failed to fetch settings: ' + getSafeErrorMessage(result.error));
    }
  } catch (e) {
    if (e.message && e.message.includes('Failed to fetch')) {
      throw e;
    }
    console.error('[AccountService] Exception fetching settings:', getSafeErrorMessage(e));
    throw new Error('Failed to fetch settings: ' + getSafeErrorMessage(e));
  }

  // Step 4: Create settings if missing (fallback - trigger should handle this)
  if (!settings) {
    console.warn('[AccountService] Settings missing - creating fallback. Check if trigger is working.');
    
    try {
      const result = await supabase
        .from('account_settings')
        .insert([{
          account_id: account.id,
          min_price_per_visit: 50.00,
          price_per_sq_ft: 0.10,
          addons: [],
        }])
        .select()
        .single();
      
      if (result.error) {
        throw new Error('Failed to create settings: ' + getSafeErrorMessage(result.error));
      }
      
      settings = result.data;
      console.log('[AccountService] Fallback settings created');
    } catch (e) {
      if (e.message && e.message.includes('Failed to create')) {
        throw e;
      }
      console.error('[AccountService] Exception creating settings:', getSafeErrorMessage(e));
      throw new Error('Failed to create settings: ' + getSafeErrorMessage(e));
    }
  } else {
    console.log('[AccountService] Found existing settings');
  }

  console.log('[AccountService] Returning account and settings');
  return { account, settings };
}

/**
 * Get current user's account and settings
 * @returns {Promise<{account: Object, settings: Object}>}
 */
export async function getCurrentUserAccountSettings() {
  let user = null;
  
  try {
    const result = await supabase.auth.getUser();
    user = result.data?.user;
    
    if (result.error) {
      throw new Error('Failed to get user: ' + getSafeErrorMessage(result.error));
    }
  } catch (e) {
    if (e.message && e.message.includes('Failed to get user')) {
      throw e;
    }
    throw new Error('Failed to get authenticated user: ' + getSafeErrorMessage(e));
  }
  
  if (!user) {
    throw new Error('No authenticated user');
  }

  return ensureUserAccount(user);
}

/**
 * Update account settings
 * @param {string} accountId - Account ID
 * @param {Object} updates - Settings to update
 * @returns {Promise<Object>} - Updated settings
 */
export async function updateAccountSettings(accountId, updates) {
  try {
    const result = await supabase
      .from('account_settings')
      .update(updates)
      .eq('account_id', accountId)
      .select()
      .single();

    if (result.error) {
      throw new Error('Failed to update settings: ' + getSafeErrorMessage(result.error));
    }
    
    return result.data;
  } catch (e) {
    if (e.message && e.message.includes('Failed to update')) {
      throw e;
    }
    throw new Error('Failed to update account settings: ' + getSafeErrorMessage(e));
  }
}

/**
 * Update account name
 * @param {string} accountId - Account ID
 * @param {string} name - New account name
 * @returns {Promise<Object>} - Updated account
 */
export async function updateAccountName(accountId, name) {
  try {
    const result = await supabase
      .from('accounts')
      .update({ name })
      .eq('id', accountId)
      .select()
      .single();

    if (result.error) {
      throw new Error('Failed to update account: ' + getSafeErrorMessage(result.error));
    }
    
    return result.data;
  } catch (e) {
    if (e.message && e.message.includes('Failed to update')) {
      throw e;
    }
    throw new Error('Failed to update account name: ' + getSafeErrorMessage(e));
  }
}

/**
 * Get account by user ID
 * @param {string} userId - User ID
 * @returns {Promise<Object>} - Account object
 */
export async function getAccountByUserId(userId) {
  try {
    const result = await supabase
      .from('accounts')
      .select('*')
      .eq('owner_user_id', userId)
      .single();

    if (result.error) {
      throw new Error('Failed to get account: ' + getSafeErrorMessage(result.error));
    }
    
    return result.data;
  } catch (e) {
    if (e.message && e.message.includes('Failed to get')) {
      throw e;
    }
    throw new Error('Failed to get account: ' + getSafeErrorMessage(e));
  }
}

/**
 * Get settings by account ID
 * @param {string} accountId - Account ID
 * @returns {Promise<Object>} - Settings object
 */
export async function getSettingsByAccountId(accountId) {
  try {
    const result = await supabase
      .from('account_settings')
      .select('*')
      .eq('account_id', accountId)
      .single();

    if (result.error) {
      throw new Error('Failed to get settings: ' + getSafeErrorMessage(result.error));
    }
    
    return result.data;
  } catch (e) {
    if (e.message && e.message.includes('Failed to get')) {
      throw e;
    }
    throw new Error('Failed to get account settings: ' + getSafeErrorMessage(e));
  }
}
