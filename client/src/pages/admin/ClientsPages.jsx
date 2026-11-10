import { useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Plus, Search, KeyRound, Copy, Send, ArrowLeft, Save } from 'lucide-react';
import { api, get, getData } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { SERVICES, serviceLabel, statusMeta, fmtDate, fmtDateTime, timeAgo } from '../../lib/constants';
import { Badge, Pagination, Skeleton, EmptyState, ErrorState, Modal, Field, Spinner, PageLoader } from '../../components/ui';
import { PageHeader } from './AdminLayout';
import { useStaffOptions } from './LeadsPage';

const CLIENT_STATUS = { active: 'bg-emerald-100 text-emerald-800', inactive: 'bg-slate-200 text-slate-700', completed: 'bg-sky-100 text-sky-800' };
const toInputDate = (d) => (d ? new Date(d).toISOString().slice(0, 10) : '');

function ClientForm({ defaultValues, onSubmit, submitLabel, staff, canPassport }) {
  const { register, handleSubmit, formState: { isSubmitting } } = useForm({ defaultValues });
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-2">
      <Field label="Full name *"><input className="input" {...register('fullName', { required: true })} /></Field>
      <Field label="Email"><input className="input" type="email" {...register('email')} /></Field>
      <Field label="Phone"><input className="input" {...register('phone')} /></Field>
      <Field label="WhatsApp"><input className="input" {...register('whatsapp')} /></Field>
      <Field label="Nationality"><input className="input" {...register('nationality')} /></Field>
      <Field label="Date of birth"><input type="date" className="input" {...register('dateOfBirth')} /></Field>
      <Field label="Address" className="sm:col-span-2"><input className="input" {...register('address')} /></Field>
      <Field label="Interested service"><select className="input" {...register('interestedService')}><option value="">—</option>{SERVICES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}</select></Field>
      {staff && <Field label="Assigned consultant"><select className="input" {...register('assignedConsultant')}><option value="">—</option>{staff.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}</select></Field>}
      {canPassport && <>
        <Field label="Passport number" hint="Only visible to staff who can edit clients"><input className="input" autoComplete="off" {...register('passport.number')} /></Field>
        <Field label="Passport expiry"><input type="date" className="input" {...register('passport.expiry')} /></Field>
      </>}
      <div className="flex justify-end sm:col-span-2"><button className="btn-primary" disabled={isSubmitting}>{isSubmitting ? <Spinner className="h-4 w-4 text-white" /> : <Save className="h-4 w-4" />}{submitLabel}</button></div>
    </form>
  );
}

