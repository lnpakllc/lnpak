import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Save } from 'lucide-react';
import { api, getData } from '../../lib/api';
import { useToast } from '../../context/ToastContext';
import { PageLoader, Spinner } from '../../components/ui';
import { FormField } from '../../components/admin/FormFields';
import { PageHeader } from './AdminLayout';

const SECTIONS = {
  contact: { label: 'Contact', fields: [
    { name: 'email', label: 'Email', type: 'text', half: true }, { name: 'phone', label: 'Phone', type: 'text', half: true },
    { name: 'whatsapp', label: 'WhatsApp number (digits with country code)', type: 'text', half: true, hint: 'e.g. 923001234567 — powers every WhatsApp button' },
    { name: 'officeHours', label: 'Office hours', type: 'text', half: true },
  ] },
  social: { label: 'Social media', fields: ['facebook', 'instagram', 'linkedin', 'youtube', 'tiktok'].map((n) => ({ name: n, label: n[0].toUpperCase() + n.slice(1), type: 'text', half: true })) },
  hero: { label: 'Homepage hero', fields: [
    { name: 'eyebrow', label: 'Small line above headline', type: 'text' }, { name: 'title', label: 'Headline', type: 'text' },
    { name: 'subtitle', label: 'Sub-heading', type: 'textarea', rows: 2 }, { name: 'image', label: 'Hero image', type: 'image', hint: 'Wide landscape image, at least 1600px wide' },
  ] },
  about: { label: 'About page', fields: [
    { name: 'title', label: 'Title', type: 'text' }, { name: 'body', label: 'Body', type: 'textarea', rows: 6, hint: 'Blank line between paragraphs' },
    { name: 'mission', label: 'Mission', type: 'textarea', rows: 2 }, { name: 'vision', label: 'Vision', type: 'textarea', rows: 2 },
    { name: 'values', label: 'Core values', type: 'list' },
  ] },
  pages: { label: 'Policy pages', fields: [
    { name: 'privacy', label: 'Privacy Policy', type: 'textarea', rows: 8 }, { name: 'terms', label: 'Terms & Conditions', type: 'textarea', rows: 8 }, { name: 'refund', label: 'Refund Policy', type: 'textarea', rows: 8 },
  ] },
  seo: { label: 'SEO defaults', fields: [
    { name: 'metaTitle', label: 'Default meta title', type: 'text', max: 70 }, { name: 'metaDescription', label: 'Default meta description', type: 'textarea', rows: 2, max: 170 }, { name: 'ogImage', label: 'Default social share image', type: 'image' },
  ] },
};

// Add / edit / remove office locations. The first one is the head office.
function OfficesEditor({ value, onChange }) {
  const offices = Array.isArray(value) ? value : [];
  const set = (i, key, v) => onChange(offices.map((o, k) => (k === i ? { ...o, [key]: v } : o)));
  return (
    <div className="sm:col-span-2">
      <p className="label">Offices</p>
      <p className="mb-3 text-xs text-slate-500">Shown in the website top bar, Contact page and footer. The first office is the head office.</p>
      <div className="space-y-3">
        {offices.map((o, i) => (
          <div key={i} className="rounded-xl border border-slate-200 p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-semibold text-navy-900">{i === 0 ? 'Head office' : `Office ${i + 1}`}</span>
              <button type="button" className="text-xs font-semibold text-rose-600 hover:underline" onClick={() => onChange(offices.filter((_, k) => k !== i))}>Remove</button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <input className="input" placeholder="Name, e.g. Izhevsk Head Office" value={o.name || ''} maxLength={80} onChange={(e) => set(i, 'name', e.target.value)} />
              <input className="input" placeholder="Phone (optional)" value={o.phone || ''} maxLength={40} onChange={(e) => set(i, 'phone', e.target.value)} />
              <input className="input sm:col-span-2" placeholder="Full address" value={o.address || ''} maxLength={300} onChange={(e) => set(i, 'address', e.target.value)} />
              <input className="input sm:col-span-2" placeholder="Google Maps link (optional)" value={o.mapUrl || ''} maxLength={500} onChange={(e) => set(i, 'mapUrl', e.target.value)} />
            </div>
          </div>
        ))}
      </div>
      <button type="button" className="btn-outline btn-sm mt-3" onClick={() => onChange([...offices, { name: '', address: '', phone: '', mapUrl: '' }])}>+ Add office</button>
    </div>
  );
}

export default function SettingsPage() {
  const toast = useToast();
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['settings'], queryFn: () => getData('/settings/public') });
  const [tab, setTab] = useState('contact');
  const [values, setValues] = useState(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (data && !values) setValues(data); }, [data, values]);
  if (isLoading || !values) return <PageLoader />;
  const sec = SECTIONS[tab];
  const save = async () => {
    setBusy(true);
    try {
      const body = Object.fromEntries(Object.keys(SECTIONS).map((k) => [k, values[k] || {}]));
      body.footerAbout = values.footerAbout;
      const offices = (body.contact.offices || []).map((o) => ({ name: (o.name || '').trim(), address: (o.address || '').trim(), phone: (o.phone || '').trim(), mapUrl: (o.mapUrl || '').trim() })).filter((o) => o.name || o.address);
      body.contact = { ...body.contact, offices, address: offices[0]?.address || '', mapUrl: offices[0]?.mapUrl || '' }; // first office mirrors the old single-address fields
      if (Array.isArray(body.about?.values)) body.about = { ...body.about, values: body.about.values.map((v) => v.trim()).filter(Boolean) };
      const r = await api.put('/admin/settings', body);
      qc.setQueryData(['settings'], r.data.data);
      toast('Settings saved — the website is updated');
    } catch (e) { toast(e.message, 'error'); } finally { setBusy(false); }
  };
  return (
    <>
      <PageHeader title="Site Settings" subtitle="Contact details, homepage hero, about and policy pages." actions={<button className="btn-primary btn-sm" onClick={save} disabled={busy}>{busy ? <Spinner className="h-4 w-4 text-white" /> : <Save className="h-4 w-4" />}Save all</button>} />
      <div className="mb-4 flex gap-2 overflow-x-auto">
        {Object.entries(SECTIONS).map(([k, s]) => <button key={k} onClick={() => setTab(k)} className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold ${tab === k ? 'bg-navy-900 text-white' : 'bg-white text-navy-900 shadow-card'}`}>{s.label}</button>)}
      </div>
      <div className="card grid gap-4 p-6 sm:grid-cols-2">
        {sec.fields.map((f) => <FormField key={f.name} field={f} value={values[tab]?.[f.name]} onChange={(v) => setValues((s) => ({ ...s, [tab]: { ...(s[tab] || {}), [f.name]: v } }))} />)}
        {tab === 'contact' && <OfficesEditor value={values.contact?.offices ?? (values.contact?.address ? [{ name: 'Head Office', address: values.contact.address, mapUrl: values.contact.mapUrl || '' }] : [])} onChange={(v) => setValues((s) => ({ ...s, contact: { ...(s.contact || {}), offices: v } }))} />}
        {tab === 'contact' && <FormField field={{ name: 'footerAbout', label: 'Footer introduction', type: 'textarea', rows: 2 }} value={values.footerAbout} onChange={(v) => setValues((s) => ({ ...s, footerAbout: v }))} />}
      </div>
    </>
  );
}
