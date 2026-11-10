// Config-driven form fields for the CMS (text, lists, images, repeaters …).
import { useRef, useState } from 'react';
import { Plus, Trash2, Upload, X, ChevronUp, ChevronDown } from 'lucide-react';
import { api } from '../../lib/api';
import { useToast } from '../../context/ToastContext';
import { Field, Img, Spinner, ICONS, Icon } from '../ui';

const toDateInput = (v) => (v ? new Date(v).toISOString().slice(0, 10) : '');

export async function uploadImages(files) {
  const fd = new FormData();
  [...files].forEach((f) => fd.append('images', f));
  const r = await api.post('/admin/uploads/images', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
  return r.data.data.map((x) => x.url);
}

function ImageInput({ value, onChange, multiple }) {
  const toast = useToast();
  const ref = useRef(null);
  const [busy, setBusy] = useState(false);
  const [url, setUrl] = useState('');
  const list = multiple ? value || [] : value ? [value] : [];
  const pick = async (e) => {
    if (!e.target.files?.length) return;
    setBusy(true);
    try {
      const urls = await uploadImages(e.target.files);
      onChange(multiple ? [...list, ...urls] : urls[0]);
    } catch (err) { toast(err.message, 'error'); } finally { setBusy(false); e.target.value = ''; }
  };
  const addUrl = () => { if (!url.trim()) return; onChange(multiple ? [...list, url.trim()] : url.trim()); setUrl(''); };
  return (
    <div>
      {list.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {list.map((src, i) => (
            <div key={src + i} className="relative">
              <Img src={src} alt="" className="h-20 w-28 rounded-lg border border-slate-200 object-cover" />
              <button type="button" onClick={() => onChange(multiple ? list.filter((_, j) => j !== i) : '')} className="absolute -right-2 -top-2 rounded-full bg-rose-600 p-0.5 text-white" aria-label="Remove image"><X className="h-3.5 w-3.5" /></button>
            </div>
          ))}
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn-outline btn-sm" onClick={() => ref.current?.click()} disabled={busy}>{busy ? <Spinner className="h-4 w-4" /> : <Upload className="h-4 w-4" />}Upload</button>
        <input ref={ref} type="file" accept="image/jpeg,image/png,image/webp" multiple={multiple} className="hidden" onChange={pick} />
        <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="…or paste an image URL" className="input min-w-0 flex-1 py-1.5 text-xs" onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addUrl(); } }} />
        {url && <button type="button" className="btn-ghost btn-sm" onClick={addUrl}>Add</button>}
      </div>
    </div>
  );
}

function Repeater({ field, value = [], onChange }) {
  const blank = () => Object.fromEntries(field.fields.map((f) => [f.name, f.default ?? (f.type === 'list' ? [] : '')]));
  const set = (i, k, v) => onChange(value.map((row, j) => (j === i ? { ...row, [k]: v } : row)));
  const move = (i, d) => { const n = [...value]; [n[i], n[i + d]] = [n[i + d], n[i]]; onChange(n); };
  return (
    <div className="space-y-3">
      {value.map((row, i) => (
        <div key={i} className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wide text-slate-500">{field.numbered ? `Day ${i + 1}` : `${field.label} #${i + 1}`}</span>
            <div className="flex gap-1">
              <button type="button" disabled={i === 0} onClick={() => move(i, -1)} className="rounded p-1 hover:bg-white disabled:opacity-30" aria-label="Move up"><ChevronUp className="h-4 w-4" /></button>
              <button type="button" disabled={i === value.length - 1} onClick={() => move(i, 1)} className="rounded p-1 hover:bg-white disabled:opacity-30" aria-label="Move down"><ChevronDown className="h-4 w-4" /></button>
              <button type="button" onClick={() => onChange(value.filter((_, j) => j !== i))} className="rounded p-1 text-rose-600 hover:bg-white" aria-label="Remove"><Trash2 className="h-4 w-4" /></button>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">{field.fields.map((f) => <FormField key={f.name} field={f} value={row[f.name]} onChange={(v) => set(i, f.name, v)} />)}</div>
        </div>
      ))}
      <button type="button" className="btn-outline btn-sm" onClick={() => onChange([...value, blank()])}><Plus className="h-4 w-4" />Add {field.numbered ? 'day' : 'item'}</button>
    </div>
  );
}

