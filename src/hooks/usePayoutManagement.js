import { useState, useCallback, useEffect } from 'react';

export function usePayoutManagement() {
  const [payouts, setPayouts] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    total_pages: 0
  });

  // Fetch payouts
  const fetchPayouts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/admin/payouts?page=${pagination.page}&limit=${pagination.limit}`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch payouts');
      }

      setPayouts(data.payouts || []);
      setPagination(prev => ({
        ...prev,
        total: data.total || 0,
        total_pages: data.total_pages || 0
      }));
    } catch (err) {
      setError(err.message);
      console.error('Error fetching payouts:', err);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit]);

  // Update payout status
  const updatePayoutStatus = useCallback(async (id, status, notes) => {
    try {
      const response = await fetch(`/api/admin/payouts`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, status, notes }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update payout status');
      }

      // Update local state
      setPayouts(current =>
        current.map(payout =>
          payout.id === id ? { ...payout, status, admin_notes: notes } : payout
        )
      );

      return true;
    } catch (err) {
      console.error('Error updating payout status:', err);
      throw err;
    }
  }, []);

  // Fetch payout statistics
  const fetchStatistics = useCallback(async (dateRange = {}) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/admin/payouts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dateRange),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch statistics');
      }

      setStatistics(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Change page
  const changePage = useCallback((newPage) => {
    setPagination(prev => ({
      ...prev,
      page: newPage
    }));
  }, []);

  // Change limit
  const changeLimit = useCallback((newLimit) => {
    setPagination(prev => ({
      ...prev,
      limit: newLimit,
      page: 1 // Reset to first page when changing limit
    }));
  }, []);

  // Fetch payouts on mount and when pagination changes
  useEffect(() => {
    fetchPayouts();
  }, [fetchPayouts]);

  return {
    payouts,
    statistics,
    loading,
    error,
    pagination,
    updatePayoutStatus,
    fetchStatistics,
    changePage,
    changeLimit,
    refetch: fetchPayouts
  };
} 