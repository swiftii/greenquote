import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';
import { ensureUserAccount } from '@/services/accountService';
import { getQuotesThisMonth, calculateOverage, DEFAULT_PLAN_TIER, getQuoteCountByStatus } from '@/services/quoteService';
import { getClientCount, getTotalMonthlyRevenue } from '@/services/clientService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import BillingBanner from '@/components/BillingBanner';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [account, setAccount] = useState(null);
  const [settings, setSettings] = useState(null);
  const [accountLoading, setAccountLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Quotes this month state
  const [quotesThisMonth, setQuotesThisMonth] = useState(0);
  const [quotesLoading, setQuotesLoading] = useState(true);
  const [overageInfo, setOverageInfo] = useState(null);
  
  // Clients and revenue state
  const [clientCount, setClientCount] = useState(0);
  const [monthlyRevenue, setMonthlyRevenue] = useState(0);
  const [pendingQuotesCount, setPendingQuotesCount] = useState(0);

  useEffect(() => {
    if (user && !loading) {
      loadAccountData();
    } else if (!loading && !user) {
      setAccountLoading(false);
    }
  }, [user, loading]);

  const loadAccountData = async () => {
    // Check if Supabase is configured
    if (!isSupabaseConfigured) {
      setError('Supabase is not configured. Please set REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY environment variables.');
      setAccountLoading(false);
      setQuotesLoading(false);
      return;
    }

    try {
      setAccountLoading(true);
      setQuotesLoading(true);
      setError(null);
      
      console.log('[Dashboard] Loading account data for user:', user?.id);
      
      const result = await ensureUserAccount(user);
      
      console.log('[Dashboard] Account loaded:', result?.account);
      console.log('[Dashboard] Settings loaded:', result?.settings);
      
      setAccount(result?.account || null);
      setSettings(result?.settings || null);
      
      // Load quotes count for this month
      if (result?.account?.id) {
        try {
          const count = await getQuotesThisMonth(result.account.id);
          setQuotesThisMonth(count);
          
          // Calculate overage info (using default plan tier for now)
          // TODO: Get plan_tier from account_settings when billing is integrated
          const planTier = result?.settings?.plan_tier || DEFAULT_PLAN_TIER;
          const overage = calculateOverage(count, planTier);
          setOverageInfo(overage);
          
          console.log('[Dashboard] Quotes this month:', count, 'Overage info:', overage);
        } catch (quoteErr) {
          console.error('[Dashboard] Error loading quotes count:', quoteErr);
          // Non-critical, don't show error but log it
          setQuotesThisMonth(0);
          setOverageInfo(null);
        }
        
        // Load clients count and revenue
        try {
          const [clients, revenue, pending] = await Promise.all([
            getClientCount(result.account.id),
            getTotalMonthlyRevenue(result.account.id),
            getQuoteCountByStatus(result.account.id, 'pending'),
          ]);
          setClientCount(clients);
          setMonthlyRevenue(revenue);
          setPendingQuotesCount(pending);
          console.log('[Dashboard] Clients:', clients, 'Revenue:', revenue, 'Pending:', pending);
        } catch (clientErr) {
          console.error('[Dashboard] Error loading client data:', clientErr);
          // Non-critical
          setClientCount(0);
          setMonthlyRevenue(0);
          setPendingQuotesCount(0);
        }
      }
    } catch (err) {
      // Create a clean error message from whatever error we received
      console.error('[Dashboard] Error loading account data:', err);
      console.error('[Dashboard] Error stack:', err?.stack);
      
      let errorMessage = 'Failed to load account data. ';
      
      // Safely extract error information
      if (err && typeof err === 'object') {
        if (err.message) {
          errorMessage += String(err.message);
        }
        if (err.code) {
          errorMessage += ` (Error code: ${String(err.code)})`;
        }
        if (err.hint) {
          errorMessage += ` Hint: ${String(err.hint)}`;
        }
      } else if (typeof err === 'string') {
        errorMessage += err;
      }
      
      setError(errorMessage);
    } finally {
      setAccountLoading(false);
      setQuotesLoading(false);
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
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100">
      {/* Billing Banner - shows trial countdown or billing warnings */}
      <BillingBanner />

      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-green-800">
              🌱 GreenQuote Pro
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <Button
              onClick={() => navigate('/settings')}
              variant="ghost"
              className="text-gray-700 hover:text-green-600"
            >
              Settings
            </Button>
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back{user?.user_metadata?.full_name ? `, ${user.user_metadata.full_name}` : ''}!
          </h2>
          <p className="text-gray-600">
            {account?.name || 'Ready to manage your lawn care business'}
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card 
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => navigate('/clients')}
          >
            <CardHeader>
              <CardTitle className="text-lg">Active Clients</CardTitle>
              <CardDescription>Total clients from won quotes</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-green-600">{clientCount}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quotes This Month</CardTitle>
              <CardDescription>Generated this billing period</CardDescription>
            </CardHeader>
            <CardContent>
              {quotesLoading ? (
                <div className="animate-pulse">
                  <div className="h-10 w-16 bg-gray-200 rounded"></div>
                </div>
              ) : (
                <>
                  <p className="text-4xl font-bold text-green-600">{quotesThisMonth}</p>
                  {overageInfo && (
                    <div className="mt-2">
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>{overageInfo.planName} Plan</span>
                        <span>•</span>
                        <span>{overageInfo.includedLimit} included</span>
                      </div>
                      {overageInfo.isOverLimit && (
                        <p className="text-xs text-amber-600 mt-1">
                          ⚠️ {overageInfo.overageCount} overage quote{overageInfo.overageCount > 1 ? 's' : ''}
                        </p>
                      )}
                      {!overageInfo.isOverLimit && overageInfo.remainingIncluded > 0 && (
                        <p className="text-xs text-gray-500 mt-1">
                          {overageInfo.remainingIncluded} remaining this month
                        </p>
                      )}
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Revenue</CardTitle>
              <CardDescription>Estimated monthly revenue</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-green-600">$0</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Get started with GreenQuote Pro</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button 
                onClick={() => navigate('/quote')}
                className="h-auto py-6 flex flex-col items-start bg-green-600 hover:bg-green-700"
              >
                <span className="text-lg font-semibold mb-1">Create New Quote</span>
                <span className="text-sm opacity-90">Generate a quote for a customer</span>
              </Button>
              <Button variant="outline" className="h-auto py-6 flex flex-col items-start border-green-600 text-green-600 hover:bg-green-50">
                <span className="text-lg font-semibold mb-1">Manage Clients</span>
                <span className="text-sm opacity-90">View and edit client configurations</span>
              </Button>
              <Button 
                onClick={() => navigate('/settings')}
                variant="outline" 
                className="h-auto py-6 flex flex-col items-start border-green-600 text-green-600 hover:bg-green-50"
              >
                <span className="text-lg font-semibold mb-1">Widget Settings</span>
                <span className="text-sm opacity-90">Configure your quote widgets</span>
              </Button>
              <Button variant="outline" className="h-auto py-6 flex flex-col items-start border-green-600 text-green-600 hover:bg-green-50">
                <span className="text-lg font-semibold mb-1">View Analytics</span>
                <span className="text-sm opacity-90">Track your business performance</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Pricing Settings Card */}
        {settings && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Current Pricing Settings</span>
                <Button
                  onClick={() => navigate('/settings')}
                  variant="outline"
                  className="border-green-600 text-green-600 hover:bg-green-50"
                >
                  Edit Settings
                </Button>
              </CardTitle>
              <CardDescription>Your default pricing configuration</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Min Price Per Visit</p>
                  <p className="text-2xl font-bold text-green-600">
                    ${Number(settings.min_price_per_visit).toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Price Per Sq Ft</p>
                  <p className="text-2xl font-bold text-green-600">
                    ${Number(settings.price_per_sq_ft).toFixed(4)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Enabled Add-ons</p>
                  <p className="text-2xl font-bold text-green-600">
                    {settings.addons?.length || 0}
                  </p>
                  {settings.addons && settings.addons.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {settings.addons.map((addon, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800"
                        >
                          {addon}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Account Info */}
        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-medium">{user?.email}</p>
              </div>
              {user?.user_metadata?.business_name && (
                <div>
                  <p className="text-sm text-gray-600">Business Name</p>
                  <p className="font-medium">{user.user_metadata.business_name}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-600">Account Status</p>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Active
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
