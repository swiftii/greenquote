import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { ensureUserAccount } from '@/services/accountService';
import { getBillingStatus, createPortalSession, formatTrialEnd, getStatusLabel } from '@/services/billingService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

/**
 * Billing Settings Page
 * Route: /settings/billing
 * 
 * Displays subscription status and allows users to manage billing via Stripe Portal
 */
export default function BillingSettings() {
  const navigate = useNavigate();
  const { user, loading: authLoading, signOut } = useAuth();
  const [account, setAccount] = useState(null);
  const [billingStatus, setBillingStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);
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
      }
    } catch (err) {
      console.error('[BillingSettings] Error loading data:', err);
      setError(err.message || 'Failed to load billing information');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading && user) {
      loadData();
    } else if (!authLoading && !user) {
      navigate('/login');
    }
  }, [user, authLoading, loadData, navigate]);

  const handleManageBilling = async () => {
    if (!account || !user) return;

    try {
      setPortalLoading(true);
      setError(null);

      const { url } = await createPortalSession(account.id, user.email, account.name);

      if (url) {
        window.location.href = url;
      } else {
        throw new Error('No portal URL returned');
      }
    } catch (err) {
      console.error('[BillingSettings] Error opening portal:', err);
      setError(err.message || 'Failed to open billing portal');
    } finally {
      setPortalLoading(false);
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
  const periodEndFormatted = billingStatus?.currentPeriodEnd ? formatTrialEnd(billingStatus.currentPeriodEnd) : null;

  // Status message based on subscription state
  const getStatusMessage = () => {
    switch (billingStatus?.status) {
      case 'trialing':
        return "You're currently in a free trial. Add a payment method to continue service after your trial ends.";
      case 'active':
        return 'Your subscription is active. Thank you for being a GreenQuote Pro user!';
      case 'past_due':
      case 'unpaid':
        return 'Payment failed. Update your payment method to avoid service interruption.';
      case 'canceled':
        return 'Your subscription has been canceled. Reactivate to continue using GreenQuote Pro.';
      case 'incomplete':
        return 'Your subscription setup is incomplete. Please complete payment to activate.';
      default:
        return 'Manage your subscription and payment settings.';
    }
  };

  // Status badge color
  const getStatusColor = () => {
    switch (billingStatus?.status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'trialing':
        return 'bg-blue-100 text-blue-800';
      case 'past_due':
      case 'unpaid':
        return 'bg-red-100 text-red-800';
      case 'canceled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => navigate('/dashboard')}
                className="text-gray-600 hover:text-gray-900"
              >
                ← Back to Dashboard
              </Button>
              <h1 className="text-2xl font-bold text-green-600">Billing Settings</h1>
            </div>
            <Button variant="ghost" onClick={signOut}>
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Current Plan Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Current Plan</CardTitle>
            <CardDescription>{getStatusMessage()}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Plan & Status */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Pro Plan</h3>
                  <p className="text-sm text-gray-500">Full access to all features</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor()}`}>
                  {statusLabel}
                </span>
              </div>

              {/* Trial Info */}
              {billingStatus?.status === 'trialing' && trialEndFormatted && (
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-800">Free Trial</p>
                      <p className="text-sm text-blue-600">
                        {billingStatus.trialDaysRemaining > 0 
                          ? `${billingStatus.trialDaysRemaining} days remaining`
                          : 'Ending today'
                        }
                      </p>
                    </div>
                    <p className="text-sm text-blue-700">Ends {trialEndFormatted}</p>
                  </div>
                </div>
              )}

              {/* Active subscription info */}
              {billingStatus?.status === 'active' && periodEndFormatted && (
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-800">Active Subscription</p>
                      <p className="text-sm text-green-600">Your subscription will renew automatically</p>
                    </div>
                    <p className="text-sm text-green-700">Next billing: {periodEndFormatted}</p>
                  </div>
                </div>
              )}

              {/* Past due warning */}
              {(billingStatus?.status === 'past_due' || billingStatus?.status === 'unpaid') && (
                <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                  <p className="text-sm font-medium text-red-800">Payment Required</p>
                  <p className="text-sm text-red-600">
                    Please update your payment method to continue using GreenQuote Pro.
                  </p>
                </div>
              )}

              {/* Canceled info */}
              {billingStatus?.status === 'canceled' && (
                <div className="p-4 bg-gray-100 rounded-lg border border-gray-200">
                  <p className="text-sm font-medium text-gray-800">Subscription Canceled</p>
                  <p className="text-sm text-gray-600">
                    Your subscription has been canceled. Reactivate to regain access.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Manage Billing Card */}
        <Card>
          <CardHeader>
            <CardTitle>Manage Billing</CardTitle>
            <CardDescription>
              Update your payment method, view invoices, or manage your subscription
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Click below to open the Stripe Customer Portal where you can:
              </p>
              <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
                <li>Update your payment method</li>
                <li>View billing history and invoices</li>
                <li>Change or cancel your subscription</li>
              </ul>
              
              <Button
                onClick={handleManageBilling}
                disabled={portalLoading || !billingStatus?.hasStripeCustomer}
                className="w-full sm:w-auto bg-green-600 hover:bg-green-700"
              >
                {portalLoading ? (
                  <span className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Opening...
                  </span>
                ) : (
                  'Manage Billing'
                )}
              </Button>

              {!billingStatus?.hasStripeCustomer && (
                <p className="text-sm text-amber-600">
                  No billing account found. Start a subscription first.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Back to Settings */}
        <div className="mt-6">
          <Button
            variant="outline"
            onClick={() => navigate('/settings')}
            className="border-green-600 text-green-600 hover:bg-green-50"
          >
            ← Back to Settings
          </Button>
        </div>
      </main>
    </div>
  );
}