export function ClientsPage() {
  const { can } = useAuth();
  const toast = useToast();
  const qc = useQueryClient();
  const [params, setParams] = useSearchParams();
  const [adding, setAdding] = useState(false);
  const staff = useStaffOptions(can('clients:write'));
  const filters = Object.fromEntries(params.entries());
  const set = (k, v) => { const p = new URLSearchParams(params); if (v) p.set(k, v); else p.delete(k); if (k !== 'page') p.delete('page'); setParams(p, { replace: true }); };
  const { data, isLoading, error, refetch, isFetching } = useQuery({ queryKey: ['clients', filters], queryFn: () => get('/admin/clients', { ...filters, limit: 25 }), placeholderData: keepPreviousData });
  const create = async (v) => {
    try { await api.post('/admin/clients', v); toast('Client added'); qc.invalidateQueries({ queryKey: ['clients'] }); setAdding(false); } catch (e) { toast(e.message, 'error'); }
  };
  return (
    <>
      <PageHeader title="Clients" subtitle="Converted leads and clients added by staff." actions={can('clients:write') && <button className="btn-primary btn-sm" onClick={() => setAdding(true)}><Plus className="h-4 w-4" />Add client</button>} />
      <div className="card mb-4 flex flex-wrap gap-3 p-4">
        <label className="relative min-w-60 flex-1"><Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" /><input className="input pl-9" placeholder="Search name, email, phone or client ID" defaultValue={filters.q} onKeyDown={(e) => e.key === 'Enter' && set('q', e.target.value)} onBlur={(e) => e.target.value !== (filters.q || '') && set('q', e.target.value)} /></label>
        <select className="input w-44" value={filters.status || ''} onChange={(e) => set('status', e.target.value)}><option value="">All statuses</option><option value="active">Active</option><option value="completed">Completed</option><option value="inactive">Inactive</option></select>
      </div>
      {error ? <ErrorState error={error} onRetry={refetch} /> : isLoading ? <Skeleton className="h-80" /> : data.data.length === 0 ? <EmptyState title="No clients yet" text="Convert a lead or add a client manually." /> : (
        <div className={isFetching ? 'opacity-70' : ''}>
          <div className="card overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="border-b border-slate-100 bg-slate-50/70 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-4 py-3">Client</th><th className="px-4 py-3">Contact</th><th className="px-4 py-3">Service</th><th className="px-4 py-3">Consultant</th><th className="px-4 py-3">Portal</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Since</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {data.data.map((c) => (
                  <tr key={c._id} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3"><Link to={`/admin/clients/${c._id}`} className="font-semibold text-navy-900 hover:underline">{c.fullName}</Link><p className="text-xs text-slate-400">{c.code}</p></td>
                    <td className="px-4 py-3"><p>{c.phone || '—'}</p><p className="text-xs text-slate-500">{c.email}</p></td>
                    <td className="px-4 py-3">{serviceLabel(c.interestedService)}</td>
                    <td className="px-4 py-3">{c.assignedConsultant?.name || '—'}</td>
                    <td className="px-4 py-3">{c.user ? <span className="text-xs">{c.user.lastLoginAt ? `Last login ${timeAgo(c.user.lastLoginAt)}` : 'Invited'}</span> : <span className="text-xs text-slate-400">No access</span>}</td>
                    <td className="px-4 py-3"><Badge className={CLIENT_STATUS[c.status]}>{c.status}</Badge></td>
                    <td className="px-4 py-3 text-slate-500">{fmtDate(c.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination meta={data.meta} onPage={(p) => set('page', String(p))} />
        </div>
      )}
      <Modal open={adding} onClose={() => setAdding(false)} title="Add client" size="max-w-2xl">
        <ClientForm defaultValues={{}} onSubmit={create} submitLabel="Create client" staff={staff.data} canPassport />
      </Modal>
    </>
  );
}

export function ClientDetail() {
  const { id } = useParams();
  const { can } = useAuth();
  const toast = useToast();
  const qc = useQueryClient();
  const staff = useStaffOptions(can('clients:write'));
  const [edit, setEdit] = useState(false);
  const [note, setNote] = useState('');
  const [invite, setInvite] = useState('');
  const { data: c, isLoading, error, refetch } = useQuery({ queryKey: ['client', id], queryFn: () => getData(`/admin/clients/${id}`), retry: false });
  const refresh = () => { qc.invalidateQueries({ queryKey: ['client', id] }); qc.invalidateQueries({ queryKey: ['clients'] }); };
  const update = useMutation({ mutationFn: (b) => api.patch(`/admin/clients/${id}`, b), onSuccess: () => { toast('Client updated'); refresh(); setEdit(false); }, onError: (e) => toast(e.message, 'error') });
  const addNote = useMutation({ mutationFn: () => api.post(`/admin/clients/${id}/notes`, { text: note }), onSuccess: () => { setNote(''); refresh(); }, onError: (e) => toast(e.message, 'error') });
  const portal = useMutation({ mutationFn: () => api.post(`/admin/clients/${id}/portal-access`), onSuccess: (r) => { setInvite(r.data.data.inviteLink); refresh(); }, onError: (e) => toast(e.message, 'error') });

  if (isLoading) return <PageLoader />;
  if (error) return <ErrorState error={error} onRetry={error.status === 404 ? undefined : refetch} />;
  const clean = (v) => {
    const out = { ...v };
    ['email', 'dateOfBirth', 'assignedConsultant', 'interestedService'].forEach((k) => { if (out[k] === '') delete out[k]; });
    if (out.passport && !out.passport.number && !out.passport.expiry) delete out.passport;
    else if (out.passport && out.passport.expiry === '') delete out.passport.expiry;
    return out;
  };

  return (
    <>
      <Link to="/admin/clients" className="mb-3 mt-2 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-navy-900"><ArrowLeft className="h-4 w-4" />All clients</Link>
      <PageHeader
        title={c.fullName}
        subtitle={`${c.code} · client since ${fmtDate(c.createdAt)}${c.assignedConsultant ? ` · consultant: ${c.assignedConsultant.name}` : ''}`}
        actions={can('clients:write') && <>
          <select className="input btn-sm w-36 py-1.5" value={c.status} onChange={(e) => update.mutate({ status: e.target.value })} aria-label="Client status"><option value="active">Active</option><option value="completed">Completed</option><option value="inactive">Inactive (disables portal)</option></select>
          {c.email && <button className="btn-outline btn-sm" onClick={() => portal.mutate()} disabled={portal.isPending}><KeyRound className="h-4 w-4" />{c.user ? 'Resend portal invite' : 'Give portal access'}</button>}
          <button className="btn-primary btn-sm" onClick={() => setEdit((e) => !e)}>{edit ? 'Cancel edit' : 'Edit profile'}</button>
        </>}
      />
      {invite && (
        <div className="card mb-4 p-4 text-sm">
          <p className="mb-2 text-slate-600">One-time set-password link for the client (valid 7 days). It is also emailed when SMTP is configured.</p>
          <div className="flex gap-2"><input readOnly value={invite} className="input text-xs" /><button className="btn-outline btn-sm" onClick={() => { navigator.clipboard.writeText(invite); toast('Link copied'); }}><Copy className="h-4 w-4" /></button></div>
        </div>
      )}
      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <div className="card p-5">
            {edit ? (
              <ClientForm
                defaultValues={{ ...c, email: c.email || '', dateOfBirth: toInputDate(c.dateOfBirth), assignedConsultant: c.assignedConsultant?._id || '', passport: { number: c.passport?.number || '', expiry: toInputDate(c.passport?.expiry) } }}
                onSubmit={(v) => update.mutate(clean({ fullName: v.fullName, email: v.email, phone: v.phone, whatsapp: v.whatsapp, nationality: v.nationality, dateOfBirth: v.dateOfBirth, address: v.address, interestedService: v.interestedService, assignedConsultant: v.assignedConsultant, passport: v.passport }))}
                submitLabel="Save changes" staff={staff.data} canPassport={can('clients:write')}
              />
            ) : (
              <dl className="grid gap-4 sm:grid-cols-2">
                {[['Email', c.email], ['Phone', c.phone], ['WhatsApp', c.whatsapp], ['Nationality', c.nationality], ['Date of birth', c.dateOfBirth && fmtDate(c.dateOfBirth)], ['Address', c.address], ['Interested service', serviceLabel(c.interestedService)], ['Status', c.status],
                  ...(c.passport ? [['Passport number', c.passport.number], ['Passport expiry', c.passport.expiry && fmtDate(c.passport.expiry)]] : []),
                  ['Portal access', c.user ? `${c.user.isActive ? 'Active' : 'Disabled'}${c.user.lastLoginAt ? ` · last login ${timeAgo(c.user.lastLoginAt)}` : ' · not logged in yet'}` : 'Not invited'],
                ].map(([l, v]) => <div key={l}><dt className="text-xs text-slate-500">{l}</dt><dd className="font-medium text-navy-900">{v || '—'}</dd></div>)}
              </dl>
            )}
          </div>
          <div className="card p-5">
            <h2 className="mb-3 text-base">Inquiries & leads</h2>
            {c.leads.length === 0 ? <p className="text-sm text-slate-400">No linked inquiries.</p> : (
              <ul className="divide-y divide-slate-100">{c.leads.map((l) => <li key={l._id}><Link to={`/admin/leads/${l._id}`} className="flex items-center justify-between py-2.5 hover:bg-slate-50"><span><span className="font-medium text-navy-900">{serviceLabel(l.service)}</span><span className="text-xs text-slate-500"> · {l.code}{l.destination ? ` · ${l.destination}` : ''}</span></span><Badge className={statusMeta(l.status).color}>{statusMeta(l.status).label}</Badge></Link></li>)}</ul>
            )}
            <p className="mt-4 rounded-xl bg-slate-50 p-3 text-xs text-slate-500">Visa applications, documents and invoices for this client will appear here once those modules are added in the next phase.</p>
          </div>
        </div>
        <aside className="card h-fit p-5">
          <h2 className="mb-3 text-base">Private staff notes</h2>
          <form onSubmit={(e) => { e.preventDefault(); if (note.trim()) addNote.mutate(); }} className="mb-4 flex gap-2">
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} className="input" placeholder="Never shown to the client" />
            <button className="btn-primary self-end" disabled={!note.trim() || addNote.isPending} aria-label="Add note"><Send className="h-4 w-4" /></button>
          </form>
          {c.staffNotes.length === 0 ? <p className="text-sm text-slate-400">No notes yet.</p> : (
            <ul className="space-y-3">{[...c.staffNotes].reverse().map((n) => <li key={n._id} className="rounded-xl border border-slate-100 p-3"><p className="whitespace-pre-wrap text-sm">{n.text}</p><p className="mt-1 text-xs text-slate-400">{n.author?.name || 'Staff'} · {fmtDateTime(n.createdAt)}</p></li>)}</ul>
          )}
        </aside>
      </div>
    </>
  );
}
