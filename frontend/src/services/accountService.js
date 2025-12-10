import { supabase } from '@/lib/supabaseClient';

/**
 * Account Service
 * Handles all account and account_settings operations
 */

/**
 * Helper function to safely extract error details from Supabase errors
 * This prevents "body stream already read" errors by extracting primitive values only
 * 
 * @param {Object} error - Supabase error object
 * @returns {Object} - Safe error object with primitive values
 */
function extractErrorDetails(error) {
  if (!error) return null;
  
  // Extract only primitive values to avoid Response object issues
  return {
    message: String(error.message || 'Unknown error'),
    code: String(error.code || ''),
    details: error.details ? String(error.details) : null,
    hint: error.hint ? String(error.hint) : null,
  };
}

/**
 * Helper function to create a new Error with extracted details
 * 
 * @param {Object} supabaseError - Original Supabase error
 * @param {string} context - Context message for the error
 * @returns {Error} - Standard JavaScript Error object
 */
function createSafeError(supabaseError, context) {
  const details = extractErrorDetails(supabaseError);
  const errorMessage = details 
    ? `${context}: ${details.message}${details.code ? ` (code: ${details.code})` : ''}${details.hint ? ` - ${details.hint}` : ''}`
    : context;
  
  const error = new Error(errorMessage);
  error.code = details?.code || null;
  error.details = details?.details || null;
  error.hint = details?.hint || null;
  return error;
}

/**
 * Get or create account for the current user
 * This ensures every user has an account + settings on first access
 * 
 * @param {Object} user - Supabase user object
 * @returns {Promise<{account: Object, settings: Object}>}
 */
export async function ensureUserAccount(user) {
  if (!user) {
    throw new Error('User not authenticated');
  }

  console.log('[AccountService] Ensuring account for user:', user.id);

  // Check if account already exists
  console.log('[AccountService] Checking for existing account...');
  const accountResult = await supabase
    .from('accounts')
    .select('*')
    .eq('owner_user_id', user.id)
    .single();

  // Extract data and error immediately (read response only once)
  const existingAccount = accountResult.data;
  const accountError = accountResult.error;

  if (accountError) {
    const errorDetails = extractErrorDetails(accountError);
    console.log('[AccountService] Account query result:', errorDetails);
  }

  // PGRST116 = no rows returned (expected if account doesn't exist)
  if (accountError && accountError.code !== 'PGRST116') {
    console.error('[AccountService] Unexpected error fetching account');
    throw createSafeError(accountError, 'Failed to fetch account');
  }

  let account = existingAccount;
  
  if (existingAccount) {
    console.log('[AccountService] Found existing account:', existingAccount.id);
  }

  // Create account if it doesn't exist
  if (!account) {
    console.log('[AccountService] No account found, creating new account...');
    
    const accountName = 
      user.user_metadata?.business_name || 
      user.user_metadata?.full_name || 
      user.email?.split('@')[0] || 
      'My Account';

    console.log('[AccountService] Creating account with name:', accountName);

    const createAccountResult = await supabase
      .from('accounts')
      .insert([
        {
          owner_user_id: user.id,
          name: accountName,
        },
      ])
      .select()
      .single();

    const newAccount = createAccountResult.data;
    const createAccountError = createAccountResult.error;

    if (createAccountError) {
      console.error('[AccountService] Error creating account:', extractErrorDetails(createAccountError));
      throw createSafeError(createAccountError, 'Failed to create account');
    }
    
    console.log('[AccountService] Account created successfully:', newAccount.id);
    account = newAccount;
  }

  // Check if settings exist
  console.log('[AccountService] Checking for account settings...');
  const settingsResult = await supabase
    .from('account_settings')
    .select('*')
    .eq('account_id', account.id)
    .single();

  const existingSettings = settingsResult.data;
  const settingsError = settingsResult.error;

  if (settingsError) {
    const errorDetails = extractErrorDetails(settingsError);
    console.log('[AccountService] Settings query result:', errorDetails);
  }

  if (settingsError && settingsError.code !== 'PGRST116') {
    console.error('[AccountService] Unexpected error fetching settings');
    throw createSafeError(settingsError, 'Failed to fetch account settings');
  }

  let settings = existingSettings;
  
  if (existingSettings) {
    console.log('[AccountService] Found existing settings');
  }

  // Create default settings if they don't exist
  if (!settings) {
    console.log('[AccountService] No settings found, creating default settings...');
    
    const createSettingsResult = await supabase
      .from('account_settings')
      .insert([
        {
          account_id: account.id,
          min_price_per_visit: 50.00,
          price_per_sq_ft: 0.10,
          addons: [],
        },
      ])
      .select()
      .single();

    const newSettings = createSettingsResult.data;
    const createSettingsError = createSettingsResult.error;

    if (createSettingsError) {
      console.error('[AccountService] Error creating settings:', extractErrorDetails(createSettingsError));
      throw createSafeError(createSettingsError, 'Failed to create account settings');
    }
    
    console.log('[AccountService] Settings created successfully');
    settings = newSettings;
  }

  console.log('[AccountService] Returning account and settings');
  return { account, settings };
}

/**
 * Get current user's account and settings
 * @returns {Promise<{account: Object, settings: Object}>}
 */
export async function getCurrentUserAccountSettings() {
  const userResult = await supabase.auth.getUser();
  const user = userResult.data?.user;
  const userError = userResult.error;
  
  if (userError) {
    throw createSafeError(userError, 'Failed to get authenticated user');
  }
  if (!user) {
    throw new Error('No authenticated user');
  }

  return await ensureUserAccount(user);
}

/**
 * Update account settings
 * @param {string} accountId - Account ID
 * @param {Object} updates - Settings to update
 * @returns {Promise<Object>} - Updated settings
 */
export async function updateAccountSettings(accountId, updates) {
  const result = await supabase
    .from('account_settings')
    .update(updates)
    .eq('account_id', accountId)
    .select()
    .single();

  const data = result.data;
  const error = result.error;

  if (error) {
    throw createSafeError(error, 'Failed to update account settings');
  }
  return data;
}

/**
 * Update account name
 * @param {string} accountId - Account ID
 * @param {string} name - New account name
 * @returns {Promise<Object>} - Updated account
 */
export async function updateAccountName(accountId, name) {
  const result = await supabase
    .from('accounts')
    .update({ name })
    .eq('id', accountId)
    .select()
    .single();

  const data = result.data;
  const error = result.error;

  if (error) {
    throw createSafeError(error, 'Failed to update account name');
  }
  return data;
}

/**
 * Get account by user ID
 * @param {string} userId - User ID
 * @returns {Promise<Object>} - Account object
 */
export async function getAccountByUserId(userId) {
  const result = await supabase
    .from('accounts')
    .select('*')
    .eq('owner_user_id', userId)
    .single();

  const data = result.data;
  const error = result.error;

  if (error) {
    throw createSafeError(error, 'Failed to get account');
  }
  return data;
}

/**
 * Get settings by account ID
 * @param {string} accountId - Account ID
 * @returns {Promise<Object>} - Settings object
 */
export async function getSettingsByAccountId(accountId) {
  const result = await supabase
    .from('account_settings')
    .select('*')
    .eq('account_id', accountId)
    .single();

  const data = result.data;
  const error = result.error;

  if (error) {
    throw createSafeError(error, 'Failed to get account settings');
  }
  return data;
}
