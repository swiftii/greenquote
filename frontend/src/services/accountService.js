import { supabase } from '@/lib/supabaseClient';

/**
 * Account Service
 * Handles all account and account_settings operations
 */

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

  try {
    // Check if account already exists
    console.log('[AccountService] Checking for existing account...');
    const { data: existingAccount, error: accountError } = await supabase
      .from('accounts')
      .select('*')
      .eq('owner_user_id', user.id)
      .single();

    if (accountError) {
      console.log('[AccountService] Account query error:', {
        code: accountError.code,
        message: accountError.message,
        details: accountError.details,
        hint: accountError.hint
      });
    }

    if (accountError && accountError.code !== 'PGRST116') {
      // PGRST116 = no rows returned (expected if account doesn't exist)
      console.error('[AccountService] Unexpected error fetching account:', accountError);
      throw accountError;
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

      const { data: newAccount, error: createAccountError } = await supabase
        .from('accounts')
        .insert([
          {
            owner_user_id: user.id,
            name: accountName,
          },
        ])
        .select()
        .single();

      if (createAccountError) {
        console.error('[AccountService] Error creating account:', {
          code: createAccountError.code,
          message: createAccountError.message,
          details: createAccountError.details,
          hint: createAccountError.hint
        });
        throw createAccountError;
      }
      
      console.log('[AccountService] Account created successfully:', newAccount.id);
      account = newAccount;
    }

    // Check if settings exist
    const { data: existingSettings, error: settingsError } = await supabase
      .from('account_settings')
      .select('*')
      .eq('account_id', account.id)
      .single();

    if (settingsError && settingsError.code !== 'PGRST116') {
      throw settingsError;
    }

    let settings = existingSettings;

    // Create default settings if they don't exist
    if (!settings) {
      const { data: newSettings, error: createSettingsError } = await supabase
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

      if (createSettingsError) throw createSettingsError;
      settings = newSettings;
    }

    return { account, settings };
  } catch (error) {
    console.error('Error ensuring user account:', error);
    throw error;
  }
}

/**
 * Get current user's account and settings
 * @returns {Promise<{account: Object, settings: Object}>}
 */
export async function getCurrentUserAccountSettings() {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError) throw userError;
  if (!user) throw new Error('No authenticated user');

  return await ensureUserAccount(user);
}

/**
 * Update account settings
 * @param {string} accountId - Account ID
 * @param {Object} updates - Settings to update
 * @returns {Promise<Object>} - Updated settings
 */
export async function updateAccountSettings(accountId, updates) {
  const { data, error } = await supabase
    .from('account_settings')
    .update(updates)
    .eq('account_id', accountId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update account name
 * @param {string} accountId - Account ID
 * @param {string} name - New account name
 * @returns {Promise<Object>} - Updated account
 */
export async function updateAccountName(accountId, name) {
  const { data, error } = await supabase
    .from('accounts')
    .update({ name })
    .eq('id', accountId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Get account by user ID
 * @param {string} userId - User ID
 * @returns {Promise<Object>} - Account object
 */
export async function getAccountByUserId(userId) {
  const { data, error } = await supabase
    .from('accounts')
    .select('*')
    .eq('owner_user_id', userId)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Get settings by account ID
 * @param {string} accountId - Account ID
 * @returns {Promise<Object>} - Settings object
 */
export async function getSettingsByAccountId(accountId) {
  const { data, error } = await supabase
    .from('account_settings')
    .select('*')
    .eq('account_id', accountId)
    .single();

  if (error) throw error;
  return data;
}
