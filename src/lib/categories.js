import {
  UtensilsCrossed,
  BedDouble,
  Bus,
  Plane,
  Fuel,
  ShoppingBag,
  Ticket,
  ShoppingBasket,
  Popcorn,
  Stethoscope,
  Wallet,
} from 'lucide-react';

export const CATEGORIES = [
  { id: 'food', label: 'Food & Drinks', Icon: UtensilsCrossed },
  { id: 'stay', label: 'Accommodation', Icon: BedDouble },
  { id: 'transport', label: 'Transport', Icon: Bus },
  { id: 'flights', label: 'Flights', Icon: Plane },
  { id: 'fuel', label: 'Fuel', Icon: Fuel },
  { id: 'shopping', label: 'Shopping', Icon: ShoppingBag },
  { id: 'activities', label: 'Activities', Icon: Ticket },
  { id: 'groceries', label: 'Groceries', Icon: ShoppingBasket },
  { id: 'entertainment', label: 'Entertainment', Icon: Popcorn },
  { id: 'medical', label: 'Medical', Icon: Stethoscope },
  { id: 'misc', label: 'Miscellaneous', Icon: Wallet },
];

const MAP = new Map(CATEGORIES.map((c) => [c.id, c]));

export function categoryOf(id) {
  return MAP.get(id) || MAP.get('misc');
}