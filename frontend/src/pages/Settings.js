import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';
import { ensureUserAccount, updateAccountSettings, updateAccountName } from '@/services/accountService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

const AVAILABLE_ADDONS = [
  { id: 'mulch', label: 'Mulch Installation', description: 'Add mulch to garden beds' },
  { id: 'flower_beds', label: 'Flower Bed Maintenance', description: 'Weeding and edging flower beds' },
  { id: 'hedge_trimming', label: 'Hedge Trimming', description: 'Trim and shape hedges' },
  { id: 'leaf_removal', label: 'Leaf Removal', description: 'Fall leaf cleanup service' },
  { id: 'aeration', label: 'Lawn Aeration', description: 'Core aeration service' },
  { id: 'fertilization', label: 'Fertilization', description: 'Lawn fertilizer application' },
];

export default function Settings() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [account, setAccount] = useState(null);
  const [settings, setSettings] = useState(null);
  const [accountLoading, setAccountLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [formData, setFormData] = useState({
    accountName: '',
    minPricePerVisit: '',
    pricePerSqFt: '',
    selectedAddons: [],
  });

  useEffect(() => {
    if (user && !loading) {
      loadAccountData();
    }
  }, [user, loading]);

  const loadAccountData = async () => {
    try {
      setAccountLoading(true);
      setError(null);
      const { account: userAccount, settings: userSettings } = await ensureUserAccount(user);
      setAccount(userAccount);
      setSettings(userSettings);
      
      // Populate form with existing data
      setFormData({
        accountName: userAccount.name || '',
        minPricePerVisit: userSettings.min_price_per_visit || '',
        pricePerSqFt: userSettings.price_per_sq_ft || '',
        selectedAddons: userSettings.addons || [],
      });
    } catch (err) {
      console.error('Error loading account data:', err);
      setError('Failed to load account data. Please try refreshing the page.');
    } finally {
      setAccountLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddonToggle = (addonId) => {
    setFormData((prev) => ({
      ...prev,
      selectedAddons: prev.selectedAddons.includes(addonId)
        ? prev.selectedAddons.filter((id) => id !== addonId)
        : [...prev.selectedAddons, addonId],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      // Validate inputs
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
        addons: formData.selectedAddons,
      });

      setSuccess('Settings saved successfully!');
      
      // Reload data to reflect changes
      await loadAccountData();

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error saving settings:', err);
      setError(err.message || 'Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
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
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          {/* Account Information */}
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
              <div className="space-y-4">
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
                    The minimum amount charged per visit, regardless of lawn size
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
                    placeholder="0.10"
                    className="mt-1"
                    required
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Price charged per square foot of lawn area
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Add-ons */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Service Add-ons</CardTitle>
              <CardDescription>Select which additional services you offer</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {AVAILABLE_ADDONS.map((addon) => (
                  <div
                    key={addon.id}
                    className={`border rounded-lg p-4 cursor-pointer transition-all ${
                      formData.selectedAddons.includes(addon.id)
                        ? 'border-green-600 bg-green-50'
                        : 'border-gray-200 hover:border-green-300'
                    }`}
                    onClick={() => handleAddonToggle(addon.id)}
                  >
                    <div className="flex items-start">
                      <input
                        type="checkbox"
                        checked={formData.selectedAddons.includes(addon.id)}
                        onChange={() => handleAddonToggle(addon.id)}
                        className="mt-1 mr-3 h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                      />
                      <div>
                        <p className="font-medium text-gray-900">{addon.label}</p>
                        <p className="text-sm text-gray-600">{addon.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/dashboard')}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
