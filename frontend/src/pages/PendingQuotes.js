import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { ensureUserAccount } from '@/services/accountService';
import { getQuotesByStatus, updateQuoteStatus } from '@/services/quoteService';
import { createClientFromQuote } from '@/services/clientService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

/**
 * Pending Quotes Page
 * Route: /quotes/pending
 * 
 * Lists all quotes in 'pending' status for the account
 * Allows marking quotes as Closed Won or Closed Lost
 */

const FREQUENCY_LABELS = {
  one_time: 'One-Time',
  weekly: 'Weekly',
  bi_weekly: 'Bi-Weekly',
  monthly: 'Monthly',
};

export default function PendingQuotes() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [account, setAccount] = useState(null);
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [actionLoading, setActionLoading] = useState(null); // ID of quote being actioned

  // Sorting state
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');

  const loadData = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const result = await ensureUserAccount(user);
      setAccount(result?.account);

      if (result?.account?.id) {
        const pendingQuotes = await getQuotesByStatus(result.account.id, 'pending', {
          sortBy,
          sortOrder,
        });
        setQuotes(pendingQuotes);
      }
    } catch (err) {
      console.error('[PendingQuotes] Error loading data:', err);
      setError(err.message || 'Failed to load quotes');
    } finally {
      setLoading(false);
    }
  }, [user, sortBy, sortOrder]);

  useEffect(() => {
    if (!authLoading && user) {
      loadData();
    } else if (!authLoading && !user) {
      navigate('/login');
    }
  }, [user, authLoading, loadData, navigate]);

  const handleClosedWon = async (quote) => {
    try {
      setActionLoading(quote.id);
      setError(null);

      // Update quote status to won
      await updateQuoteStatus(quote.id, 'won');

      // Create client from quote
      await createClientFromQuote({
        accountId: account.id,
        quoteId: quote.id,
        customerName: quote.customer_name,
        customerEmail: quote.customer_email,
        customerPhone: quote.customer_phone,
        propertyAddress: quote.property_address,
        propertyType: quote.property_type,
        areaSqFt: quote.area_sq_ft,
        services: quote.services || { addons: quote.addons },
        frequency: quote.frequency,
        pricePerVisit: quote.total_price_per_visit,
        estimatedMonthlyRevenue: quote.monthly_estimate,
      });

      // Remove from list
      setQuotes(prev => prev.filter(q => q.id !== quote.id));
      setSuccess('Quote closed as Won! Client created.');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('[PendingQuotes] Error closing won:', err);
      setError(err.message || 'Failed to close quote');
    } finally {
      setActionLoading(null);
    }
  };

  const handleClosedLost = async (quote) => {
    try {
      setActionLoading(quote.id);
      setError(null);

      // Update quote status to lost
      await updateQuoteStatus(quote.id, 'lost');

      // Remove from list
      setQuotes(prev => prev.filter(q => q.id !== quote.id));
      setSuccess('Quote marked as Lost.');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('[PendingQuotes] Error closing lost:', err);
      setError(err.message || 'Failed to close quote');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSortChange = (value) => {
    const [field, order] = value.split('-');
    setSortBy(field);
    setSortOrder(order);
  };

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
              <h1 className="text-2xl font-bold text-green-600">Pending Quotes</h1>
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

        {success && (
          <Alert className="mb-6 bg-green-50 text-green-800 border-green-200">
            <AlertDescription>✅ {success}</AlertDescription>
          </Alert>
        )}

        {/* Sorting Controls */}
        <div className="flex justify-between items-center mb-6">
          <p className="text-gray-600">
            {quotes.length} pending quote{quotes.length !== 1 ? 's' : ''}
          </p>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Sort by:</span>
            <Select
              value={`${sortBy}-${sortOrder}`}
              onValueChange={handleSortChange}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created_at-desc">Newest First</SelectItem>
                <SelectItem value="created_at-asc">Oldest First</SelectItem>
                <SelectItem value="property_address-asc">Address A-Z</SelectItem>
                <SelectItem value="property_address-desc">Address Z-A</SelectItem>
                <SelectItem value="monthly_estimate-desc">Revenue High-Low</SelectItem>
                <SelectItem value="monthly_estimate-asc">Revenue Low-High</SelectItem>
                <SelectItem value="frequency-asc">Frequency</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Quotes List */}
        {quotes.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-gray-500 mb-4">No pending quotes</p>
              <Button
                onClick={() => navigate('/quote')}
                className="bg-green-600 hover:bg-green-700"
              >
                Create Your First Quote
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {quotes.map((quote) => (
              <Card key={quote.id} className="hover:shadow-md transition-shadow">
                <CardContent className="py-4">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    {/* Quote Info */}
                    <div className="flex-1 space-y-1">
                      <div className="flex items-start gap-2">
                        <span className="text-lg">📍</span>
                        <div>
                          <p className="font-medium text-gray-900">
                            {quote.property_address || 'No address'}
                          </p>
                          {quote.customer_name && (
                            <p className="text-sm text-gray-600">{quote.customer_name}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-3 text-sm text-gray-500 ml-7">
                        <span>{FREQUENCY_LABELS[quote.frequency] || quote.frequency}</span>
                        <span>•</span>
                        <span className="font-medium text-green-600">
                          ${parseFloat(quote.monthly_estimate || 0).toFixed(0)}/mo
                        </span>
                        <span>•</span>
                        <span>
                          {new Date(quote.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 ml-7 md:ml-0">
                      <Button
                        onClick={() => handleClosedWon(quote)}
                        disabled={actionLoading === quote.id}
                        className="bg-green-600 hover:bg-green-700"
                        size="sm"
                      >
                        {actionLoading === quote.id ? '...' : '✓ Won'}
                      </Button>
                      <Button
                        onClick={() => handleClosedLost(quote)}
                        disabled={actionLoading === quote.id}
                        variant="outline"
                        size="sm"
                        className="text-red-600 border-red-300 hover:bg-red-50"
                      >
                        {actionLoading === quote.id ? '...' : '✗ Lost'}
                      </Button>
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
