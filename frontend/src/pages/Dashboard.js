import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error.message);
    }
  };

  if (loading) {
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
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-green-800">
              🌱 GreenQuote Pro
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back{user?.user_metadata?.full_name ? `, ${user.user_metadata.full_name}` : ''}!
          </h2>
          <p className="text-gray-600">
            {user?.user_metadata?.business_name 
              ? `Managing ${user.user_metadata.business_name}` 
              : 'Ready to manage your lawn care business'}
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Active Clients</CardTitle>
              <CardDescription>Total clients in your database</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-green-600">0</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quotes This Month</CardTitle>
              <CardDescription>Generated this billing period</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-green-600">0</p>
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
              <Button className="h-auto py-6 flex flex-col items-start bg-green-600 hover:bg-green-700">
                <span className="text-lg font-semibold mb-1">Create New Quote</span>
                <span className="text-sm opacity-90">Generate a quote for a customer</span>
              </Button>
              <Button variant="outline" className="h-auto py-6 flex flex-col items-start border-green-600 text-green-600 hover:bg-green-50">
                <span className="text-lg font-semibold mb-1">Manage Clients</span>
                <span className="text-sm opacity-90">View and edit client configurations</span>
              </Button>
              <Button variant="outline" className="h-auto py-6 flex flex-col items-start border-green-600 text-green-600 hover:bg-green-50">
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
