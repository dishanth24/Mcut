import { useMemo, useState } from 'react';
import { Search, Receipt } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CATEGORIES } from '@/lib/categories';
import ExpenseCard from '@/components/expenses/ExpenseCard';
import EmptyState from '@/components/common/EmptyState';

export default function ExpenseList({ expenses, members, currentUserId, onOpen, emptyAction }) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [memberId, setMemberId] = useState('all');
  const [sort, setSort] = useState('date');

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    const rows = expenses.filter((e) => {
      if (category !== 'all' && e.category !== category) return false;
      if (memberId !== 'all') {
        const inPayers = (e.payers || []).some((p) => p.user_id === memberId);
        const inShares = (e.shares || []).some((s) => s.user_id === memberId);
        if (!inPayers && !inShares) return false;
      }
      if (!term) return true;
      return `${e.title} ${e.merchant || ''} ${e.notes || ''}`.toLowerCase().includes(term);
    });
    return rows.sort((a, b) => {
      if (sort === 'amount') return (b.amount_minor || 0) - (a.amount_minor || 0);
      return String(b.expense_date || '').localeCompare(String(a.expense_date || ''));
    });
  }, [expenses, query, category, memberId, sort]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search expenses"
            className="pl-9"
            aria-label="Search expenses"
          />
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="sm:w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {CATEGORIES.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={memberId} onValueChange={setMemberId}>
          <SelectTrigger className="sm:w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Everyone</SelectItem>
            {members.map((m) => (
              <SelectItem key={m.user_id} value={m.user_id}>
                {m.user_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sort} onValueChange={setSort}>
          <SelectTrigger className="sm:w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date">Newest first</SelectItem>
            <SelectItem value="amount">Largest first</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          Icon={Receipt}
          title={expenses.length === 0 ? 'No expenses yet' : 'Nothing matches those filters'}
          description={
            expenses.length === 0
              ? 'Add the first shared cost and Mcut keeps the maths straight for everyone.'
              : 'Try a different category, person or search term.'
          }
          action={expenses.length === 0 ? emptyAction : null}
        />
      ) : (
        <div className="space-y-2">
          {filtered.map((expense) => (
            <ExpenseCard key={expense.id} expense={expense} memberId={currentUserId} onOpen={onOpen} />
          ))}
        </div>
      )}
    </div>
  );
}