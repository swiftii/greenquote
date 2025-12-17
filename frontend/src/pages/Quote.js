import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';
import { ensureUserAccount } from '@/services/accountService';
import { getActiveAddons } from '@/services/addonsService';
import { sendQuoteEmail } from '@/services/emailService';
import { saveQuote, markQuoteEmailSent } from '@/services/quoteService';
import { calculateTieredPrice, calculateFlatPrice, DEFAULT_PRICING_TIERS } from '@/utils/pricingUtils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { GoogleMap, useJsApiLoader, Autocomplete, Polygon } from '@react-google-maps/api';

/**
 * Quote Page - Pro Quote Flow Entry Point
 * Route: /quote
 * 
 * This page allows logged-in users to create quotes for prospects using:
 * - Their account-specific pricing (tiered or flat rate)
 * - Their custom add-ons from account_addons table
 * - Google Maps for address autocomplete and boundary drawing
 * - Area calculation from polygon for accurate pricing
 */

// Google Maps libraries to load
const GOOGLE_MAPS_LIBRARIES = ['places', 'drawing', 'geometry'];

// Service options
const SERVICES = [
  { id: 'mowing', label: 'Lawn Mowing' },
  { id: 'fertilization', label: 'Fertilization' },
  { id: 'aeration', label: 'Aeration' },
  { id: 'overseeding', label: 'Overseeding' },
  { id: 'weed_control', label: 'Weed Control' },
];

// Frequency options with multipliers
const FREQUENCIES = [
  { id: 'one_time', label: 'One-Time', multiplier: 1.2, visitsPerMonth: 1 },
  { id: 'weekly', label: 'Weekly', multiplier: 0.85, visitsPerMonth: 4 },
  { id: 'bi_weekly', label: 'Bi-Weekly', multiplier: 1.0, visitsPerMonth: 2 },
  { id: 'monthly', label: 'Monthly', multiplier: 1.1, visitsPerMonth: 1 },
];

// Property types
const PROPERTY_TYPES = [
  { id: 'residential', label: 'Residential' },
  { id: 'commercial', label: 'Commercial' },
];

// Map container style
const mapContainerStyle = {
  width: '100%',
  height: '400px',
  borderRadius: '8px',
};

// Default map center (US center)
const defaultCenter = {
  lat: 39.8283,
  lng: -98.5795,
};

// Default area estimates by property type
const DEFAULT_AREA_ESTIMATES = {
  residential: 8000,
  commercial: 15000,
};

// Polygon options for editable polygons
const editablePolygonOptions = {
  fillColor: '#22c55e',
  fillOpacity: 0.3,
  strokeColor: '#16a34a',
  strokeOpacity: 1,
  strokeWeight: 2,
  clickable: true,
  editable: true, // Enable vertex dragging
  draggable: false,
  zIndex: 1,
};

