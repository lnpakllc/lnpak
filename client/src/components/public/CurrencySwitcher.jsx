import { useCurrency } from '../../context/CurrencyContext';

// Lets visitors view prices in another currency. Hidden when the admin has enabled only one currency.
export default function CurrencySwitcher({ className = '' }) {
  const { enabled, current, select, canSwitch } = useCurrency();
  if (!canSwitch) return null;
  return (
    <label className={`inline-flex items-center ${className}`}>
      <span className="sr-only">Currency</span>
      <select value={current} onChange={(e) => select(e.target.value)} className="rounded-full border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-navy-900">
        {enabled.map((c) => <option key={c} value={c}>{c}</option>)}
      </select>
    </label>
  );
}
