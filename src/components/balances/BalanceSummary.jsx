import StatCard from '@/components/common/StatCard';
import Amount from '@/components/common/Amount';
import { ArrowDownLeft, ArrowUpRight, Scale } from 'lucide-react';

export default function BalanceSummary({ youOwe, owedToYou, net, currency }) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <StatCard
        label="You owe"
        value={<Amount value={youOwe || 0} currency={currency} tone={youOwe ? 'negative' : 'muted'} />}
        Icon={ArrowUpRight}
        hint="Across confirmed expenses and settlements"
      />
      <StatCard
        label="Owed to you"
        value={<Amount value={owedToYou || 0} currency={currency} tone={owedToYou ? 'positive' : 'muted'} />}
        Icon={ArrowDownLeft}
        hint="Money trip mates still owe you"
      />
      <StatCard
        label="Net balance"
        value={<Amount value={net || 0} currency={currency} tone={net > 0 ? 'positive' : net < 0 ? 'negative' : 'muted'} signed />}
        Icon={Scale}
        hint={net > 0 ? 'You should receive money' : net < 0 ? 'You should pay money' : 'All square'}
      />
    </div>
  );
}