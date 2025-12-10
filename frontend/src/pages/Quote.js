import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';
import { ensureUserAccount } from '@/services/accountService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';

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

// Add-on options (will be merged with user's configured add-ons)
const DEFAULT_ADDONS = [
  { id: 'mulch', label: 'Mulch Installation', pricePerVisit: 75 },
  { id: 'flower_beds', label: 'Flower Bed Maintenance', pricePerVisit: 35 },
  { id: 'hedge_trimming', label: 'Hedge Trimming', pricePerVisit: 45 },
  { id: 'leaf_removal', label: 'Leaf Removal', pricePerVisit: 55 },
];

export default function Quote() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [account, setAccount] = useState(null);
  const [settings, setSettings] = useState(null);
  const [accountLoading, setAccountLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [saving, setSaving] = useState(false);

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
    lawnSizeSqFt: '',
    // Service info
    primaryService: '',
    selectedAddons: [],
    frequency: '',
  });

  // Calculated pricing
  const [pricing, setPricing] = useState({
    perVisit: 0,
    monthly: 0,
    breakdown: [],
  });

  // Load account data
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
      const result = await ensureUserAccount(user);
      setAccount(result?.account || null);
      setSettings(result?.settings || null);
    } catch (err) {
      console.error('[Quote] Error loading account data:', err);
      setError('Failed to load account data. ' + (err?.message || ''));
    } finally {
      setAccountLoading(false);
    }
  };

  // Calculate pricing whenever form changes
  useEffect(() => {
    calculatePricing();
  }, [formData, settings]);

  const calculatePricing = useCallback(() => {
    if (!settings || !formData.lawnSizeSqFt || !formData.primaryService || !formData.frequency) {
      setPricing({ perVisit: 0, monthly: 0, breakdown: [] });
      return;
    }

    const sqFt = parseFloat(formData.lawnSizeSqFt) || 0;
    const minPrice = parseFloat(settings.min_price_per_visit) || 50;
    const pricePerSqFt = parseFloat(settings.price_per_sq_ft) || 0.01;

    // Base price calculation
    let basePrice = Math.max(minPrice, sqFt * pricePerSqFt);
    const breakdown = [{ label: 'Base service', amount: basePrice }];

    // Add-ons
    let addonsTotal = 0;
    formData.selectedAddons.forEach(addonId => {
      const addon = DEFAULT_ADDONS.find(a => a.id === addonId);
      if (addon) {
        addonsTotal += addon.pricePerVisit;
        breakdown.push({ label: addon.label, amount: addon.pricePerVisit });
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
      breakdown,
    });
  }, [formData, settings]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddonToggle = (addonId) => {
    setFormData(prev => ({
      ...prev,
      selectedAddons: prev.selectedAddons.includes(addonId)
        ? prev.selectedAddons.filter(id => id !== addonId)
        : [...prev.selectedAddons, addonId],
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
    // Validate required fields
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
      // For now, just show success - in a real app, this would save to a database
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
          lawnSizeSqFt: formData.lawnSizeSqFt,
        },
        service: {
          primary: formData.primaryService,
          addons: formData.selectedAddons,
          frequency: formData.frequency,
        },
        pricing: pricing,
        accountId: account?.id,
      });

      setSuccess(`Quote saved! ${formData.firstName} ${formData.lastName} - $${pricing.perVisit}/visit`);
      
      // Clear form after short delay
      setTimeout(() => {
        setFormData({
          firstName: '',
          lastName: '',
          phone: '',
          email: '',
          notes: '',
          propertyType: 'residential',
          address: '',
          lawnSizeSqFt: '',
          primaryService: '',
          selectedAddons: [],
          frequency: '',
        });
        setSuccess(null);
      }, 3000);

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
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Customer Information */}
            <Card>
              <CardHeader>
                <CardTitle>Customer Information</CardTitle>
                <CardDescription>Enter the prospect's contact details</CardDescription>
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
                    <Label htmlFor="email">Email</Label>
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

            {/* Property Information */}
            <Card>
              <CardHeader>
                <CardTitle>Property Information</CardTitle>
                <CardDescription>Property details for accurate pricing</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="address">Property Address</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    placeholder="123 Main St, City, State ZIP"
                    className="mt-1"
                  />
                </div>
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
                    <Label htmlFor="lawnSizeSqFt">Lawn Size (sq ft) *</Label>
                    <Input
                      id="lawnSizeSqFt"
                      type="number"
                      value={formData.lawnSizeSqFt}
                      onChange={(e) => handleInputChange('lawnSizeSqFt', e.target.value)}
                      placeholder="5000"
                      className="mt-1"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Service & Pricing */}
            <Card>
              <CardHeader>
                <CardTitle>Service & Pricing</CardTitle>
                <CardDescription>Select service options</CardDescription>
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

                <div>
                  <Label>Add-ons</Label>
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    {DEFAULT_ADDONS.map((addon) => (
                      <div
                        key={addon.id}
                        className={`border rounded-lg p-3 cursor-pointer transition-all ${
                          formData.selectedAddons.includes(addon.id)
                            ? 'border-green-600 bg-green-50'
                            : 'border-gray-200 hover:border-green-300'
                        }`}
                        onClick={() => handleAddonToggle(addon.id)}
                      >
                        <div className="flex items-start gap-2">
                          <Checkbox
                            checked={formData.selectedAddons.includes(addon.id)}
                            onCheckedChange={() => handleAddonToggle(addon.id)}
                          />
                          <div>
                            <p className="font-medium text-sm">{addon.label}</p>
                            <p className="text-xs text-gray-500">+${addon.pricePerVisit}/visit</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

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
            {/* Pricing Summary */}
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>Quote Summary</CardTitle>
                <CardDescription>
                  Using your pricing: ${settings?.min_price_per_visit || 50} min, 
                  ${settings?.price_per_sq_ft || 0.01}/sq ft
                </CardDescription>
              </CardHeader>
              <CardContent>
                {pricing.perVisit > 0 ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      {pricing.breakdown.map((item, index) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span className="text-gray-600">{item.label}</span>
                          <span>${item.amount.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                    <div className="border-t pt-4 space-y-2">
                      <div className="flex justify-between">
                        <span className="font-medium">Per Visit</span>
                        <span className="text-xl font-bold text-green-600">${pricing.perVisit}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Est. Monthly</span>
                        <span className="text-2xl font-bold text-green-600">${pricing.monthly}</span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      {formData.lawnSizeSqFt && `Based on ${Number(formData.lawnSizeSqFt).toLocaleString()} sq ft lawn`}
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>Fill in lawn size, service, and frequency to see pricing</p>
                  </div>
                )}

                <Button
                  onClick={handleSaveQuote}
                  disabled={saving || pricing.perVisit === 0}
                  className="w-full mt-6 bg-green-600 hover:bg-green-700 text-white"
                >
                  {saving ? 'Saving...' : '💾 Save Quote'}
                </Button>
              </CardContent>
            </Card>

            {/* Quick Tips */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Quick Tips</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>• Measure lawn with Google Maps for accurate sq ft</li>
                  <li>• Add-ons increase per-visit price</li>
                  <li>• Weekly service has best per-visit rate</li>
                  <li>• Edit pricing in Settings</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
