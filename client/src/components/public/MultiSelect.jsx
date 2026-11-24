import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Check } from 'lucide-react';

// Dropdown with checkboxes. Nothing ticked = "All". `value` is an array of the chosen option values.
export default function MultiSelect({ label, options, value = [], onChange, allLabel = 'All' }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);
  const opts = options.map((o) => (Array.isArray(o) ? o : typeof o === 'object' ? [o.value, o.label] : [o, o]));
  const toggle = (v) => onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);
  const summary = !value.length ? allLabel : value.length <= 2 ? value.map((v) => opts.find(([k]) => k === v)?.[1] || v).join(', ') : `${value.length} selected`;
  return (
    <div className="relative" ref={ref}>
      <span className="label">{label}</span>
      <button type="button" className="input flex items-center justify-between text-left" aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen((o) => !o)} onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}>
        <span className="truncate">{summary}</span><ChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute z-30 mt-1 max-h-64 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white p-1 shadow-lift" role="listbox" aria-multiselectable="true">
          <button type="button" role="option" aria-selected={!value.length} onClick={() => onChange([])} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-semibold hover:bg-navy-50">
            <span className={`flex h-4 w-4 items-center justify-center rounded border ${!value.length ? 'border-navy-900 bg-navy-900 text-white' : 'border-slate-300'}`}>{!value.length && <Check className="h-3 w-3" />}</span>{allLabel}
          </button>
          {opts.map(([v, l]) => (
            <button type="button" key={v} role="option" aria-selected={value.includes(v)} onClick={() => toggle(v)} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-navy-50">
              <span className={`flex h-4 w-4 items-center justify-center rounded border ${value.includes(v) ? 'border-navy-900 bg-navy-900 text-white' : 'border-slate-300'}`}>{value.includes(v) && <Check className="h-3 w-3" />}</span>{l}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
