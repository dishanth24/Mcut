import { useCallback, useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';

/** Everything the signed-in user can see: their trips, expenses and settlements. */
export function useLedger() {
  const [state, setState] = useState({
    trips: [],
    expenses: [],
    settlements: [],
    members: [],
    loading: true,
    error: null,
  });

  const load = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const [trips, expenses, settlements, members] = await Promise.all([
        base44.entities.Trip.list({ sort: '-updated_date', limit: 100 }),
        base44.entities.Expense.list({ sort: '-expense_date', limit: 500 }),
        base44.entities.Settlement.list({ sort: '-created_date', limit: 300 }),
        base44.entities.TripMember.list({ limit: 300 }),
      ]);
      setState({
        trips: trips.items || [],
        expenses: expenses.items || [],
        settlements: settlements.items || [],
        members: members.items || [],
        loading: false,
        error: null,
      });
    } catch (error) {
      console.error('useLedger load error:', error);
      setState((s) => ({ ...s, loading: false, error: error?.message || 'Something went wrong' }));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { ...state, reload: load };
}