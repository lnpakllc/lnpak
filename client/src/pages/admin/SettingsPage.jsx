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
    { name: 'address', label: 'Office address', type: 'text' }, { name: 'mapUrl', label: 'Google Maps link', type: 'text' },
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
        {tab === 'contact' && <FormField field={{ name: 'footerAbout', label: 'Footer introduction', type: 'textarea', rows: 2 }} value={values.footerAbout} onChange={(v) => setValues((s) => ({ ...s, footerAbout: v }))} />}
      </div>
    </>
  );
}
