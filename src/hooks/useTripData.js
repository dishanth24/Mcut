import { useCallback, useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';

export function useTripData(tripId) {
  const [state, setState] = useState({
    trip: null,
    members: [],
    expenses: [],
    settlements: [],
    loading: true,
    error: null,
  });

  const load = useCallback(async () => {
    if (!tripId) return;
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const trip = await base44.entities.Trip.get(tripId).catch((e) =>
        e?.status === 404 ? null : Promise.reject(e)
      );
      if (!trip) {
        setState({ trip: null, members: [], expenses: [], settlements: [], loading: false, error: 'notfound' });
        return;
      }
      const [members, expenses, settlements] = await Promise.all([
        base44.entities.TripMember.filter({ trip_id: tripId }),
        base44.entities.Expense.filter({ trip_id: tripId }, { sort: '-expense_date', limit: 300 }),
        base44.entities.Settlement.filter({ trip_id: tripId }, { sort: '-created_date', limit: 300 }),
      ]);
      setState({
        trip,
        members,
        expenses: expenses.items || [],
        settlements: settlements.items || [],
        loading: false,
        error: null,
      });
    } catch (error) {
      console.error('useTripData load error:', error);
      setState((s) => ({ ...s, loading: false, error: error?.message || 'Something went wrong' }));
    }
  }, [tripId]);

  useEffect(() => {
    load();
  }, [load]);

  return { ...state, reload: load };
}