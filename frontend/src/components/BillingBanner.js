import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { ensureUserAccount } from '@/services/accountService';
import { getBillingStatus, createPortalSession } from '@/services/billingService';
import { Button } from '@/components/ui/button';

/**
 * BillingBanner - Displays trial countdown and billing state warnings
 * 
 * Shows different banners based on subscription status:
 * - Trialing: "Free trial ends in X days" with manage billing CTA
 * - Past due/Unpaid: Warning with manage billing CTA
 * - Canceled: Reactivation prompt with manage billing CTA
 */
export default function BillingBanner() {
  const { user } = useAuth();
  const [account, setAccount] = useState(null);
  const [billingStatus, setBillingStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);

  const loadBillingData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const result = await ensureUserAccount(user);
      setAccount(result?.account);

      if (result?.account?.id) {
        const status = await getBillingStatus(result.account.id);
        setBillingStatus(status);
      }
    } catch (err) {
      console.error('[BillingBanner] Error loading billing data:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadBillingData();
  }, [loadBillingData]);

  const handleManageBilling = async () => {
    if (!account) return;

    try {
      setPortalLoading(true);
      const { url } = await createPortalSession(account.id);
      if (url) {
        window.location.href = url;
      }
    } catch (err) {
      console.error('[BillingBanner] Error opening portal:', err);
    } finally {
      setPortalLoading(false);
    }
  };

  // Don't show anything while loading or if no billing data
  if (loading || !billingStatus) {
    return null;
  }

  const { status, trialEnd, trialDaysRemaining } = billingStatus;

  // Format trial end date
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Trial banner
  if (status === 'trialing' && trialEnd) {
    const daysText = trialDaysRemaining === 1 ? 'day' : 'days';
    const endDate = formatDate(trialEnd);

    return (
      <div className="bg-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center">
              <span className="flex p-2 rounded-lg bg-blue-800">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </span>
              <p className="ml-3 text-sm font-medium">
                {trialDaysRemaining > 0 ? (
                  <>Free trial ends in <strong>{trialDaysRemaining} {daysText}</strong> (on {endDate})</>
                ) : (
                  <>Your free trial ends <strong>today</strong></>
                )}
              </p>
            </div>
            <Button
              onClick={handleManageBilling}
              disabled={portalLoading}
              variant="secondary"
              size="sm"
              className="bg-white text-blue-600 hover:bg-blue-50"
            >
              {portalLoading ? 'Loading...' : 'Add Payment Method'}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Past due / Unpaid banner
  if (status === 'past_due' || status === 'unpaid') {
    return (
      <div className="bg-red-600 text-white">
        <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center">
              <span className="flex p-2 rounded-lg bg-red-800">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </span>
              <p className="ml-3 text-sm font-medium">
                <strong>Payment issue detected.</strong> Update your payment method to keep access.
              </p>
            </div>
            <Button
              onClick={handleManageBilling}
              disabled={portalLoading}
              variant="secondary"
              size="sm"
              className="bg-white text-red-600 hover:bg-red-50"
            >
              {portalLoading ? 'Loading...' : 'Update Payment Method'}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Canceled banner
  if (status === 'canceled') {
    return (
      <div className="bg-gray-700 text-white">
        <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center">
              <span className="flex p-2 rounded-lg bg-gray-800">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
              </span>
              <p className="ml-3 text-sm font-medium">
                Your subscription is <strong>canceled</strong>. Reactivate to continue using GreenQuote.
              </p>
            </div>
            <Button
              onClick={handleManageBilling}
              disabled={portalLoading}
              variant="secondary"
              size="sm"
              className="bg-white text-gray-700 hover:bg-gray-100"
            >
              {portalLoading ? 'Loading...' : 'Reactivate Subscription'}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Active subscription - no banner needed (or could show a subtle "Pro" badge)
  return null;
}
