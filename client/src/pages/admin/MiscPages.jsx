import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Download, Trash2, Search } from 'lucide-react';
import { api, get, download } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { fmtDate, fmtDateTime, roleLabel, timeAgo } from '../../lib/constants';
import { Pagination, Skeleton, EmptyState, ErrorState, Field, Spinner, ConfirmModal, Badge } from '../../components/ui';
import { PageHeader } from './AdminLayout';

export function NewsletterPage() {
  const toast = useToast();
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [del, setDel] = useState(null);
  const { data, isLoading, error, refetch } = useQuery({ queryKey: ['newsletter', page, q], queryFn: () => get('/admin/newsletter', { page, q, limit: 25 }), placeholderData: keepPreviousData });
  const remove = useMutation({ mutationFn: (s) => api.delete(`/admin/newsletter/${s._id}`), onSuccess: () => { toast('Subscriber removed'); setDel(null); qc.invalidateQueries({ queryKey: ['newsletter'] }); } });
  return (
    <>
      <PageHeader title="Newsletter subscribers" subtitle={data ? `${data.meta.total} subscribers` : ''} actions={<button className="btn-outline btn-sm" onClick={() => download('/admin/newsletter', { format: 'csv' }, 'lnpak-subscribers.csv').catch((e) => toast(e.message, 'error'))}><Download className="h-4 w-4" />Export CSV</button>} />
      <label className="relative mb-4 block max-w-sm"><Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" /><input className="input pl-9" placeholder="Search email" onKeyDown={(e) => { if (e.key === 'Enter') { setQ(e.target.value); setPage(1); } }} /></label>
      {error ? <ErrorState error={error} onRetry={refetch} /> : isLoading ? <Skeleton className="h-72" /> : data.data.length === 0 ? <EmptyState title="No subscribers yet" /> : (
        <>
          <div className="card divide-y divide-slate-100">
            {data.data.map((s) => (
              <div key={s._id} className="flex items-center justify-between px-4 py-3 text-sm">
                <div><p className="font-medium text-navy-900">{s.email}</p><p className="text-xs text-slate-400">{fmtDate(s.createdAt)}{s.sourcePage ? ` · from ${s.sourcePage}` : ''}</p></div>
                <button className="rounded-lg p-2 text-rose-600 hover:bg-rose-50" onClick={() => setDel(s)} aria-label={`Remove ${s.email}`}><Trash2 className="h-4 w-4" /></button>
              </div>
            ))}
          </div>
          <Pagination meta={data.meta} onPage={setPage} />
        </>
      )}
      <ConfirmModal open={!!del} onClose={() => setDel(null)} onConfirm={() => remove.mutate(del)} loading={remove.isPending} danger title="Remove subscriber?" text={del?.email} confirmText="Remove" />
    </>
  );
}

