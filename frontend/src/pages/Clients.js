import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { ensureUserAccount } from '@/services/accountService';
import { getClients, getTotalMonthlyRevenue } from '@/services/clientService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

/**
 * Clients Page
 * Route: /clients
 * 
 * Lists all active clients for the account (from won quotes)
 */

const FREQUENCY_LABELS = {
  one_time: 'One-Time',
  weekly: 'Weekly',
  bi_weekly: 'Bi-Weekly',
  monthly: 'Monthly',
};

export default function Clients() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [account, setAccount] = useState(null);
  const [clients, setClients] = useState([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const result = await ensureUserAccount(user);
      setAccount(result?.account);

      if (result?.account?.id) {
        const [clientsList, revenue] = await Promise.all([
          getClients(result.account.id),
          getTotalMonthlyRevenue(result.account.id),
        ]);
        setClients(clientsList);
        setTotalRevenue(revenue);
      }
    } catch (err) {
      console.error('[Clients] Error loading data:', err);
      setError(err.message || 'Failed to load clients');
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

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => navigate('/dashboard')}
                className="text-gray-600 hover:text-gray-900"
              >
                ← Back
              </Button>
              <h1 className="text-2xl font-bold text-green-600">Active Clients</h1>
            </div>
            <Button
              onClick={() => navigate('/quote')}
              className="bg-green-600 hover:bg-green-700"
            >
              + New Quote
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-gray-600">Total Clients</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-600">{clients.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-gray-600">Monthly Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-600">
                ${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Clients List */}
        {clients.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-gray-500 mb-4">No clients yet</p>
              <p className="text-sm text-gray-400 mb-4">
                Close quotes as &quot;Won&quot; to create clients
              </p>
              <div className="flex gap-2 justify-center">
                <Button
                  onClick={() => navigate('/quotes/pending')}
                  variant="outline"
                  className="border-green-600 text-green-600 hover:bg-green-50"
                >
                  View Pending Quotes
                </Button>
                <Button
                  onClick={() => navigate('/quote')}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Create Quote
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {clients.map((client) => (
              <Card key={client.id} className="hover:shadow-md transition-shadow border-l-4 border-l-green-500">
                <CardContent className="py-4">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    {/* Client Info */}
                    <div className="flex-1 space-y-1">
                      <div className="flex items-start gap-2">
                        <span className="text-lg">🏠</span>
                        <div>
                          <p className="font-medium text-gray-900">
                            {client.property_address}
                          </p>
                          {client.customer_name && (
                            <p className="text-sm text-gray-600">{client.customer_name}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-3 text-sm text-gray-500 ml-7">
                        <span>{FREQUENCY_LABELS[client.frequency] || client.frequency || 'N/A'}</span>
                        <span>•</span>
                        <span>${parseFloat(client.price_per_visit || 0).toFixed(0)}/visit</span>
                        <span>•</span>
                        <span className="font-medium text-green-600">
                          ${parseFloat(client.estimated_monthly_revenue || 0).toFixed(0)}/mo
                        </span>
                      </div>
                      
                      {/* Services Tags */}
                      {client.services?.addons && client.services.addons.length > 0 && (
                        <div className="flex flex-wrap gap-1 ml-7 mt-2">
                          {client.services.addons.map((addon, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-green-100 text-green-700"
                            >
                              {addon.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Contact Info */}
                    <div className="text-sm text-gray-500 ml-7 md:ml-0 md:text-right">
                      {client.customer_email && (
                        <p>{client.customer_email}</p>
                      )}
                      {client.customer_phone && (
                        <p>{client.customer_phone}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        Since {new Date(client.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
