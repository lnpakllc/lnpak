import { useCurrency } from '../../context/CurrencyContext';

// A price in the visitor's chosen currency. `amount`/`currency` are as stored by the admin; pass `max` for a range.
export default function Price({ amount, max, currency = 'USD', className = '' }) {
  const { fmt } = useCurrency();
  if (amount == null) return null;
  const a = fmt(amount, currency);
  return <span className={className}>{max != null && max !== amount ? `${a} – ${fmt(max, currency)}` : a}</span>;
}
