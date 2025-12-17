import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export default function AcceptInvite() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  
  const [status, setStatus] = useState('loading'); // loading, ready, accepting, success, error
  const [error, setError] = useState(null);
  const [accountName, setAccountName] = useState(null);
  
  const token = searchParams.get('token');

  // Accept the invite
  const acceptInvite = useCallback(async () => {
    if (!token || !user) return;
    
    try {
      setStatus('accepting');
      setError(null);
      
      const session = await supabase.auth.getSession();
      const authToken = session.data.session?.access_token;
      
      if (!authToken) {
        throw new Error('Not authenticated');
      }
      
      const response = await fetch(`${BACKEND_URL}/api/invites/accept`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || data.details || 'Failed to accept invitation');
      }
      
      setAccountName(data.account_name);
      setStatus('success');
      
      // Redirect to dashboard after short delay
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
      
    } catch (err) {
      console.error('[AcceptInvite] Error:', err);
      setError(err.message);
      setStatus('error');
    }
  }, [token, user, navigate]);

  useEffect(() => {
    if (authLoading) return;
    
    if (!token) {
      setError('No invitation token provided');
      setStatus('error');
      return;
    }
    
    if (!user) {
      // User not logged in - redirect to login with return URL
      const returnUrl = encodeURIComponent(`/accept-invite?token=${token}`);
      navigate(`/login?redirect=${returnUrl}`);
      return;
    }
    
    // User is logged in - set status to ready
    setStatus('ready');
  }, [authLoading, user, token, navigate]);

  // Auto-accept when ready (or show button)
  useEffect(() => {
    if (status === 'ready') {
      acceptInvite();
    }
  }, [status, acceptInvite]);

  if (authLoading || status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            {status === 'success' ? (
              <span className="text-3xl">✓</span>
            ) : status === 'error' ? (
              <span className="text-3xl">✗</span>
            ) : (
              <span className="text-3xl">🌱</span>
            )}
          </div>
          <CardTitle className="text-xl">
            {status === 'success' && 'Welcome to the Team!'}
            {status === 'error' && 'Unable to Accept Invite'}
            {status === 'accepting' && 'Accepting Invitation...'}
            {status === 'ready' && 'Team Invitation'}
          </CardTitle>
          <CardDescription>
            {status === 'success' && (
              <>
                You&apos;ve successfully joined <strong>{accountName || 'the team'}</strong>.
                <br />Redirecting to dashboard...
              </>
            )}
            {status === 'accepting' && 'Please wait while we process your invitation.'}
            {status === 'ready' && 'Click below to accept your invitation.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {status === 'error' && (
            <>
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
              <div className="flex flex-col gap-3">
                <Button
                  onClick={() => navigate('/login')}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  Go to Login
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate('/dashboard')}
                  className="w-full"
                >
                  Go to Dashboard
                </Button>
              </div>
            </>
          )}
          
          {status === 'accepting' && (
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            </div>
          )}
          
          {status === 'success' && (
            <div className="text-center">
              <div className="animate-pulse text-green-600 font-medium">
                Redirecting to dashboard...
              </div>
              <Link
                to="/dashboard"
                className="text-sm text-gray-500 hover:text-gray-700 mt-4 block"
              >
                Click here if not redirected
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