export default function Quote() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [account, setAccount] = useState(null);
  const [settings, setSettings] = useState(null);
  const [accountLoading, setAccountLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [saving, setSaving] = useState(false);

  // Account-specific add-ons
  const [availableAddons, setAvailableAddons] = useState([]);

  // Google Maps state
  const [map, setMap] = useState(null);
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [mapZoom, setMapZoom] = useState(4);
  const [polygonPath, setPolygonPath] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [calculatedArea, setCalculatedArea] = useState(0);
  const autocompleteRef = useRef(null);

  // Check if Google Maps API key is available
  const googleMapsApiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY || '';
  const isMapsConfigured = !!googleMapsApiKey;

  // Load Google Maps
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: googleMapsApiKey,
    libraries: GOOGLE_MAPS_LIBRARIES,
  });

  // Form state
  const [formData, setFormData] = useState({
    // Customer info
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    notes: '',
    // Property info
    propertyType: 'residential',
    address: '',
    latitude: null,
    longitude: null,
    lawnSizeSqFt: '',
    areaSource: 'manual', // 'manual' or 'measured'
    // Service info
    primaryService: '',
    selectedAddonIds: [], // IDs of selected add-ons from account_addons
    frequency: '',
    // Email option
    sendQuoteToCustomer: true, // Default to sending email
  });

  // Calculated pricing
  const [pricing, setPricing] = useState({
    perVisit: 0,
    monthly: 0,
    basePrice: 0,
    addonsTotal: 0,
    breakdown: [],
    pricingMode: 'flat', // 'tiered' or 'flat'
    tiersSnapshot: null, // snapshot of tiers used for tiered pricing
    flatRateSnapshot: null, // snapshot of flat rate used
  });

  // Load account data and add-ons
  useEffect(() => {
    if (user && !loading) {
      loadAccountData();
    } else if (!loading && !user) {
      setAccountLoading(false);
    }
  }, [user, loading]);

  const loadAccountData = async () => {
    if (!isSupabaseConfigured) {
      setError('Supabase is not configured.');
      setAccountLoading(false);
      return;
    }

    try {
      setAccountLoading(true);
      setError(null);
      
      // Load account and settings
      const result = await ensureUserAccount(user);
      const userAccount = result?.account;
      const userSettings = result?.settings;
      
      setAccount(userAccount);
      setSettings(userSettings);

      // Load account-specific active add-ons
      if (userAccount?.id) {
        const addons = await getActiveAddons(userAccount.id);
        setAvailableAddons(addons);
        console.log('[Quote] Loaded', addons.length, 'active add-ons for account');
      }
    } catch (err) {
      console.error('[Quote] Error loading account data:', err);
      setError('Failed to load account data. ' + (err?.message || ''));
    } finally {
      setAccountLoading(false);
    }
  };

  // Calculate area from polygon
  const calculatePolygonArea = useCallback((path) => {
    if (!path || path.length < 3 || !window.google?.maps?.geometry) {
      setCalculatedArea(0);
      return 0;
    }

    try {
      const latLngArray = path.map(point => 
        new window.google.maps.LatLng(point.lat, point.lng)
      );
      const mvcArray = new window.google.maps.MVCArray(latLngArray);
      const areaInSqMeters = window.google.maps.geometry.spherical.computeArea(mvcArray);
      const areaInSqFt = Math.round(areaInSqMeters * 10.7639);
      
      setCalculatedArea(areaInSqFt);
      setFormData(prev => ({
        ...prev,
        lawnSizeSqFt: areaInSqFt.toString(),
        areaSource: 'measured',
      }));
      
      return areaInSqFt;
    } catch (err) {
      console.error('[Quote] Error calculating area:', err);
      return 0;
    }
  }, []);

  // Calculate pricing whenever form or add-ons change
  useEffect(() => {
    calculatePricing();
  }, [formData, settings, availableAddons]);

  const calculatePricing = useCallback(() => {
    if (!settings || !formData.lawnSizeSqFt || !formData.primaryService || !formData.frequency) {
      setPricing({ 
        perVisit: 0, 
        monthly: 0, 
        basePrice: 0, 
        addonsTotal: 0, 
        breakdown: [],
        pricingMode: 'flat',
        tiersSnapshot: null,
        flatRateSnapshot: null,
      });
      return;
    }

    const sqFt = parseFloat(formData.lawnSizeSqFt) || 0;
    const minPrice = parseFloat(settings.min_price_per_visit) || 50;
    const useTieredPricing = settings.use_tiered_sqft_pricing ?? true;
    const tiers = settings.sqft_pricing_tiers || DEFAULT_PRICING_TIERS;
    const flatRate = parseFloat(settings.price_per_sq_ft) || 0.01;

    let calculatedFromArea = 0;
    const breakdown = [];
    let pricingMode = 'flat';
    let tiersSnapshot = null;
    let flatRateSnapshot = null;

    if (useTieredPricing && tiers && tiers.length > 0) {
      // Use tiered blended pricing
      pricingMode = 'tiered';
      tiersSnapshot = tiers;
      
      const { totalPrice, breakdown: tierBreakdown } = calculateTieredPrice(sqFt, tiers);
      calculatedFromArea = totalPrice;

      // Build breakdown from tier calculation
      if (tierBreakdown.length > 0) {
        tierBreakdown.forEach(tier => {
          breakdown.push({
            label: `${tier.sqftInTier.toLocaleString()} sq ft @ $${tier.rate.toFixed(4)}/sqft`,
            amount: tier.price,
            note: '',
          });
        });
      }
    } else {
      // Use flat pricing
      pricingMode = 'flat';
      flatRateSnapshot = flatRate;
      calculatedFromArea = calculateFlatPrice(sqFt, flatRate);
      
      breakdown.push({ 
        label: `Base service (${sqFt.toLocaleString()} sq ft × $${flatRate.toFixed(4)})`, 
        amount: calculatedFromArea,
        note: ''
      });
    }

    // Enforce minimum price
    const basePrice = Math.max(calculatedFromArea, minPrice);
    if (calculatedFromArea < minPrice) {
      breakdown.push({
        label: 'Minimum price applied',
        amount: minPrice - calculatedFromArea,
        note: `(min $${minPrice})`,
      });
    }

    // Calculate add-ons total using account-specific add-ons
    let addonsTotal = 0;
    formData.selectedAddonIds.forEach(addonId => {
      const addon = availableAddons.find(a => a.id === addonId);
      if (addon) {
        const addonPrice = parseFloat(addon.price_per_visit) || 0;
        addonsTotal += addonPrice;
        breakdown.push({ 
          label: addon.name, 
          amount: addonPrice 
        });
      }
    });

    // Get frequency info
    const freq = FREQUENCIES.find(f => f.id === formData.frequency);
    const multiplier = freq?.multiplier || 1;
    const visitsPerMonth = freq?.visitsPerMonth || 1;

    // Calculate final prices
    const perVisit = Math.round((basePrice + addonsTotal) * multiplier);
    const monthly = perVisit * visitsPerMonth;

    setPricing({
      perVisit,
      monthly,
      basePrice: Math.round(basePrice),
      addonsTotal: Math.round(addonsTotal),
      breakdown,
      pricingMode,
      tiersSnapshot,
      flatRateSnapshot,
    });
  }, [formData, settings, availableAddons]);

  // Handle map load
  const onMapLoad = useCallback((mapInstance) => {
    setMap(mapInstance);
  }, []);

  // Handle map click for drawing polygon
  const onMapClick = useCallback((event) => {
    if (!isDrawing) return;

    const newPoint = {
      lat: event.latLng.lat(),
      lng: event.latLng.lng(),
    };

    setPolygonPath(prev => {
      const newPath = [...prev, newPoint];
      if (newPath.length >= 3) {
        calculatePolygonArea(newPath);
      }
      return newPath;
    });
  }, [isDrawing, calculatePolygonArea]);

  // Handle autocomplete place selection
  const onPlaceChanged = useCallback(() => {
    if (autocompleteRef.current) {
      const place = autocompleteRef.current.getPlace();
      
      if (place && place.geometry && place.geometry.location) {
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        
        setFormData(prev => ({
          ...prev,
          address: place.formatted_address || place.name || '',
          latitude: lat,
          longitude: lng,
        }));
        
        setMapCenter({ lat, lng });
        setMapZoom(19);
        
        // Clear existing polygon
        setPolygonPath([]);
        setCalculatedArea(0);
        setFormData(prev => ({
          ...prev,
          lawnSizeSqFt: '',
          areaSource: 'manual',
        }));
      }
    }
  }, []);

  const onAutocompleteLoad = useCallback((autocomplete) => {
    autocompleteRef.current = autocomplete;
  }, []);

  const startDrawing = () => {
    setIsDrawing(true);
    setPolygonPath([]);
    setCalculatedArea(0);
  };

  const finishDrawing = () => {
    setIsDrawing(false);
    if (polygonPath.length >= 3) {
      calculatePolygonArea(polygonPath);
    }
  };

  const clearPolygon = () => {
    setPolygonPath([]);
    setCalculatedArea(0);
    setIsDrawing(false);
    setFormData(prev => ({
      ...prev,
      lawnSizeSqFt: '',
      areaSource: 'manual',
    }));
  };

  const undoLastPoint = () => {
    setPolygonPath(prev => {
      const newPath = prev.slice(0, -1);
      if (newPath.length >= 3) {
        calculatePolygonArea(newPath);
      } else {
        setCalculatedArea(0);
      }
      return newPath;
    });
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (field === 'lawnSizeSqFt') {
      setFormData(prev => ({ ...prev, areaSource: 'manual' }));
    }
  };

  const handleAddonToggle = (addonId) => {
    setFormData(prev => ({
      ...prev,
      selectedAddonIds: prev.selectedAddonIds.includes(addonId)
        ? prev.selectedAddonIds.filter(id => id !== addonId)
        : [...prev.selectedAddonIds, addonId],
    }));
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error.message);
    }
  };

  const handleSaveQuote = async () => {
    if (!formData.firstName || !formData.lastName || !formData.phone) {
      setError('Please fill in customer name and phone number.');
      return;
    }
    if (!formData.lawnSizeSqFt || !formData.primaryService || !formData.frequency) {
      setError('Please fill in lawn size, service, and frequency.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      // Get selected add-on details for saving
      const selectedAddonsDetails = formData.selectedAddonIds.map(id => {
        const addon = availableAddons.find(a => a.id === id);
        return addon ? { id: addon.id, name: addon.name, price: addon.price_per_visit } : null;
      }).filter(Boolean);

      // Get frequency label for email
      const frequencyOption = FREQUENCIES.find(f => f.id === formData.frequency);
      const frequencyLabel = frequencyOption?.label || formData.frequency;

      console.log('[Quote] Saving quote:', {
        customer: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
          email: formData.email,
        },
        property: {
          type: formData.propertyType,
          address: formData.address,
          latitude: formData.latitude,
          longitude: formData.longitude,
          lawnSizeSqFt: formData.lawnSizeSqFt,
          areaSource: formData.areaSource,
          polygonPath: polygonPath,
        },
        service: {
          primary: formData.primaryService,
          addons: selectedAddonsDetails,
          frequency: formData.frequency,
        },
        pricing: pricing,
        accountId: account?.id,
      });

      // ========================================
      // STEP 1: Save quote to Supabase (BILLABLE EVENT)
      // This happens on EVERY save, regardless of email checkbox
      // ========================================
      let savedQuote = null;
      let dbError = null;
      
      try {
        // Build services snapshot
        const servicesSnapshot = {
          baseService: formData.primaryService,
          addons: selectedAddonsDetails,
        };

        savedQuote = await saveQuote({
          accountId: account?.id,
          userId: user?.id,
          customerName: `${formData.firstName} ${formData.lastName}`,
          customerEmail: formData.email || null,
          customerPhone: formData.phone || null,
          propertyAddress: formData.address || null,
          propertyType: formData.propertyType || null,
          areaSqFt: formData.lawnSizeSqFt,
          basePricePerVisit: pricing.basePrice,
          addons: selectedAddonsDetails,
          totalPricePerVisit: pricing.perVisit,
          frequency: formData.frequency,
          monthlyEstimate: pricing.monthly,
          sendToCustomer: formData.email && formData.sendQuoteToCustomer,
          services: servicesSnapshot, // Save services snapshot for pipeline
          // Pricing snapshot for historical accuracy
          pricingMode: pricing.pricingMode,
          pricingTiersSnapshot: pricing.tiersSnapshot,
          flatRateSnapshot: pricing.flatRateSnapshot,
        });
        console.log('[Quote] Quote saved to database:', savedQuote?.id);
      } catch (err) {
        console.error('[Quote] Failed to save quote to database:', err);
        dbError = err.message || 'Database error';
        // Continue - don't block quote creation if DB fails
      }

      // ========================================
      // STEP 2: Send email if checkbox is checked
      // ========================================
      let emailSent = false;
      let emailError = null;

      // Send email if customer email is provided AND sendQuoteToCustomer is checked
      if (formData.email && formData.sendQuoteToCustomer) {
        try {
          console.log('[Quote] Sending quote email to:', formData.email);
          // Use custom reply-to email from settings, fallback to user's auth email
          const replyToEmail = settings?.customer_reply_email || user?.email;
          console.log('[Quote] Using Reply-To email:', replyToEmail);
          await sendQuoteEmail({
            customerEmail: formData.email,
            customerName: `${formData.firstName} ${formData.lastName}`,
            businessName: account?.name || 'GreenQuote Pro',
            replyToEmail: replyToEmail,
            propertyAddress: formData.address,
            areaSqFt: formData.lawnSizeSqFt,
            basePrice: pricing.basePrice,
            addons: selectedAddonsDetails,
            totalPerVisit: pricing.perVisit,
            frequency: frequencyLabel,
            monthlyEstimate: pricing.monthly,
          });
          emailSent = true;
          console.log('[Quote] Email sent successfully');

          // Mark quote as email sent in database
          if (savedQuote?.id) {
            try {
              await markQuoteEmailSent(savedQuote.id);
            } catch (updateErr) {
              console.warn('[Quote] Failed to mark email sent:', updateErr);
              // Non-critical, don't show error to user
            }
          }
        } catch (err) {
          console.error('[Quote] Failed to send email:', err);
          emailError = err.message || 'Failed to send email';
        }
      }

      // ========================================
      // STEP 3: Show success message with appropriate info
      // ========================================
      let successMessage = `Quote saved! ${formData.firstName} ${formData.lastName} - $${pricing.perVisit}/visit`;
      
      if (emailSent) {
        successMessage = `Quote saved and emailed to ${formData.email}! ${formData.firstName} ${formData.lastName} - $${pricing.perVisit}/visit`;
      } else if (formData.email && formData.sendQuoteToCustomer && emailError) {
        successMessage += ` (Note: Email could not be sent: ${emailError})`;
      }
      
      // Add DB error warning if quote tracking failed
      if (dbError) {
        successMessage += ' ⚠️ Usage tracking failed. Please contact support.';
        console.error('[Quote] CRITICAL: Quote usage not tracked!', dbError);
      }
      
      setSuccess(successMessage);
      
      setTimeout(() => {
        setFormData({
          firstName: '',
          lastName: '',
          phone: '',
          email: '',
          notes: '',
          propertyType: 'residential',
          address: '',
          latitude: null,
          longitude: null,
          lawnSizeSqFt: '',
          areaSource: 'manual',
          primaryService: '',
          selectedAddonIds: [],
          frequency: '',
          sendQuoteToCustomer: true,
        });
        setPolygonPath([]);
        setCalculatedArea(0);
        setMapCenter(defaultCenter);
        setMapZoom(4);
        setSuccess(null);
      }, 5000);

    } catch (err) {
      console.error('[Quote] Error saving quote:', err);
      setError('Failed to save quote. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading || accountLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-green-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => navigate('/dashboard')}
              variant="ghost"
              className="text-gray-600 hover:text-green-600"
            >
              ← Back to Dashboard
            </Button>
            <h1 className="text-2xl font-bold text-green-800">
              🌱 Create Quote
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              {account?.name || user?.email}
            </span>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="border-green-600 text-green-600 hover:bg-green-50"
            >
              Log Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-6 bg-green-50 text-green-800 border-green-200">
            <AlertDescription>✅ {success}</AlertDescription>
          </Alert>
        )}

        {!isMapsConfigured && (
          <Alert className="mb-6 bg-yellow-50 text-yellow-800 border-yellow-200">
            <AlertDescription>
              ⚠️ Google Maps is not configured. You can still enter lawn size manually.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Customer Information */}
            <Card>
              <CardHeader>
                <CardTitle>Customer Information</CardTitle>
                <CardDescription>Enter the prospect&apos;s contact details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      placeholder="John"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      placeholder="Smith"
                      className="mt-1"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="phone">Phone *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="(555) 123-4567"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">
                      Email
                      <span className="text-xs text-gray-500 ml-1">(quote will be emailed)</span>
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="john@example.com"
                      className="mt-1"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    placeholder="Gate code, pets, special instructions..."
                    className="mt-1"
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Property Information with Google Maps */}
            <Card>
              <CardHeader>
                <CardTitle>Property Information</CardTitle>
                <CardDescription>
                  Search for the address, then draw the lawn boundary on the map
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Address Autocomplete */}
                <div>
                  <Label htmlFor="address">Property Address *</Label>
                  {isLoaded ? (
                    <Autocomplete
                      onLoad={onAutocompleteLoad}
                      onPlaceChanged={onPlaceChanged}
                      options={{
                        types: ['address'],
                        componentRestrictions: { country: 'us' },
                      }}
                    >
                      <Input
                        id="address"
                        value={formData.address}
                        onChange={(e) => handleInputChange('address', e.target.value)}
                        placeholder="Start typing an address..."
                        className="mt-1"
                      />
                    </Autocomplete>
                  ) : (
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      placeholder="Enter address manually"
                      className="mt-1"
                    />
                  )}
                </div>

                {/* Property Type & Lawn Size */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="propertyType">Property Type</Label>
                    <Select
                      value={formData.propertyType}
                      onValueChange={(value) => handleInputChange('propertyType', value)}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {PROPERTY_TYPES.map((type) => (
                          <SelectItem key={type.id} value={type.id}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="lawnSizeSqFt">
                      Lawn Size (sq ft) *
                      {formData.areaSource === 'measured' && (
                        <span className="text-green-600 text-xs ml-2">(measured)</span>
                      )}
                    </Label>
                    <Input
                      id="lawnSizeSqFt"
                      type="number"
                      value={formData.lawnSizeSqFt}
                      onChange={(e) => handleInputChange('lawnSizeSqFt', e.target.value)}
                      placeholder="Draw on map or enter manually"
                      className="mt-1"
                    />
                  </div>
                </div>

                {/* Google Map */}
                {isLoaded && isMapsConfigured && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Draw Service Area Boundary</Label>
                      <div className="flex gap-2">
                        {!isDrawing ? (
                          <Button
                            type="button"
                            size="sm"
                            onClick={startDrawing}
                            disabled={!formData.address}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            ✏️ Start Drawing
                          </Button>
                        ) : (
                          <>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={undoLastPoint}
                              disabled={polygonPath.length === 0}
                            >
                              ↩️ Undo
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              onClick={finishDrawing}
                              disabled={polygonPath.length < 3}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              ✓ Finish
                            </Button>
                          </>
                        )}
                        {polygonPath.length > 0 && (
                          <Button
                            type="button"
                            size="sm"
                            variant="destructive"
                            onClick={clearPolygon}
                          >
                            🗑️ Clear
                          </Button>
                        )}
                      </div>
                    </div>

                    {isDrawing && (
                      <p className="text-sm text-blue-600 bg-blue-50 p-2 rounded">
                        Click on the map to add boundary points (min 3), then click &quot;Finish&quot;.
                      </p>
                    )}

                    <GoogleMap
                      mapContainerStyle={mapContainerStyle}
                      center={mapCenter}
                      zoom={mapZoom}
                      onLoad={onMapLoad}
                      onClick={onMapClick}
                      mapTypeId="satellite"
                      options={{
                        disableDefaultUI: true,
                        zoomControl: true,
                        mapTypeControl: true,
                        fullscreenControl: true,
                      }}
                    >
                      {polygonPath.length > 0 && (
                        <Polygon paths={polygonPath} options={polygonOptions} />
                      )}
                    </GoogleMap>

                    {calculatedArea > 0 && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center justify-between">
                        <div>
                          <span className="text-sm text-gray-600">Measured Area:</span>
                          <span className="text-xl font-bold text-green-600 ml-2">
                            {calculatedArea.toLocaleString()} sq ft
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {loadError && (
                  <p className="text-sm text-red-600">Error loading Google Maps.</p>
                )}
              </CardContent>
            </Card>

            {/* Service & Add-ons */}
            <Card>
              <CardHeader>
                <CardTitle>Service & Add-ons</CardTitle>
                <CardDescription>Select service options and add-ons</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="primaryService">Primary Service *</Label>
                  <Select
                    value={formData.primaryService}
                    onValueChange={(value) => handleInputChange('primaryService', value)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select service" />
                    </SelectTrigger>
                    <SelectContent>
                      {SERVICES.map((service) => (
                        <SelectItem key={service.id} value={service.id}>
                          {service.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Account-Specific Add-ons */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>Add-ons</Label>
                    <Link 
                      to="/settings" 
                      className="text-xs text-green-600 hover:underline"
                    >
                      Configure in Settings →
                    </Link>
                  </div>
                  
                  {availableAddons.length === 0 ? (
                    <div className="text-center py-6 border border-dashed border-gray-300 rounded-lg">
                      <p className="text-gray-500 text-sm">No add-ons configured yet.</p>
                      <Link 
                        to="/settings" 
                        className="text-sm text-green-600 hover:underline mt-1 inline-block"
                      >
                        Add your first add-on in Settings
                      </Link>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {availableAddons.map((addon) => (
                        <div
                          key={addon.id}
                          className={`border rounded-lg p-3 cursor-pointer transition-all ${
                            formData.selectedAddonIds.includes(addon.id)
                              ? 'border-green-600 bg-green-50'
                              : 'border-gray-200 hover:border-green-300'
                          }`}
                          onClick={() => handleAddonToggle(addon.id)}
                        >
                          <div className="flex items-start gap-2">
                            <Checkbox
                              checked={formData.selectedAddonIds.includes(addon.id)}
                              onCheckedChange={() => handleAddonToggle(addon.id)}
                            />
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <p className="font-medium text-sm">{addon.name}</p>
                                <span className="text-green-600 font-semibold text-sm">
                                  +${parseFloat(addon.price_per_visit).toFixed(2)}
                                </span>
                              </div>
                              {addon.description && (
                                <p className="text-xs text-gray-500 mt-0.5">{addon.description}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Frequency */}
                <div>
                  <Label>Frequency *</Label>
                  <div className="grid grid-cols-4 gap-2 mt-2">
                    {FREQUENCIES.map((freq) => (
                      <button
                        key={freq.id}
                        type="button"
                        className={`p-3 rounded-lg border text-center transition-all ${
                          formData.frequency === freq.id
                            ? 'border-green-600 bg-green-600 text-white'
                            : 'border-gray-200 hover:border-green-300'
                        }`}
                        onClick={() => handleInputChange('frequency', freq.id)}
                      >
                        <span className="text-sm font-medium">{freq.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Quote Summary */}
          <div className="space-y-6">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>Quote Summary</CardTitle>
                <CardDescription>
                  {settings?.use_tiered_sqft_pricing ? (
                    <>Volume-based pricing • ${settings?.min_price_per_visit || 50} min</>
                  ) : (
                    <>Pricing: ${settings?.min_price_per_visit || 50} min, ${settings?.price_per_sq_ft || 0.01}/sq ft</>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {pricing.perVisit > 0 ? (
                  <div className="space-y-4">
                    {/* Tiered Pricing Note */}
                    {pricing.pricingMode === 'tiered' && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-2 text-xs text-green-700">
                        💡 Larger lawns receive automatic volume discounts.
                      </div>
                    )}

                    {/* Breakdown */}
                    <div className="space-y-2">
                      {pricing.breakdown.map((item, index) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span className="text-gray-600">
                            {item.label}
                            {item.note && <span className="text-yellow-600 text-xs ml-1">{item.note}</span>}
                          </span>
                          <span>${item.amount.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>

                    {/* Subtotals */}
                    <div className="border-t pt-3 space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Base Price</span>
                        <span>${pricing.basePrice}</span>
                      </div>
                      {pricing.addonsTotal > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Add-ons</span>
                          <span>+${pricing.addonsTotal}</span>
                        </div>
                      )}
                    </div>

                    {/* Totals */}
                    <div className="border-t pt-3 space-y-2">
                      <div className="flex justify-between">
                        <span className="font-medium">Per Visit</span>
                        <span className="text-xl font-bold text-green-600">${pricing.perVisit}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Est. Monthly</span>
                        <span className="text-2xl font-bold text-green-600">${pricing.monthly}</span>
                      </div>
                    </div>

                    <p className="text-xs text-gray-500">
                      {formData.lawnSizeSqFt && (
                        <>
                          {Number(formData.lawnSizeSqFt).toLocaleString()} sq ft
                          {formData.areaSource === 'measured' && ' (measured)'}
                        </>
                      )}
                      {formData.selectedAddonIds.length > 0 && (
                        <> • {formData.selectedAddonIds.length} add-on{formData.selectedAddonIds.length > 1 ? 's' : ''}</>
                      )}
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>Fill in lawn size, service, and frequency to see pricing</p>
                  </div>
                )}

                {/* Send Quote to Customer Checkbox */}
                {formData.email && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div 
                      className="flex items-center gap-3 cursor-pointer"
                      onClick={() => handleInputChange('sendQuoteToCustomer', !formData.sendQuoteToCustomer)}
                    >
                      <Checkbox
                        id="sendQuoteToCustomer"
                        checked={formData.sendQuoteToCustomer}
                        onCheckedChange={(checked) => handleInputChange('sendQuoteToCustomer', checked)}
                      />
                      <div className="flex-1">
                        <Label 
                          htmlFor="sendQuoteToCustomer" 
                          className="text-sm font-medium cursor-pointer"
                        >
                          Send quote to customer
                        </Label>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Email this quote to {formData.email}
                        </p>
                      </div>
                      <span className="text-lg">📧</span>
                    </div>
                  </div>
                )}

                <Button
                  onClick={handleSaveQuote}
                  disabled={saving || pricing.perVisit === 0}
                  className="w-full mt-4 bg-green-600 hover:bg-green-700 text-white"
                >
                  {saving ? 'Sending...' : (formData.email && formData.sendQuoteToCustomer) ? '📧 Save & Email Quote' : '💾 Save Quote'}
                </Button>
                {formData.email && !formData.sendQuoteToCustomer && (
                  <p className="text-xs text-gray-500 text-center mt-2">
                    Quote will be saved without sending email
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Quick Tips */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Quick Tips</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>• Search address, then draw boundary on map</li>
                  <li>• Area is auto-calculated from boundary</li>
                  <li>• Add-ons are configured in Settings</li>
                  <li>• Weekly service has best per-visit rate</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
