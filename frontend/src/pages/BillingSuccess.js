import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { ensureUserAccount } from '@/services/accountService';
import { getBillingStatus } from '@/services/billingService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function BillingSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const [status, setStatus] = useState('loading'); // loading, success, error
  const [billingStatus, setBillingStatus] = useState(null);

  const sessionId = searchParams.get('session_id');

  const checkStatus = useCallback(async () => {
    if (!user) return;

    try {
      // Load account
      const result = await ensureUserAccount(user);
      
      if (result?.account?.id) {
        // Poll for updated billing status
        // Webhook may take a moment to process
        let attempts = 0;
        const maxAttempts = 5;
        const pollInterval = 2000; // 2 seconds

        const poll = async () => {
          const billing = await getBillingStatus(result.account.id);
          setBillingStatus(billing);

          if (billing.hasAccess || billing.status === 'active') {
            setStatus('success');
            return;
          }

          attempts++;
          if (attempts < maxAttempts) {
            setTimeout(poll, pollInterval);
          } else {
            // Still show success - webhook might be delayed
            setStatus('success');
          }
        };

        await poll();
      }
    } catch (err) {
      console.error('[BillingSuccess] Error:', err);
      setStatus('error');
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading && user) {
      checkStatus();
    } else if (!authLoading && !user) {
      navigate('/login');
    }
  }, [user, authLoading, checkStatus, navigate]);

  if (authLoading || status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mb-4"></div>
        <p className="text-gray-600">Confirming your subscription...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          {status === 'success' ? (
            <>
              <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
                <svg
                  className="h-8 w-8 text-green-600"
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
              </div>
              <CardTitle className="text-2xl text-green-600">Payment Successful!</CardTitle>
              <CardDescription>
                Your subscription to GreenQuote Pro is now active.
              </CardDescription>
            </>
          ) : (
            <>
              <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-red-100 flex items-center justify-center">
                <svg
                  className="h-8 w-8 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
              <CardTitle className="text-2xl text-red-600">Something went wrong</CardTitle>
              <CardDescription>
                We couldn't confirm your subscription. Please contact support.
              </CardDescription>
            </>
          )}
        </CardHeader>
        <CardContent className="text-center">
          {status === 'success' && billingStatus && (
            <p className="text-gray-600 mb-6">
              You now have full access to all Pro features.
            </p>
          )}
          
          <Button
            onClick={() => navigate('/dashboard')}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            Go to Dashboard
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