export function FormField({ field: f, value, onChange }) {
  const span = f.half ? '' : 'sm:col-span-2';
  const count = f.max && typeof value === 'string' ? `${value.length}/${f.max}` : null;
  let input;
  switch (f.type) {
    case 'textarea':
      input = <textarea className="input" rows={f.rows || 3} maxLength={f.max} value={value || ''} onChange={(e) => onChange(e.target.value)} />; break;
    case 'number':
      input = <input type="number" className="input" value={value ?? ''} onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))} />; break;
    case 'select':
      input = <select className="input" value={value || ''} onChange={(e) => onChange(e.target.value)}><option value="">— Select —</option>{f.options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>; break;
    case 'checkbox':
      return <label className={`flex items-center gap-2 text-sm font-medium text-slate-700 ${span}`}><input type="checkbox" className="h-4 w-4 accent-navy-900" checked={!!value} onChange={(e) => onChange(e.target.checked)} />{f.label}</label>;
    case 'date':
      input = <input type="date" className="input" value={toDateInput(value)} onChange={(e) => onChange(e.target.value || null)} />; break;
    case 'dates':
      input = (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">{(value || []).map((d, i) => <span key={i} className="inline-flex items-center gap-1 rounded-full bg-navy-50 px-3 py-1 text-xs font-semibold text-navy-900">{toDateInput(d)}<button type="button" onClick={() => onChange(value.filter((_, j) => j !== i))} aria-label="Remove date"><X className="h-3 w-3" /></button></span>)}</div>
          <input type="date" className="input" onChange={(e) => { if (e.target.value) { onChange([...(value || []), e.target.value]); e.target.value = ''; } }} />
        </div>
      ); break;
    case 'list':
      input = <textarea className="input font-mono text-xs leading-relaxed" rows={Math.max(3, Math.min(10, (value || []).length + 1))} value={(value || []).join('\n')} onChange={(e) => onChange(e.target.value.split('\n'))} placeholder="One item per line" />; break;
    case 'image':
      input = <ImageInput value={value} onChange={onChange} />; break;
    case 'images':
      input = <ImageInput value={value} onChange={onChange} multiple />; break;
    case 'icon':
      input = (
        <div className="flex flex-wrap gap-1.5">{Object.keys(ICONS).map((n) => (
          <button type="button" key={n} title={n} onClick={() => onChange(n)} className={`rounded-lg border p-2 ${value === n ? 'border-navy-900 bg-navy-900 text-white' : 'border-slate-200 text-navy-900 hover:bg-navy-50'}`}><Icon name={n} className="h-5 w-5" /></button>
        ))}</div>
      ); break;
    case 'repeater':
      return <div className={span}><p className="label">{f.label}</p><Repeater field={f} value={value} onChange={onChange} /></div>;
    case 'group':
      return (
        <fieldset className={`rounded-xl border border-slate-200 p-4 ${span}`}>
          <legend className="px-1 text-xs font-bold uppercase tracking-wide text-slate-500">{f.label}</legend>
          <div className="grid gap-3 sm:grid-cols-2">{f.fields.map((sf) => <FormField key={sf.name} field={sf} value={value?.[sf.name]} onChange={(v) => onChange({ ...(value || {}), [sf.name]: v })} />)}</div>
        </fieldset>
      );
    default:
      input = <input className="input" maxLength={f.max} value={value || ''} onChange={(e) => onChange(e.target.value)} />;
  }
  return <Field label={`${f.label}${f.required ? ' *' : ''}${count ? ` (${count})` : ''}`} hint={f.hint} className={span}>{input}</Field>;
}

// Clean values before saving: trim list items, drop empty rows.
export function prepare(fields, values) {
  const out = {};
  for (const f of fields) {
    let v = values[f.name];
    if (f.type === 'list') v = (v || []).map((s) => s.trim()).filter(Boolean);
    if (f.type === 'repeater') v = (v || []).map((row, i) => ({ ...prepare(f.fields, row), ...(f.numbered ? { [f.numbered]: i + 1 } : {}) }));
    if (f.type === 'group') v = prepare(f.fields, v || {});
    if (f.name === 'slug' && !v) continue;
    out[f.name] = v === '' && f.type === 'select' ? undefined : v;
  }
  return out;
}

export function initialValues(fields, item) {
  return Object.fromEntries(fields.map((f) => {
    const v = item?.[f.name];
    if (v !== undefined && v !== null) return [f.name, f.type === 'group' ? initialValues(f.fields, v) : v];
    if (f.type === 'group') return [f.name, initialValues(f.fields, {})];
    return [f.name, f.default ?? (['list', 'repeater', 'images', 'dates'].includes(f.type) ? [] : f.type === 'checkbox' ? false : '')];
  }));
}
