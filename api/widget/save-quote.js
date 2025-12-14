/**
 * Widget Save Quote API Endpoint
 * POST /api/widget/save-quote
 * 
 * Saves a quote generated from the embedded widget to Supabase.
 * Uses service role key for server-side data access.
 */

import { createClient } from '@supabase/supabase-js';

// Create Supabase client with service role key
const supabaseUrl = process.env.SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Validate environment
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('[Widget Save Quote] Missing environment variables');
    return res.status(500).json({ 
      error: 'Widget service not configured' 
    });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const {
      widgetId,
      accountId,
      customerName,
      customerEmail,
      customerPhone,
      propertyAddress,
      propertyType,
      areaSqFt,
      areaSource,
      primaryService,
      addons,
      frequency,
      basePricePerVisit,
      totalPricePerVisit,
      monthlyEstimate,
      pricingMode,
      pricingTiersSnapshot,
      flatRateSnapshot,
      preferredTime,
      notes
    } = req.body;

    // Validate required fields
    if (!widgetId || !accountId) {
      return res.status(400).json({ 
        error: 'Missing required fields: widgetId and accountId' 
      });
    }

    // Verify the widget belongs to the account
    const { data: widgetInstallation, error: widgetError } = await supabase
      .from('widget_installations')
      .select('id, account_id, is_active')
      .eq('public_widget_id', widgetId)
      .eq('account_id', accountId)
      .single();

    if (widgetError || !widgetInstallation) {
      console.error('[Widget Save Quote] Widget verification failed:', widgetId, accountId);
      return res.status(403).json({ error: 'Widget verification failed' });
    }

    if (!widgetInstallation.is_active) {
      return res.status(403).json({ error: 'Widget is disabled' });
    }

    // Build services snapshot
    const servicesSnapshot = {
      baseService: primaryService,
      addons: addons || []
    };

    // Calculate monthly revenue
    const frequencyVisits = {
      one_time: 1,
      weekly: 4,
      bi_weekly: 2,
      monthly: 1
    };
    const visitsPerMonth = frequencyVisits[frequency] || 1;
    const estimatedMonthlyRevenue = monthlyEstimate || (totalPricePerVisit * visitsPerMonth);

    // Insert quote
    const { data: quote, error: insertError } = await supabase
      .from('quotes')
      .insert([{
        account_id: accountId,
        created_by_user_id: null, // Widget quotes have no user
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
        send_to_customer: false,
        status: 'pending',
        services: servicesSnapshot,
        source: 'widget',
        // Pricing snapshot
        pricing_mode: pricingMode || 'flat',
        pricing_tiers_snapshot: pricingTiersSnapshot || null,
        flat_rate_snapshot: flatRateSnapshot ? parseFloat(flatRateSnapshot) : null
      }])
      .select()
      .single();

    if (insertError) {
      console.error('[Widget Save Quote] Insert error:', insertError);
      return res.status(500).json({ 
        error: 'Failed to save quote',
        message: insertError.message 
      });
    }

    console.log('[Widget Save Quote] Quote saved:', quote?.id, 'for account:', accountId);

    return res.status(201).json({
      success: true,
      quoteId: quote.id,
      message: 'Quote saved successfully'
    });

  } catch (error) {
    console.error('[Widget Save Quote] Unexpected error:', error);
    return res.status(500).json({ 
      error: 'Failed to save quote',
      message: error.message 
    });
  }
}
