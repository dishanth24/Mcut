import { useMemo, useState } from 'react';
import { Search, Receipt } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { CATEGORIES } from '@/lib/categories';
import { formatMoney } from '@/lib/money';
import ExpenseCard from '@/components/expenses/ExpenseCard';
import EmptyState from '@/components/common/EmptyState';

function formatGroupLabel(dateStr) {
  if (!dateStr) return 'Unknown date';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(dateStr + 'T00:00:00');
  const diff = Math.round((today - d) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function ExpenseList({ expenses, members, currentUserId, onOpen, emptyAction }) {
  const shouldReduce = useReducedMotion();
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

  // Group by date
  const groups = useMemo(() => {
    const map = new Map();
    for (const e of filtered) {
      const key = e.expense_date || '';
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(e);
    }
    return Array.from(map.entries()).map(([date, items]) => ({ date, items }));
  }, [filtered]);

  const totalSum = filtered.reduce((s, e) => s + (e.amount_minor || 0), 0);
  const currency = filtered[0]?.currency || 'INR';

  const container = shouldReduce ? {} : { visible: { transition: { staggerChildren: 0.04 } } };
  const item = shouldReduce
    ? {}
    : { hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } };

  return (
    <div className="space-y-4">
      {/* Search bar */}
      <div className="relative glass-card rounded-xl">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search expenses"
          className="h-11 rounded-xl pl-10 bg-transparent border-white/10"
          aria-label="Search expenses"
        />
      </div>

      {/* Filter chips */}
      <div className="space-y-2">
        {/* Category chips */}
        <div className="overflow-x-auto no-scrollbar flex gap-2 pb-1">
          <button
            type="button"
            onClick={() => setCategory('all')}
            className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium border transition-all ${
              category === 'all'
                ? 'bg-brand-orange text-white border-brand-orange'
                : 'card-surface inner-border text-muted-foreground hover:text-foreground'
            }`}
          >
            All
          </button>
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCategory(c.id)}
              className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium border transition-all ${
                category === c.id
                  ? 'bg-brand-orange text-white border-brand-orange'
                  : 'card-surface inner-border text-muted-foreground hover:text-foreground'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Member + sort chips row */}
        <div className="overflow-x-auto no-scrollbar flex gap-2 pb-1">
          <button
            type="button"
            onClick={() => setMemberId('all')}
            className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium border transition-all ${
              memberId === 'all'
                ? 'bg-brand-teal/20 text-brand-teal border-brand-teal/40'
                : 'card-surface inner-border text-muted-foreground hover:text-foreground'
            }`}
          >
            Everyone
          </button>
          {members.map((m) => (
            <button
              key={m.user_id}
              type="button"
              onClick={() => setMemberId(m.user_id)}
              className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium border transition-all ${
                memberId === m.user_id
                  ? 'bg-brand-teal/20 text-brand-teal border-brand-teal/40'
                  : 'card-surface inner-border text-muted-foreground hover:text-foreground'
              }`}
            >
              {m.user_name}
            </button>
          ))}

          <span className="shrink-0 w-px bg-border/60 mx-1" />

          {[
            { value: 'date', label: 'Newest' },
            { value: 'amount', label: 'Largest' },
          ].map((s) => (
            <button
              key={s.value}
              type="button"
              onClick={() => setSort(s.value)}
              className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium border transition-all ${
                sort === s.value
                  ? 'bg-secondary text-foreground border-border'
                  : 'card-surface inner-border text-muted-foreground hover:text-foreground'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
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
        <div className="space-y-4">
          {groups.map(({ date, items }) => (
            <div key={date}>
              {/* Sticky date header */}
              <div className="sticky top-0 z-10 py-1.5">
                <span className="inline-flex items-center rounded-full bg-background/80 backdrop-blur-sm border border-border/50 px-3 py-0.5 text-[0.65rem] font-medium text-muted-foreground">
                  {formatGroupLabel(date)}
                </span>
              </div>

              {/* Stagger container */}
              <motion.div
                variants={container}
                initial="hidden"
                animate="visible"
                className="space-y-2 mt-1"
              >
                {items.map((e, i) => (
                  <motion.div
                    key={e.id}
                    variants={item}
                    custom={i}
                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <ExpenseCard expense={e} memberId={currentUserId} onOpen={onOpen} />
                  </motion.div>
                ))}
              </motion.div>
            </div>
          ))}

          {/* Total chip */}
          <div className="flex justify-center pt-1">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary/60 border border-border/50 px-3 py-1 text-xs text-muted-foreground">
              {filtered.length} expense{filtered.length === 1 ? '' : 's'} ·{' '}
              <span className="num font-medium text-foreground">
                {formatMoney(totalSum, currency)}
              </span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
