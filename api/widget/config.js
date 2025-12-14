/**
 * Widget Config API Endpoint
 * GET /api/widget/config?wid=<public_widget_id>
 * 
 * Returns account-specific pricing settings for the embedded widget.
 * Uses service role key for server-side data access.
 */

import { createClient } from '@supabase/supabase-js';

// Create Supabase client with service role key for server-side access
const supabaseUrl = process.env.SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Set CORS headers for widget access
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Validate environment
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('[Widget Config] Missing environment variables');
    return res.status(500).json({ 
      error: 'Widget service not configured',
      details: 'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY'
    });
  }

  // Get widget ID from query params
  const { wid } = req.query;

  if (!wid) {
    return res.status(400).json({ error: 'Missing widget ID (wid parameter)' });
  }

  // Validate widget ID format (should start with wg_)
  if (!wid.startsWith('wg_') || wid.length < 10) {
    return res.status(400).json({ error: 'Invalid widget ID format' });
  }

  try {
    // Create service role client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Step 1: Look up widget installation
    const { data: widgetInstallation, error: widgetError } = await supabase
      .from('widget_installations')
      .select('id, account_id, is_active')
      .eq('public_widget_id', wid)
      .single();

    if (widgetError || !widgetInstallation) {
      console.log('[Widget Config] Widget not found:', wid);
      return res.status(404).json({ error: 'Widget not found' });
    }

    // Step 2: Check if widget is active
    if (!widgetInstallation.is_active) {
      return res.status(403).json({ error: 'Widget is disabled' });
    }

    const accountId = widgetInstallation.account_id;

    // Step 3: Load account info
    const { data: account, error: accountError } = await supabase
      .from('accounts')
      .select('id, name')
      .eq('id', accountId)
      .single();

    if (accountError || !account) {
      console.error('[Widget Config] Account not found:', accountId);
      return res.status(404).json({ error: 'Account not found' });
    }

    // Step 4: Load account settings
    const { data: settings, error: settingsError } = await supabase
      .from('account_settings')
      .select(`
        min_price_per_visit,
        price_per_sq_ft,
        use_tiered_sqft_pricing,
        sqft_pricing_tiers
      `)
      .eq('account_id', accountId)
      .single();

    if (settingsError || !settings) {
      console.error('[Widget Config] Settings not found for account:', accountId);
      return res.status(404).json({ error: 'Account settings not found' });
    }

    // Step 5: Load active add-ons
    const { data: addons, error: addonsError } = await supabase
      .from('account_addons')
      .select('id, name, description, price_per_visit, sort_order')
      .eq('account_id', accountId)
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (addonsError) {
      console.error('[Widget Config] Error loading add-ons:', addonsError);
      // Continue without add-ons rather than failing
    }

    // Step 6: Build response payload
    const configPayload = {
      accountId: accountId,
      businessName: account.name || 'Lawn Care Service',
      
      pricing: {
        minPricePerVisit: parseFloat(settings.min_price_per_visit) || 50,
        pricePerSqFt: parseFloat(settings.price_per_sq_ft) || 0.01,
        useTieredPricing: settings.use_tiered_sqft_pricing ?? true,
        tiers: settings.sqft_pricing_tiers || [
          { up_to_sqft: 5000, rate_per_sqft: 0.012 },
          { up_to_sqft: 20000, rate_per_sqft: 0.008 },
          { up_to_sqft: null, rate_per_sqft: 0.005 }
        ]
      },
      
      addons: (addons || []).map(addon => ({
        id: addon.id,
        name: addon.name,
        description: addon.description || '',
        pricePerVisit: parseFloat(addon.price_per_visit) || 0
      })),
      
      frequency: {
        // Standard frequency multipliers (could be made configurable per account later)
        one_time: { label: 'One-Time', multiplier: 1.2, visitsPerMonth: 1 },
        weekly: { label: 'Weekly', multiplier: 0.85, visitsPerMonth: 4 },
        bi_weekly: { label: 'Bi-Weekly', multiplier: 1.0, visitsPerMonth: 2 },
        monthly: { label: 'Monthly', multiplier: 1.1, visitsPerMonth: 1 }
      }
    };

    // Set cache headers (short TTL for correctness)
    res.setHeader('Cache-Control', 'public, max-age=60, stale-while-revalidate=120');

    console.log('[Widget Config] Returning config for widget:', wid, 'account:', accountId);
    return res.status(200).json(configPayload);

  } catch (error) {
    console.error('[Widget Config] Unexpected error:', error);
    return res.status(500).json({ 
      error: 'Failed to load widget configuration',
      message: error.message 
    });
  }
}
