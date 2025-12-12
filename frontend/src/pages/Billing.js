import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { ensureUserAccount } from '@/services/accountService';
import { 
  createCheckoutSession, 
  getBillingStatus,
  startTrial,
  formatTrialEnd, 
  getStatusLabel 
} from '@/services/billingService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function Billing() {
  const navigate = useNavigate();
  const { user, loading: authLoading, signOut } = useAuth();
  const [account, setAccount] = useState(null);
  const [billingStatus, setBillingStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadData = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      // Load account
      const result = await ensureUserAccount(user);
      setAccount(result?.account);

      if (result?.account?.id) {
        // Load billing status
        const status = await getBillingStatus(result.account.id);
        setBillingStatus(status);

        // If user has access, redirect to dashboard
        if (status.hasAccess) {
          navigate('/dashboard');
          return;
        }
      }
    } catch (err) {
      console.error('[Billing] Error loading data:', err);
      setError(err.message || 'Failed to load billing information');
    } finally {
      setLoading(false);
    }
  }, [user, navigate]);

  useEffect(() => {
    if (!authLoading && user) {
      loadData();
    } else if (!authLoading && !user) {
      navigate('/login');
    }
  }, [user, authLoading, loadData, navigate]);

  const handleStartSubscription = async () => {
    if (!account) return;

    try {
      setCheckoutLoading(true);
      setError(null);

      const { url } = await createCheckoutSession({
        accountId: account.id,
        userId: user.id,
        userEmail: user.email,
        accountName: account.name,
      });

      if (url) {
        window.location.href = url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (err) {
      console.error('[Billing] Error creating checkout:', err);
      setError(err.message || 'Failed to start checkout');
    } finally {
      setCheckoutLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  const statusLabel = billingStatus ? getStatusLabel(billingStatus.status) : 'Unknown';
  const trialEndFormatted = billingStatus?.trialEnd ? formatTrialEnd(billingStatus.trialEnd) : null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-green-600">GreenQuote Pro</h1>
            <Button variant="ghost" onClick={signOut}>
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            {billingStatus?.status === 'canceled' || billingStatus?.status === 'none'
              ? 'Your trial has ended'
              : 'Subscribe to GreenQuote Pro'}
          </h2>
          <p className="text-gray-600">
            {billingStatus?.status === 'past_due'
              ? 'Your payment is past due. Please update your payment method.'
              : 'Continue using GreenQuote Pro to manage your lawn care business.'}
          </p>
        </div>

        <Card className="max-w-lg mx-auto">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Pro Plan</CardTitle>
            <CardDescription>
              Everything you need to run your lawn care business
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Current Status */}
            {billingStatus && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">Current Status:</span>
                  <span className={`text-sm font-medium ${
                    billingStatus.status === 'active' ? 'text-green-600' :
                    billingStatus.status === 'trialing' ? 'text-blue-600' :
                    'text-red-600'
                  }`}>
                    {statusLabel}
                  </span>
                </div>
                {trialEndFormatted && billingStatus.status !== 'active' && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Trial ended:</span>
                    <span className="text-sm text-gray-900">{trialEndFormatted}</span>
                  </div>
                )}
              </div>
            )}

            {/* Features */}
            <ul className="space-y-3 mb-6">
              {[
                'Unlimited quotes',
                'Google Maps integration',
                'Email quotes to customers',
                'Custom pricing rules',
                'Service add-ons',
                'Customer database',
                'Analytics dashboard',
              ].map((feature, index) => (
                <li key={index} className="flex items-center text-gray-700">
                  <svg
                    className="h-5 w-5 text-green-500 mr-3 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  {feature}
                </li>
              ))}
            </ul>

            {/* CTA Button */}
            <Button
              onClick={handleStartSubscription}
              disabled={checkoutLoading}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-6 text-lg"
            >
              {checkoutLoading ? (
                <span className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Loading...
                </span>
              ) : (
                'Start Subscription'
              )}
            </Button>

            <p className="text-center text-sm text-gray-500 mt-4">
              Secure payment powered by Stripe
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
