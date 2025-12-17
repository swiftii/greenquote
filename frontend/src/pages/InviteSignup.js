import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function InviteSignup() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  
  const [loading, setLoading] = useState(false);
  const [loadingInvite, setLoadingInvite] = useState(true);
  const [error, setError] = useState(null);
  const [inviteInfo, setInviteInfo] = useState(null);
  const [inviteError, setInviteError] = useState(null);
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  // Fetch invite info on mount
  useEffect(() => {
    async function fetchInviteInfo() {
      if (!token) {
        setInviteError('No invitation token provided');
        setLoadingInvite(false);
        return;
      }

      try {
        const response = await fetch(`/api/invites/info?token=${token}`);
        const data = await response.json();

        if (!response.ok) {
          setInviteError(data.error || 'Invalid invitation');
          setLoadingInvite(false);
          return;
        }

        setInviteInfo(data.invite);
        setFormData(prev => ({
          ...prev,
          email: data.invite.email || '',
        }));
      } catch (err) {
        console.error('[InviteSignup] Error fetching invite:', err);
        setInviteError('Failed to load invitation details');
      } finally {
        setLoadingInvite(false);
      }
    }

    fetchInviteInfo();
  }, [token]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    // Validate password length
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/accept-invite?token=${token}`,
          data: {
            full_name: formData.fullName,
            // Don't set business_name for invited users - they're joining an existing account
          },
        },
      });

      if (signUpError) throw signUpError;

      // Check if email confirmation is required
      if (data?.user?.identities?.length === 0) {
        setError('An account with this email already exists. Please log in instead.');
        setLoading(false);
        return;
      }

      // If email confirmation is required
      if (data?.user && !data?.session) {
        setError('Please check your email to confirm your account, then return to accept your invitation.');
        setLoading(false);
        return;
      }

      // Successful signup with auto-login - redirect to accept invite
      navigate(`/accept-invite?token=${token}`);
    } catch (err) {
      if (err.message?.includes('User already registered')) {
        setError('An account with this email already exists. Please log in to accept your invitation.');
      } else {
        setError(err.message || 'An error occurred during signup');
      }
      setLoading(false);
    }
  };

  // Loading state
  if (loadingInvite) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-green-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading invitation...</p>
        </div>
      </div>
    );
  }

  // Invalid invite state
  if (inviteError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-green-100 px-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <span className="text-3xl">⚠️</span>
            </div>
            <CardTitle>Invalid Invitation</CardTitle>
            <CardDescription>{inviteError}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Button
              onClick={() => navigate('/login')}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              Go to Login
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/signup')}
              className="w-full"
            >
              Create New Account
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-green-100 px-4 py-8">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-green-800 mb-2">
            🌱 GreenQuote Pro
          </h1>
          <h2 className="text-xl font-semibold text-gray-700">Join the Team</h2>
          {inviteInfo && (
            <div className="mt-4 p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-gray-600">
                You&apos;ve been invited to join
              </p>
              <p className="font-semibold text-green-800 text-lg">
                {inviteInfo.account_name}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                as a <span className="font-medium capitalize">{inviteInfo.role}</span>
              </p>
            </div>
          )}
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              name="fullName"
              type="text"
              placeholder="John Smith"
              value={formData.fullName}
              onChange={handleChange}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
              disabled={!!inviteInfo?.email}
              className={inviteInfo?.email ? 'bg-gray-100' : ''}
            />
            {inviteInfo?.email && (
              <p className="text-xs text-gray-500">
                This email was specified in your invitation
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              required
              minLength={6}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              placeholder="••••••••"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              minLength={6}
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3"
            disabled={loading}
          >
            {loading ? 'Creating Account...' : 'Create Account & Join Team'}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link
            to={`/login?redirect=${encodeURIComponent(`/accept-invite?token=${token}`)}`}
            className="text-green-600 hover:text-green-700 font-semibold"
          >
            Log in
          </Link>
        </div>
      </div>
    </div>
  );
}
