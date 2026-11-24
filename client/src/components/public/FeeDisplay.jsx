import Price from './Price';
import { fmtNone } from './feeUtil';

// Tuition fee of a university as the admin entered it: single amount, range, plain text, or the lowest program fee.
// With a fee text AND an amount, both are shown (the text as a note).
export default function FeeDisplay({ u, perYear = true, className = '' }) {
  const mode = u.feeMode;
  const unit = perYear ? <span className="text-slate-500"> / year</span> : null;
  if (mode === 'text') return <span className={className}>{u.feeText}</span>;
  if (mode === 'single' && u.tuitionFee != null) return <span className={className}><Price amount={u.tuitionFee} currency={u.feeCurrency} className="font-bold text-navy-900" />{unit}{u.feeText && <span className="text-slate-500"> · {u.feeText}</span>}</span>;
  if (mode === 'range' && u.tuitionFee != null) return <span className={className}><Price amount={u.tuitionFee} max={u.tuitionFeeMax} currency={u.feeCurrency} className="font-bold text-navy-900" />{unit}{u.feeText && <span className="text-slate-500"> · {u.feeText}</span>}</span>;
  if (mode === 'none') return <span className={`text-slate-500 ${className}`}>{fmtNone}</span>;
  // Older records: use the lowest program fee.
  if (u.tuitionMin != null) {
    const prog = (u.programs || []).find((p) => p.tuitionPerYear === u.tuitionMin);
    return <span className={className}>from <Price amount={u.tuitionMin} currency={prog?.currency || 'USD'} className="font-bold text-navy-900" />{unit}</span>;
  }
  return <span className={`text-slate-500 ${className}`}>{fmtNone}</span>;
}
