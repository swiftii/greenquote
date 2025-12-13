import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';
import { ensureUserAccount, updateAccountSettings, updateAccountName } from '@/services/accountService';
import { getAccountAddons, createAddon, updateAddon, deleteAddon, createDefaultAddons } from '@/services/addonsService';
import { DEFAULT_PRICING_TIERS, validatePricingTiers } from '@/utils/pricingUtils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';

/**
 * Settings Page
 * Route: /settings
 * 
 * Allows users to configure:
 * - Account information (business name)
 * - Pricing settings (min price, price per sq ft)
 * - Custom add-ons with per-visit pricing
 */

export default function Settings() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [account, setAccount] = useState(null);
  const [settings, setSettings] = useState(null);
  const [accountLoading, setAccountLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Add-ons state
  const [addons, setAddons] = useState([]);
  const [addonsLoading, setAddonsLoading] = useState(true);
  const [editingAddon, setEditingAddon] = useState(null);
  const [newAddon, setNewAddon] = useState({ name: '', price_per_visit: '', description: '' });
  const [showNewAddonForm, setShowNewAddonForm] = useState(false);

  const [formData, setFormData] = useState({
    accountName: '',
    minPricePerVisit: '',
    pricePerSqFt: '',
    customerReplyEmail: '',
    useTieredSqftPricing: true,
    sqftPricingTiers: DEFAULT_PRICING_TIERS,
  });

  // Tier validation errors
  const [tierErrors, setTierErrors] = useState([]);

  useEffect(() => {
    if (user && !loading) {
      loadAccountData();
    }
  }, [user, loading]);

  const loadAccountData = async () => {
    if (!isSupabaseConfigured) {
      setError('Supabase is not configured. Please set environment variables.');
      setAccountLoading(false);
      setAddonsLoading(false);
      return;
    }

    try {
      setAccountLoading(true);
      setAddonsLoading(true);
      setError(null);
      
      const result = await ensureUserAccount(user);
      const userAccount = result?.account;
      const userSettings = result?.settings;
      
      setAccount(userAccount);
      setSettings(userSettings);
      
      // Populate form with existing data
      setFormData({
        accountName: userAccount?.name || '',
        minPricePerVisit: userSettings?.min_price_per_visit || '50',
        pricePerSqFt: userSettings?.price_per_sq_ft || '0.01',
        customerReplyEmail: userSettings?.customer_reply_email || '',
        useTieredSqftPricing: userSettings?.use_tiered_sqft_pricing ?? true,
        sqftPricingTiers: userSettings?.sqft_pricing_tiers || DEFAULT_PRICING_TIERS,
      });

      // Load add-ons for this account
      if (userAccount?.id) {
        const accountAddons = await getAccountAddons(userAccount.id);
        setAddons(accountAddons);
      }
    } catch (err) {
      console.error('Error loading account data:', err);
      setError('Failed to load account data. Please try refreshing the page.');
    } finally {
      setAccountLoading(false);
      setAddonsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmitSettings = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);
    setTierErrors([]);

    try {
      const minPrice = parseFloat(formData.minPricePerVisit);
      const pricePerSqFt = parseFloat(formData.pricePerSqFt);

      if (isNaN(minPrice) || minPrice < 0) {
        throw new Error('Please enter a valid minimum price');
      }
      if (isNaN(pricePerSqFt) || pricePerSqFt < 0) {
        throw new Error('Please enter a valid price per square foot');
      }

      // Validate tiered pricing tiers if enabled
      if (formData.useTieredSqftPricing) {
        const validation = validatePricingTiers(formData.sqftPricingTiers);
        if (!validation.valid) {
          setTierErrors(validation.errors);
          throw new Error('Please fix pricing tier errors before saving');
        }
      }

      // Update account name
      if (formData.accountName !== account.name) {
        await updateAccountName(account.id, formData.accountName);
      }

      // Update settings including tiered pricing
      await updateAccountSettings(account.id, {
        min_price_per_visit: minPrice,
        price_per_sq_ft: pricePerSqFt,
        customer_reply_email: formData.customerReplyEmail.trim() || null,
        use_tiered_sqft_pricing: formData.useTieredSqftPricing,
        sqft_pricing_tiers: formData.sqftPricingTiers,
      });

      setSuccess('Settings saved successfully!');
      await loadAccountData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error saving settings:', err);
      setError(err.message || 'Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  // Tier management handlers
  const handleToggleTieredPricing = (checked) => {
    setFormData(prev => ({ ...prev, useTieredSqftPricing: checked }));
    setTierErrors([]);
  };

  const handleTierChange = (index, field, value) => {
    setFormData(prev => {
      const newTiers = [...prev.sqftPricingTiers];
      if (field === 'up_to_sqft') {
        // Handle "No limit" as null
        newTiers[index] = {
          ...newTiers[index],
          up_to_sqft: value === '' || value === null ? null : parseInt(value, 10) || 0,
        };
      } else if (field === 'rate_per_sqft') {
        newTiers[index] = {
          ...newTiers[index],
          rate_per_sqft: parseFloat(value) || 0,
        };
      }
      return { ...prev, sqftPricingTiers: newTiers };
    });
    setTierErrors([]);
  };

  const handleAddTier = () => {
    setFormData(prev => {
      const newTiers = [...prev.sqftPricingTiers];
      // Find the last tier with a limit
      const lastLimitedIndex = newTiers.findIndex(t => t.up_to_sqft === null);
      const insertIndex = lastLimitedIndex === -1 ? newTiers.length : lastLimitedIndex;
      
      // Calculate suggested up_to_sqft
      const previousMax = insertIndex > 0 
        ? (newTiers[insertIndex - 1]?.up_to_sqft || 5000) 
        : 0;
      const suggestedMax = previousMax + 10000;
      
      // Insert new tier before the unlimited tier
      newTiers.splice(insertIndex, 0, {
        up_to_sqft: suggestedMax,
        rate_per_sqft: 0.006,
      });
      
      return { ...prev, sqftPricingTiers: newTiers };
    });
    setTierErrors([]);
  };

  const handleRemoveTier = (index) => {
    if (formData.sqftPricingTiers.length <= 1) {
      setError('At least one pricing tier is required');
      return;
    }
    setFormData(prev => {
      const newTiers = prev.sqftPricingTiers.filter((_, i) => i !== index);
      return { ...prev, sqftPricingTiers: newTiers };
    });
    setTierErrors([]);
  };

  const handleResetTiersToDefault = () => {
    setFormData(prev => ({
      ...prev,
      sqftPricingTiers: DEFAULT_PRICING_TIERS,
    }));
    setTierErrors([]);
  };

  // Add-on CRUD handlers
  const handleAddAddon = async () => {
    if (!newAddon.name.trim()) {
      setError('Please enter an add-on name');
      return;
    }
    if (!newAddon.price_per_visit || parseFloat(newAddon.price_per_visit) < 0) {
      setError('Please enter a valid price');
      return;
    }

    try {
      setError(null);
      const created = await createAddon(account.id, {
        name: newAddon.name.trim(),
        description: newAddon.description.trim() || null,
        price_per_visit: parseFloat(newAddon.price_per_visit),
        is_active: true,
        sort_order: addons.length,
      });

      setAddons([...addons, created]);
      setNewAddon({ name: '', price_per_visit: '', description: '' });
      setShowNewAddonForm(false);
      setSuccess('Add-on created!');
      setTimeout(() => setSuccess(null), 2000);
    } catch (err) {
      console.error('Error creating add-on:', err);
      setError('Failed to create add-on: ' + (err.message || ''));
    }
  };

  const handleUpdateAddon = async (addonId, updates) => {
    try {
      setError(null);
      const updated = await updateAddon(addonId, updates);
      setAddons(addons.map(a => a.id === addonId ? updated : a));
      setEditingAddon(null);
      setSuccess('Add-on updated!');
      setTimeout(() => setSuccess(null), 2000);
    } catch (err) {
      console.error('Error updating add-on:', err);
      setError('Failed to update add-on: ' + (err.message || ''));
    }
  };

  const handleToggleActive = async (addon) => {
    try {
      const updated = await updateAddon(addon.id, { is_active: !addon.is_active });
      setAddons(addons.map(a => a.id === addon.id ? updated : a));
    } catch (err) {
      console.error('Error toggling add-on:', err);
      setError('Failed to update add-on');
    }
  };

  const handleDeleteAddon = async (addonId) => {
    if (!window.confirm('Are you sure you want to delete this add-on?')) return;

    try {
      setError(null);
      await deleteAddon(addonId);
      setAddons(addons.filter(a => a.id !== addonId));
      setSuccess('Add-on deleted!');
      setTimeout(() => setSuccess(null), 2000);
    } catch (err) {
      console.error('Error deleting add-on:', err);
      setError('Failed to delete add-on: ' + (err.message || ''));
    }
  };

  const handleCreateDefaults = async () => {
    if (addons.length > 0) {
      if (!window.confirm('This will add default add-ons. Continue?')) return;
    }

    try {
      setError(null);
      const created = await createDefaultAddons(account.id);
      setAddons([...addons, ...created]);
      setSuccess(`Created ${created.length} default add-ons!`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error creating defaults:', err);
      setError('Failed to create default add-ons');
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error.message);
    }
  };

  if (loading || accountLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-green-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading settings...</p>
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
              🌱 Settings
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              {user?.user_metadata?.full_name || user?.email}
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

        {/* Account Information */}
        <form onSubmit={handleSubmitSettings}>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>Manage your account details</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="accountName">Business / Account Name</Label>
                  <Input
                    id="accountName"
                    name="accountName"
                    type="text"
                    value={formData.accountName}
                    onChange={handleInputChange}
                    placeholder="My Lawn Care Business"
                    className="mt-1"
                    required
                  />
                </div>
                <div>
                  <Label>Account Owner</Label>
                  <p className="mt-1 text-sm text-gray-600">{user?.email}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Email Settings */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Email Settings</CardTitle>
              <CardDescription>
                Configure how customers can reply to your quote emails
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="customerReplyEmail">
                    Customer Reply-To Email
                    <span className="text-xs text-gray-500 ml-1">(optional)</span>
                  </Label>
                  <Input
                    id="customerReplyEmail"
                    name="customerReplyEmail"
                    type="email"
                    value={formData.customerReplyEmail}
                    onChange={handleInputChange}
                    placeholder={user?.email || 'replies@yourbusiness.com'}
                    className="mt-1"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    When customers reply to quote emails, responses will be sent to this address.
                    {!formData.customerReplyEmail && (
                      <span className="text-green-600"> Defaults to: {user?.email}</span>
                    )}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pricing Settings */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Pricing Configuration</CardTitle>
              <CardDescription>Set your default pricing for quotes</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Minimum Price */}
              <div className="mb-6">
                <Label htmlFor="minPricePerVisit">Minimum Price Per Visit ($)</Label>
                <Input
                  id="minPricePerVisit"
                  name="minPricePerVisit"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.minPricePerVisit}
                  onChange={handleInputChange}
                  placeholder="50.00"
                  className="mt-1 max-w-xs"
                  required
                />
                <p className="mt-1 text-xs text-gray-500">
                  Minimum amount charged regardless of lawn size
                </p>
              </div>

              {/* Tiered Pricing Toggle */}
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <Switch
                        id="useTieredPricing"
                        checked={formData.useTieredSqftPricing}
                        onCheckedChange={handleToggleTieredPricing}
                      />
                      <Label htmlFor="useTieredPricing" className="font-medium cursor-pointer">
                        Enable volume-based (tiered) pricing
                      </Label>
                    </div>
                    <p className="mt-1 text-xs text-gray-500 ml-12">
                      Automatically applies lower per-sq-ft rates to larger lawns.
                    </p>
                  </div>
                </div>
              </div>

              {/* Tiered Pricing Editor (visible when toggle is ON) */}
              {formData.useTieredSqftPricing && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <Label className="text-base font-medium">Pricing Tiers</Label>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={handleResetTiersToDefault}
                      >
                        Reset to Default
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleAddTier}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        + Add Tier
                      </Button>
                    </div>
                  </div>

                  {/* Tier Validation Errors */}
                  {tierErrors.length > 0 && (
                    <Alert variant="destructive" className="mb-4">
                      <AlertDescription>
                        <ul className="list-disc list-inside space-y-1">
                          {tierErrors.map((err, i) => (
                            <li key={i}>{err}</li>
                          ))}
                        </ul>
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Tiers Table */}
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Up to Sq Ft</th>
                          <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Price per Sq Ft</th>
                          <th className="px-4 py-2 text-right text-sm font-medium text-gray-600">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {formData.sqftPricingTiers.map((tier, index) => {
                          const isUnlimited = tier.up_to_sqft === null;
                          return (
                            <tr key={index} className="border-t">
                              <td className="px-4 py-3">
                                {isUnlimited ? (
                                  <span className="text-gray-500 italic">No limit</span>
                                ) : (
                                  <Input
                                    type="number"
                                    min="1"
                                    step="1000"
                                    value={tier.up_to_sqft || ''}
                                    onChange={(e) => handleTierChange(index, 'up_to_sqft', e.target.value)}
                                    className="w-32"
                                    placeholder="sq ft"
                                  />
                                )}
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-1">
                                  <span className="text-gray-500">$</span>
                                  <Input
                                    type="number"
                                    min="0.001"
                                    step="0.001"
                                    value={tier.rate_per_sqft || ''}
                                    onChange={(e) => handleTierChange(index, 'rate_per_sqft', e.target.value)}
                                    className="w-28"
                                    placeholder="0.01"
                                  />
                                </div>
                              </td>
                              <td className="px-4 py-3 text-right">
                                {!isUnlimited && formData.sqftPricingTiers.length > 1 && (
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="ghost"
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                    onClick={() => handleRemoveTier(index)}
                                  >
                                    Remove
                                  </Button>
                                )}
                                {isUnlimited && (
                                  <span className="text-xs text-gray-400">Required</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <p className="mt-2 text-xs text-gray-500">
                    💡 Pricing is applied progressively (like tax brackets). Larger lawns receive automatic volume discounts.
                  </p>
                </div>
              )}

              {/* Flat Price (visible when toggle is OFF) */}
              {!formData.useTieredSqftPricing && (
                <div className="mb-6">
                  <Label htmlFor="pricePerSqFt">Flat Price Per Square Foot ($)</Label>
                  <Input
                    id="pricePerSqFt"
                    name="pricePerSqFt"
                    type="number"
                    step="0.0001"
                    min="0"
                    value={formData.pricePerSqFt}
                    onChange={handleInputChange}
                    placeholder="0.01"
                    className="mt-1 max-w-xs"
                    required
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Single flat rate applied to all lawn sizes
                  </p>
                </div>
              )}

              <div className="flex justify-end border-t pt-4">
                <Button
                  type="submit"
                  disabled={saving}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  {saving ? 'Saving...' : 'Save Pricing'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>

        {/* Add-ons Management */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Service Add-ons</CardTitle>
                <CardDescription>
                  Configure add-on services with custom pricing. These will appear in your quote flow.
                </CardDescription>
              </div>
              <div className="flex gap-2">
                {addons.length === 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleCreateDefaults}
                  >
                    Create Defaults
                  </Button>
                )}
                <Button
                  type="button"
                  size="sm"
                  onClick={() => setShowNewAddonForm(true)}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  + Add New
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* New Add-on Form */}
            {showNewAddonForm && (
              <div className="mb-4 p-4 border border-green-200 rounded-lg bg-green-50">
                <h4 className="font-medium mb-3">New Add-on</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <Label htmlFor="newAddonName">Name *</Label>
                    <Input
                      id="newAddonName"
                      value={newAddon.name}
                      onChange={(e) => setNewAddon({ ...newAddon, name: e.target.value })}
                      placeholder="e.g., Mulch Installation"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="newAddonPrice">Price Per Visit ($) *</Label>
                    <Input
                      id="newAddonPrice"
                      type="number"
                      step="0.01"
                      min="0"
                      value={newAddon.price_per_visit}
                      onChange={(e) => setNewAddon({ ...newAddon, price_per_visit: e.target.value })}
                      placeholder="25.00"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="newAddonDesc">Description</Label>
                    <Input
                      id="newAddonDesc"
                      value={newAddon.description}
                      onChange={(e) => setNewAddon({ ...newAddon, description: e.target.value })}
                      placeholder="Optional description"
                      className="mt-1"
                    />
                  </div>
                </div>
                <div className="mt-3 flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleAddAddon}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    Save Add-on
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setShowNewAddonForm(false);
                      setNewAddon({ name: '', price_per_visit: '', description: '' });
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {/* Add-ons List */}
            {addonsLoading ? (
              <p className="text-gray-500">Loading add-ons...</p>
            ) : addons.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No add-ons configured yet.</p>
                <p className="text-sm mt-2">
                  Click &quot;Create Defaults&quot; to start with common add-ons, or add your own.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {addons.map((addon) => (
                  <div
                    key={addon.id}
                    className={`border rounded-lg p-4 transition-all ${
                      addon.is_active ? 'border-gray-200 bg-white' : 'border-gray-100 bg-gray-50 opacity-60'
                    }`}
                  >
                    {editingAddon === addon.id ? (
                      // Edit mode
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div>
                            <Label>Name</Label>
                            <Input
                              value={addon.name}
                              onChange={(e) => setAddons(addons.map(a => 
                                a.id === addon.id ? { ...a, name: e.target.value } : a
                              ))}
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label>Price Per Visit ($)</Label>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              value={addon.price_per_visit}
                              onChange={(e) => setAddons(addons.map(a => 
                                a.id === addon.id ? { ...a, price_per_visit: e.target.value } : a
                              ))}
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label>Description</Label>
                            <Input
                              value={addon.description || ''}
                              onChange={(e) => setAddons(addons.map(a => 
                                a.id === addon.id ? { ...a, description: e.target.value } : a
                              ))}
                              className="mt-1"
                            />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => handleUpdateAddon(addon.id, {
                              name: addon.name,
                              price_per_visit: addon.price_per_visit,
                              description: addon.description,
                            })}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            Save
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingAddon(null);
                              loadAccountData(); // Reset changes
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      // View mode
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <h4 className="font-medium text-gray-900">{addon.name}</h4>
                            <span className="text-green-600 font-semibold">
                              ${parseFloat(addon.price_per_visit).toFixed(2)}/visit
                            </span>
                            {!addon.is_active && (
                              <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded">
                                Inactive
                              </span>
                            )}
                          </div>
                          {addon.description && (
                            <p className="text-sm text-gray-500 mt-1">{addon.description}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <Label htmlFor={`active-${addon.id}`} className="text-sm text-gray-600">
                              Active
                            </Label>
                            <Switch
                              id={`active-${addon.id}`}
                              checked={addon.is_active}
                              onCheckedChange={() => handleToggleActive(addon)}
                            />
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditingAddon(addon.id)}
                          >
                            Edit
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleDeleteAddon(addon.id)}
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Billing Settings Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Billing & Subscription</CardTitle>
            <CardDescription>
              Manage your subscription, payment method, and view invoices
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                View your current plan, update payment methods, or manage your subscription.
              </p>
              <Button
                type="button"
                onClick={() => navigate('/settings/billing')}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                Manage Billing
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Back to Dashboard */}
        <div className="flex justify-center">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/dashboard')}
            className="border-green-600 text-green-600 hover:bg-green-50"
          >
            ← Back to Dashboard
          </Button>
        </div>
      </main>
    </div>
  );
}
