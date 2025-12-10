import { supabase } from '@/lib/supabaseClient';

/**
 * Account Service
 * Handles all account and account_settings operations
 * 
 * IMPORTANT: This service uses defensive error handling to avoid
 * "body stream already read" errors that can occur when accessing
 * certain properties of Supabase error objects.
 */

/**
 * Safely get error message without triggering Response body issues
 * @param {any} error - Error object
 * @returns {string} - Safe error message
 */
function getSafeErrorMessage(error) {
  if (!error) return 'Unknown error';
  
  // Try to get message as a simple string without accessing complex properties
  try {
    // If it's a simple string, return it
    if (typeof error === 'string') return error;
    
    // If it has a message property that's a string, use it
    if (error.message && typeof error.message === 'string') {
      return error.message;
    }
    
    // Fallback to stringifying (safely)
    return 'Database operation failed';
  } catch {
    return 'Database operation failed';
  }
}

/**
 * Get or create account for the current user
 * This ensures every user has an account + settings on first access
 * 
 * @param {Object} user - Supabase user object
 * @returns {Promise<{account: Object, settings: Object}>}
 */
export async function ensureUserAccount(user) {
  if (!user || !user.id) {
    throw new Error('User not authenticated');
  }

  console.log('[AccountService] Ensuring account for user:', user.id);

  // Step 1: Try to get existing account
  let account = null;
  let accountError = null;
  
  try {
    const result = await supabase
      .from('accounts')
      .select('*')
      .eq('owner_user_id', user.id)
      .single();
    
    account = result.data;
    accountError = result.error;
  } catch (e) {
    console.error('[AccountService] Exception fetching account:', getSafeErrorMessage(e));
    throw new Error('Failed to fetch account: ' + getSafeErrorMessage(e));
  }

  // Check for error (PGRST116 means no rows, which is expected for new users)
  if (accountError) {
    const errorCode = accountError.code;
    console.log('[AccountService] Account query returned error code:', errorCode);
    
    if (errorCode !== 'PGRST116') {
      // Real error, not just "no rows found"
      throw new Error('Failed to fetch account: ' + getSafeErrorMessage(accountError));
    }
  }

  if (account) {
    console.log('[AccountService] Found existing account:', account.id);
  }

  // Step 2: Create account if it doesn't exist
  if (!account) {
    console.log('[AccountService] No account found, creating new account...');
    
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
      console.log('[AccountService] Account created successfully:', account?.id);
    } catch (e) {
      console.error('[AccountService] Exception creating account:', getSafeErrorMessage(e));
      throw new Error('Failed to create account: ' + getSafeErrorMessage(e));
    }
  }

  if (!account || !account.id) {
    throw new Error('Failed to get or create account');
  }

  // Step 3: Try to get existing settings
  let settings = null;
  let settingsError = null;
  
  try {
    const result = await supabase
      .from('account_settings')
      .select('*')
      .eq('account_id', account.id)
      .single();
    
    settings = result.data;
    settingsError = result.error;
  } catch (e) {
    console.error('[AccountService] Exception fetching settings:', getSafeErrorMessage(e));
    throw new Error('Failed to fetch settings: ' + getSafeErrorMessage(e));
  }

  // Check for error (PGRST116 means no rows, which is expected for new accounts)
  if (settingsError) {
    const errorCode = settingsError.code;
    console.log('[AccountService] Settings query returned error code:', errorCode);
    
    if (errorCode !== 'PGRST116') {
      throw new Error('Failed to fetch settings: ' + getSafeErrorMessage(settingsError));
    }
  }

  if (settings) {
    console.log('[AccountService] Found existing settings');
  }

  // Step 4: Create default settings if they don't exist
  if (!settings) {
    console.log('[AccountService] No settings found, creating default settings...');
    
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
      console.log('[AccountService] Settings created successfully');
    } catch (e) {
      console.error('[AccountService] Exception creating settings:', getSafeErrorMessage(e));
      throw new Error('Failed to create settings: ' + getSafeErrorMessage(e));
    }
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
    throw new Error('Failed to get account settings: ' + getSafeErrorMessage(e));
  }
}
