import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { ensureUserAccount } from '@/services/accountService';
import { getBillingStatus, startTrial } from '@/services/billingService';

/**
 * SubscriptionGuard - Protects routes based on subscription status
 * 
 * Checks if user has active subscription or trial, redirects to /billing if not.
 * Also handles starting trial for new users.
 */
export default function SubscriptionGuard({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading: authLoading } = useAuth();
  const [checking, setChecking] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  const checkAccess = useCallback(async () => {
    if (!user) {
      setChecking(false);
      return;
    }

    try {
      console.log('[SubscriptionGuard] Checking access for user:', user.id);
      
      // Load account
      const result = await ensureUserAccount(user);
      const account = result?.account;

      if (!account?.id) {
        console.log('[SubscriptionGuard] No account found');
        navigate('/billing');
        return;
      }

      // Get billing status
      let billingStatus = await getBillingStatus(account.id);
      console.log('[SubscriptionGuard] Billing status:', billingStatus);

      // If no subscription exists yet, start trial automatically
      if (!billingStatus.hasSubscription && billingStatus.status === 'none') {
        console.log('[SubscriptionGuard] No subscription, starting trial...');
        try {
          await startTrial({
            accountId: account.id,
            userId: user.id,
            userEmail: user.email,
            accountName: account.name,
          });
          // Re-fetch billing status after trial creation
          billingStatus = await getBillingStatus(account.id);
          console.log('[SubscriptionGuard] Trial started, new status:', billingStatus);
        } catch (trialError) {
          console.error('[SubscriptionGuard] Error starting trial:', trialError);
          // Continue checking - maybe billing API isn't configured
        }
      }

      // Check access
      if (billingStatus.hasAccess) {
        console.log('[SubscriptionGuard] Access granted');
        setHasAccess(true);
      } else {
        console.log('[SubscriptionGuard] Access denied, redirecting to billing');
        navigate('/billing', { state: { from: location.pathname } });
      }
    } catch (error) {
      console.error('[SubscriptionGuard] Error checking access:', error);
      // On error, allow access (fail open for better UX)
      // This handles cases where billing API isn't configured
      setHasAccess(true);
    } finally {
      setChecking(false);
    }
  }, [user, navigate, location.pathname]);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        // Not logged in - redirect to login
        navigate('/login', { state: { from: location.pathname } });
      } else {
        checkAccess();
      }
    }
  }, [user, authLoading, checkAccess, navigate, location.pathname]);

  // Show loading while checking
  if (authLoading || checking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return null;
  }

  // Access granted
  if (hasAccess) {
    return children;
  }

  // Access denied (will redirect)
  return null;
}
