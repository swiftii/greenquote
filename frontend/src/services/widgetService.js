import { supabase } from '@/lib/supabaseClient';

/**
 * Widget Service
 * Handles widget installation management for the Pro App
 */

/**
 * Generate a random widget ID with prefix
 * @returns {string} Widget ID like wg_xxxxxxxxxxxx
 */
function generateWidgetId() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = 'wg_';
  for (let i = 0; i < 20; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Get or create widget installation for an account
 * Auto-provisions if none exists
 * 
 * @param {string} accountId - Account ID
 * @returns {Promise<Object>} Widget installation record
 */
export async function ensureWidgetInstallation(accountId) {
  if (!accountId) {
    throw new Error('Account ID is required');
  }

  console.log('[WidgetService] Ensuring widget installation for account:', accountId);

  // Try to get existing installation
  const { data: existing, error: fetchError } = await supabase
    .from('widget_installations')
    .select('*')
    .eq('account_id', accountId)
    .single();

  // If found, return it
  if (existing && !fetchError) {
    console.log('[WidgetService] Found existing widget installation:', existing.public_widget_id);
    return existing;
  }

  // PGRST116 means no rows found - that's fine, we'll create one
  if (fetchError && fetchError.code !== 'PGRST116') {
    console.error('[WidgetService] Error fetching widget installation:', fetchError);
    throw new Error('Failed to fetch widget installation: ' + fetchError.message);
  }

  // Create new installation
  console.log('[WidgetService] Creating new widget installation for account:', accountId);
  
  const newWidgetId = generateWidgetId();
  
  const { data: created, error: createError } = await supabase
    .from('widget_installations')
    .insert([{
      account_id: accountId,
      public_widget_id: newWidgetId,
      is_active: true
    }])
    .select()
    .single();

  if (createError) {
    console.error('[WidgetService] Error creating widget installation:', createError);
    throw new Error('Failed to create widget installation: ' + createError.message);
  }

  console.log('[WidgetService] Created widget installation:', created.public_widget_id);
  return created;
}

/**
 * Update widget installation (e.g., toggle active status)
 * 
 * @param {string} installationId - Widget installation ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated widget installation
 */
export async function updateWidgetInstallation(installationId, updates) {
  if (!installationId) {
    throw new Error('Installation ID is required');
  }

  console.log('[WidgetService] Updating widget installation:', installationId);

  const { data, error } = await supabase
    .from('widget_installations')
    .update(updates)
    .eq('id', installationId)
    .select()
    .single();

  if (error) {
    console.error('[WidgetService] Error updating widget installation:', error);
    throw new Error('Failed to update widget installation: ' + error.message);
  }

  console.log('[WidgetService] Widget installation updated');
  return data;
}

/**
 * Regenerate widget ID (in case of compromise)
 * 
 * @param {string} installationId - Widget installation ID
 * @returns {Promise<Object>} Updated widget installation with new ID
 */
export async function regenerateWidgetId(installationId) {
  const newWidgetId = generateWidgetId();
  return updateWidgetInstallation(installationId, {
    public_widget_id: newWidgetId
  });
}

/**
 * Get widget host URL from environment or default
 * @returns {string} Widget host URL
 */
export function getWidgetHostUrl() {
  // Use the Vercel deployment URL or configured widget host
  const host = process.env.REACT_APP_WIDGET_HOST || window.location.origin;
  return host;
}

/**
 * Generate iframe embed code for a widget
 * 
 * @param {string} publicWidgetId - The public widget ID
 * @param {Object} options - Optional customization options
 * @returns {string} HTML iframe embed code
 */
export function generateEmbedCode(publicWidgetId, options = {}) {
  const {
    height = '800px',
    width = '100%',
    borderRadius = '12px'
  } = options;

  const widgetHost = getWidgetHostUrl();
  const widgetUrl = `${widgetHost}/widgets/lawn/v1/?wid=${publicWidgetId}`;

  return `<iframe
  src="${widgetUrl}"
  style="width: ${width}; height: ${height}; border: 0; border-radius: ${borderRadius};"
  loading="lazy"
  allow="geolocation"
></iframe>`;
}
