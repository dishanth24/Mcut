import { motion, useReducedMotion } from 'framer-motion';
import { formatDate } from '@/lib/trips';
import { formatMoney } from '@/lib/money';
import { categoryOf } from '@/lib/categories';

const CAT_COLORS = {
  food: 'bg-[#D98264]/20 text-[#D98264]',
  stay: 'bg-[#2DD4BF]/20 text-[#2DD4BF]',
  transport: 'bg-[#8B5CF6]/20 text-[#8B5CF6]',
  flights: 'bg-[#3B82F6]/20 text-[#3B82F6]',
  fuel: 'bg-[#F59E0B]/20 text-[#F59E0B]',
  shopping: 'bg-[#EC4899]/20 text-[#EC4899]',
  activities: 'bg-[#10B981]/20 text-[#10B981]',
  groceries: 'bg-[#84CC16]/20 text-[#84CC16]',
  entertainment: 'bg-[#F97316]/20 text-[#F97316]',
  medical: 'bg-[#EF4444]/20 text-[#EF4444]',
  misc: 'bg-secondary text-muted-foreground',
};

const CAT_BORDER = {
  food: '#D98264',
  stay: '#2DD4BF',
  transport: '#8B5CF6',
  flights: '#3B82F6',
  fuel: '#F59E0B',
  shopping: '#EC4899',
  activities: '#10B981',
  groceries: '#84CC16',
  entertainment: '#F97316',
  medical: '#EF4444',
  misc: 'transparent',
};

export default function ExpenseCard({ expense, memberId, onOpen }) {
  const shouldReduce = useReducedMotion();
  const cat = categoryOf(expense.category);
  const mine = (expense.shares || []).find((s) => s.user_id === memberId)?.amount_minor || 0;
  const payerNames = (expense.payers || []).map((p) => p.name).filter(Boolean).join(' & ');
  const colorClass = CAT_COLORS[expense.category] || CAT_COLORS.misc;
  const borderColor = CAT_BORDER[expense.category] || 'transparent';

  return (
    <motion.div
      onClick={() => onOpen?.(expense)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onOpen?.(expense); }}
      whileHover={shouldReduce ? {} : { y: -2 }}
      whileTap={shouldReduce ? {} : { scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className="card-surface inner-border rounded-2xl px-4 py-3 flex items-center gap-3 cursor-pointer min-h-[56px]"
      style={{ borderLeft: `3px solid ${borderColor}` }}
    >
      {/* Category icon badge */}
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${colorClass}`}
      >
        <cat.Icon className="h-5 w-5" strokeWidth={1.75} />
      </span>

      {/* Middle: title + meta */}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">{expense.title}</span>
        <span className="mt-0.5 block truncate text-xs text-muted-foreground">
          {cat.label} · {formatDate(expense.expense_date)}
          {payerNames ? ` · ${payerNames} paid` : ''}
        </span>
      </span>

      {/* Right: total + share */}
      <span className="shrink-0 text-right">
        <span className="num block text-sm font-semibold">
          {formatMoney(expense.amount_minor, expense.currency)}
        </span>
        <span className="mt-0.5 block text-[0.65rem] text-muted-foreground">
          {mine ? `your share ${formatMoney(mine, expense.currency)}` : 'not involved'}
        </span>
      </span>
    </motion.div>
  );
}
