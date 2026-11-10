/**
 * Mcut ledger.
 *
 * Convention used everywhere: `net` is what a member is owed.
 *   net = paid - own_share + settled_out - settled_in
 * A positive net means "should receive money", negative means "should pay".
 * All amounts are integer minor units. Only confirmed settlements move balances.
 */
export const PENDING = 'pending';
export const CONFIRMED = 'confirmed';
export const REJECTED = 'rejected';
export const CANCELLED = 'cancelled';

export function computeBalances(members = [], expenses = [], settlements = []) {
  const rows = new Map();

  const ensure = (id, name) => {
    if (!id) return null;
    if (!rows.has(id)) {
      rows.set(id, {
        user_id: id,
        name: name || 'Member',
        paid: 0,
        share: 0,
        settled_out: 0,
        settled_in: 0,
      });
    }
    const row = rows.get(id);
    if (name && (!row.name || row.name === 'Member')) row.name = name;
    return row;
  };

  members.forEach((m) => ensure(m.user_id, m.user_name));

  expenses.forEach((expense) => {
    (expense.payers || []).forEach((p) => {
      const row = ensure(p.user_id, p.name);
      if (row) row.paid += Number(p.amount_minor) || 0;
    });
    (expense.shares || []).forEach((s) => {
      const row = ensure(s.user_id, s.name);
      if (row) row.share += Number(s.amount_minor) || 0;
    });
  });

  settlements
    .filter((s) => s.status === CONFIRMED)
    .forEach((s) => {
      const from = ensure(s.from_user_id, s.from_name);
      const to = ensure(s.to_user_id, s.to_name);
      const amount = Number(s.amount_minor) || 0;
      if (from) from.settled_out += amount;
      if (to) to.settled_in += amount;
    });

  return Array.from(rows.values())
    .map((r) => ({ ...r, net: r.paid - r.share + r.settled_out - r.settled_in }))
    .sort((a, b) => b.net - a.net);
}

export function totalOf(rows, key) {
  return rows.reduce((sum, r) => sum + (Number(r[key]) || 0), 0);
}

export function expenseTotal(expenses = []) {
  return expenses.reduce((sum, e) => sum + (Number(e.amount_minor) || 0), 0);
}

export function categoryTotals(expenses = []) {
  const map = new Map();
  expenses.forEach((e) => {
    const key = e.category || 'misc';
    map.set(key, (map.get(key) || 0) + (Number(e.amount_minor) || 0));
  });
  return Array.from(map.entries())
    .map(([category, amount_minor]) => ({ category, amount_minor }))
    .sort((a, b) => b.amount_minor - a.amount_minor);
}

/** Greedy debt simplification: match the largest debtor with the largest creditor. */
export function simplifyDebts(balances = []) {
  const debtors = balances
    .filter((b) => b.net < 0)
    .map((b) => ({ id: b.user_id, name: b.name, amount: -b.net }))
    .sort((a, b) => b.amount - a.amount);
  const creditors = balances
    .filter((b) => b.net > 0)
    .map((b) => ({ id: b.user_id, name: b.name, amount: b.net }))
    .sort((a, b) => b.amount - a.amount);

  const transfers = [];
  let i = 0;
  let j = 0;
  let guard = 0;
  while (i < debtors.length && j < creditors.length && guard < 1000) {
    guard += 1;
    const amount = Math.min(debtors[i].amount, creditors[j].amount);
    if (amount > 0) {
      transfers.push({
        from_id: debtors[i].id,
        from_name: debtors[i].name,
        to_id: creditors[j].id,
        to_name: creditors[j].name,
        amount_minor: amount,
      });
    }
    debtors[i].amount -= amount;
    creditors[j].amount -= amount;
    if (debtors[i].amount <= 0) i += 1;
    if (creditors[j].amount <= 0) j += 1;
  }
  return transfers;
}

/** A member's net for one trip, in minor units (positive = is owed). */
export function netFor(rows, userId) {
  const row = rows.find((r) => r.user_id === userId);
  return row ? row.net : 0;
}