export function AuditPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, error, refetch } = useQuery({ queryKey: ['audit', page], queryFn: () => get('/admin/audit-logs', { page }), placeholderData: keepPreviousData });
  return (
    <>
      <PageHeader title="Audit log" subtitle="Who changed what, and when." />
      {error ? <ErrorState error={error} onRetry={refetch} /> : isLoading ? <Skeleton className="h-96" /> : (
        <>
          <div className="card overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-slate-100 bg-slate-50/70 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-4 py-3">When</th><th className="px-4 py-3">User</th><th className="px-4 py-3">Action</th><th className="px-4 py-3">Record</th><th className="px-4 py-3">IP</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {data.data.map((a) => (
                  <tr key={a._id}><td className="px-4 py-2.5 text-slate-500">{fmtDateTime(a.createdAt)}</td><td className="px-4 py-2.5">{a.user?.name || '—'}</td><td className="px-4 py-2.5"><Badge className="bg-navy-50 font-mono text-[11px] text-navy-800">{a.action}</Badge></td><td className="px-4 py-2.5 text-xs text-slate-500">{a.entity} {a.entityId ? `· ${a.entityId.slice(-6)}` : ''}</td><td className="px-4 py-2.5 text-xs text-slate-400">{a.ip}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination meta={data.meta} onPage={setPage} />
        </>
      )}
    </>
  );
}

export function NotificationsPage() {
  const [page, setPage] = useState(1);
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['notifications', 'page', page], queryFn: () => get('/notifications', { page }), placeholderData: keepPreviousData });
  const readAll = async () => { await api.post('/notifications/all/read'); qc.invalidateQueries({ queryKey: ['notifications'] }); };
  return (
    <>
      <PageHeader title="Notifications" actions={<button className="btn-outline btn-sm" onClick={readAll}>Mark all as read</button>} />
      {isLoading ? <Skeleton className="h-72" /> : data.data.length === 0 ? <EmptyState title="No notifications" /> : (
        <>
          <div className="card divide-y divide-slate-100">
            {data.data.map((n) => {
              const body = <div className={`px-4 py-3 ${n.read ? '' : 'bg-sky-50/60'}`}><p className="text-sm font-semibold text-navy-900">{n.title}</p>{n.body && <p className="text-xs text-slate-500">{n.body}</p>}<p className="mt-0.5 text-[11px] text-slate-400">{timeAgo(n.createdAt)}</p></div>;
              return n.link ? <Link key={n._id} to={n.link} onClick={() => !n.read && api.post(`/notifications/${n._id}/read`)} className="block hover:bg-slate-50">{body}</Link> : <div key={n._id}>{body}</div>;
            })}
          </div>
          <Pagination meta={data.meta} onPage={setPage} />
        </>
      )}
    </>
  );
}

export function ChangePasswordForm() {
  const toast = useToast();
  const { register, handleSubmit, reset, watch, formState: { isSubmitting } } = useForm();
  const [err, setErr] = useState('');
  const submit = async (v) => {
    setErr('');
    if (v.newPassword !== v.confirm) return setErr('New passwords do not match');
    try { await api.post('/auth/change-password', { currentPassword: v.currentPassword, newPassword: v.newPassword }); toast('Password changed'); reset(); } catch (e) { setErr(e.message); }
  };
  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-4">
      <Field label="Current password"><input type="password" autoComplete="current-password" className="input" {...register('currentPassword', { required: true })} /></Field>
      <Field label="New password" hint="8+ characters with letters and numbers"><input type="password" autoComplete="new-password" className="input" {...register('newPassword', { required: true })} /></Field>
      <Field label="Confirm new password"><input type="password" autoComplete="new-password" className="input" {...register('confirm', { required: true })} /></Field>
      {err && <p className="field-error">{err}</p>}
      <button className="btn-primary" disabled={isSubmitting || !watch('newPassword')}>{isSubmitting && <Spinner className="h-4 w-4 text-white" />}Change password</button>
    </form>
  );
}

export function ProfilePage() {
  const { user, refresh } = useAuth();
  const toast = useToast();
  const { register, handleSubmit, formState: { isSubmitting } } = useForm({ defaultValues: { name: user?.name, phone: user?.phone } });
  const save = async (v) => { try { await api.patch('/auth/me', v); await refresh(); toast('Profile saved'); } catch (e) { toast(e.message, 'error'); } };
  return (
    <>
      <PageHeader title="My profile" subtitle={`${user?.email} · ${roleLabel(user?.role)}`} />
      <div className="grid gap-6 lg:grid-cols-2">
        <form onSubmit={handleSubmit(save)} className="card space-y-4 p-6">
          <h2 className="text-base">Details</h2>
          <Field label="Full name"><input className="input" {...register('name', { required: true })} /></Field>
          <Field label="Phone"><input className="input" {...register('phone')} /></Field>
          <button className="btn-primary" disabled={isSubmitting}>Save</button>
        </form>
        <div className="card p-6"><h2 className="mb-4 text-base">Change password</h2><ChangePasswordForm /></div>
      </div>
    </>
  );
}
