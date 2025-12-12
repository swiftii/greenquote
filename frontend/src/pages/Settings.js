import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';
import { ensureUserAccount, updateAccountSettings, updateAccountName } from '@/services/accountService';
import { getAccountAddons, createAddon, updateAddon, deleteAddon, createDefaultAddons } from '@/services/addonsService';
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
  });

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

    try {
      const minPrice = parseFloat(formData.minPricePerVisit);
      const pricePerSqFt = parseFloat(formData.pricePerSqFt);

      if (isNaN(minPrice) || minPrice < 0) {
        throw new Error('Please enter a valid minimum price');
      }
      if (isNaN(pricePerSqFt) || pricePerSqFt < 0) {
        throw new Error('Please enter a valid price per square foot');
      }

      // Update account name
      if (formData.accountName !== account.name) {
        await updateAccountName(account.id, formData.accountName);
      }

      // Update settings
      await updateAccountSettings(account.id, {
        min_price_per_visit: minPrice,
        price_per_sq_ft: pricePerSqFt,
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

          {/* Pricing Settings */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Pricing Configuration</CardTitle>
              <CardDescription>Set your default pricing for quotes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
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
                    className="mt-1"
                    required
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Minimum amount charged regardless of lawn size
                  </p>
                </div>
                <div>
                  <Label htmlFor="pricePerSqFt">Price Per Square Foot ($)</Label>
                  <Input
                    id="pricePerSqFt"
                    name="pricePerSqFt"
                    type="number"
                    step="0.0001"
                    min="0"
                    value={formData.pricePerSqFt}
                    onChange={handleInputChange}
                    placeholder="0.01"
                    className="mt-1"
                    required
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Price per square foot of lawn area
                  </p>
                </div>
              </div>
              <div className="mt-4 flex justify-end">
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
