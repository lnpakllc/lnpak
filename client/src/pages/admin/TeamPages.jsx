import { useState } from 'react';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Plus, Pencil, ShieldCheck, Lock, Trash2 } from 'lucide-react';
import { api, get, getData } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { roleLabel, fmtDate, timeAgo } from '../../lib/constants';
import { Badge, Pagination, Skeleton, ErrorState, Modal, Field, Spinner, ConfirmModal } from '../../components/ui';
import { PageHeader } from './AdminLayout';

const useRoles = () => useQuery({ queryKey: ['roles'], queryFn: () => getData('/admin/roles') });

function StaffForm({ user, roles, onDone }) {
  const toast = useToast();
  const { user: me } = useAuth();
  const { register, handleSubmit, formState: { isSubmitting } } = useForm({ defaultValues: user ? { name: user.name, phone: user.phone, role: user.role, isActive: user.isActive, password: '' } : { role: 'sales_agent', isActive: true } });
  const [err, setErr] = useState('');
  const submit = async (v) => {
    setErr('');
    const body = { ...v };
    if (!body.password) delete body.password;
    try {
      if (user) await api.patch(`/admin/staff/${user._id}`, body);
      else await api.post('/admin/staff', body);
      toast(user ? 'Staff member updated' : 'Staff member created');
      onDone();
    } catch (e) { setErr(e.message); }
  };
  const self = user?._id === me?._id;
  return (
    <form onSubmit={handleSubmit(submit)} className="grid gap-4 sm:grid-cols-2">
      <Field label="Full name *"><input className="input" {...register('name', { required: true })} /></Field>
      {!user && <Field label="Email *"><input type="email" className="input" {...register('email', { required: true })} /></Field>}
      <Field label="Phone"><input className="input" {...register('phone')} /></Field>
      <Field label="Role"><select className="input" disabled={self} {...register('role')}>{roles.filter((r) => r.key !== 'super_admin' || me?.role === 'super_admin').map((r) => <option key={r.key} value={r.key}>{r.name}</option>)}</select></Field>
      <Field label={user ? 'New password (leave blank to keep)' : 'Temporary password *'} hint="8+ characters with letters and numbers. Share it securely; they can change it in their profile.">
        <input type="password" autoComplete="new-password" className="input" {...register('password', { required: !user })} />
      </Field>
      {user && !self && <label className="flex items-center gap-2 self-end pb-3 text-sm font-medium"><input type="checkbox" className="h-4 w-4 accent-navy-900" {...register('isActive')} />Account active</label>}
      {err && <p className="field-error sm:col-span-2">{err}</p>}
      <div className="flex justify-end gap-2 sm:col-span-2"><button className="btn-primary" disabled={isSubmitting}>{isSubmitting && <Spinner className="h-4 w-4 text-white" />}{user ? 'Save' : 'Create account'}</button></div>
    </form>
  );
}

export function StaffPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState(null);
  const roles = useRoles();
  const { data, isLoading, error, refetch } = useQuery({ queryKey: ['staff', page], queryFn: () => get('/admin/staff', { page, limit: 25 }), placeholderData: keepPreviousData });
  const done = () => { setEditing(null); qc.invalidateQueries({ queryKey: ['staff'] }); };
  return (
    <>
      <PageHeader title="Staff" subtitle="Team accounts for the admin panel." actions={<button className="btn-primary btn-sm" onClick={() => setEditing({})}><Plus className="h-4 w-4" />Add staff</button>} />
      {error ? <ErrorState error={error} onRetry={refetch} /> : isLoading ? <Skeleton className="h-72" /> : (
        <>
          <div className="card overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-slate-100 bg-slate-50/70 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-4 py-3">Name</th><th className="px-4 py-3">Role</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Last login</th><th className="px-4 py-3">Added</th><th /></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {data.data.map((u) => (
                  <tr key={u._id}>
                    <td className="px-4 py-3"><p className="font-semibold text-navy-900">{u.name}</p><p className="text-xs text-slate-500">{u.email}</p></td>
                    <td className="px-4 py-3">{roleLabel(u.role)}</td>
                    <td className="px-4 py-3">{u.isActive ? <Badge className="bg-emerald-100 text-emerald-800">Active</Badge> : <Badge>Disabled</Badge>}</td>
                    <td className="px-4 py-3 text-slate-500">{u.lastLoginAt ? timeAgo(u.lastLoginAt) : 'Never'}</td>
                    <td className="px-4 py-3 text-slate-500">{fmtDate(u.createdAt)}</td>
                    <td className="px-4 py-3 text-right"><button className="rounded-lg p-2 text-navy-700 hover:bg-slate-100" onClick={() => setEditing(u)} aria-label={`Edit ${u.name}`}><Pencil className="h-4 w-4" /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination meta={data.meta} onPage={setPage} />
        </>
      )}
      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing?._id ? `Edit ${editing.name}` : 'Add staff member'} size="max-w-2xl">
        {editing && roles.data && <StaffForm user={editing._id ? editing : null} roles={roles.data.roles} onDone={done} />}
      </Modal>
    </>
  );
}

function RoleEditor({ role, catalogue, onDone }) {
  const toast = useToast();
  const [name, setName] = useState(role?.name || '');
  const [key, setKey] = useState(role?.key || '');
  const [perms, setPerms] = useState(new Set(role?.permissions || ['dashboard:view']));
  const [busy, setBusy] = useState(false);
  const toggle = (p) => setPerms((s) => { const n = new Set(s); if (n.has(p)) n.delete(p); else n.add(p); return n; });
  const save = async () => {
    setBusy(true);
    try {
      const body = { name, permissions: [...perms] };
      if (role?._id) await api.put(`/admin/roles/${role._id}`, body);
      else await api.post('/admin/roles', { ...body, key });
      toast('Role saved');
      onDone();
    } catch (e) { toast(e.message, 'error'); } finally { setBusy(false); }
  };
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Role name"><input className="input" value={name} onChange={(e) => setName(e.target.value)} /></Field>
        {!role?._id && <Field label="Key" hint="lowercase_with_underscores"><input className="input" value={key} onChange={(e) => setKey(e.target.value.toLowerCase().replace(/[^a-z_]/g, ''))} /></Field>}
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {Object.entries(catalogue).map(([p, desc]) => (
          <label key={p} className={`flex cursor-pointer gap-3 rounded-xl border p-3 text-sm ${perms.has(p) ? 'border-navy-700 bg-navy-50' : 'border-slate-200'}`}>
            <input type="checkbox" className="mt-0.5 h-4 w-4 accent-navy-900" checked={perms.has(p)} onChange={() => toggle(p)} />
            <span><span className="block font-mono text-xs font-semibold text-navy-900">{p}</span><span className="text-xs text-slate-500">{desc}</span></span>
          </label>
        ))}
      </div>
      <div className="flex justify-end"><button className="btn-primary" onClick={save} disabled={busy || !name}>{busy && <Spinner className="h-4 w-4 text-white" />}Save role</button></div>
    </div>
  );
}

export function RolesPage() {
  const { can } = useAuth();
  const toast = useToast();
  const qc = useQueryClient();
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const { data, isLoading, error, refetch } = useRoles();
  const del = useMutation({ mutationFn: (r) => api.delete(`/admin/roles/${r._id}`), onSuccess: () => { toast('Role deleted'); setDeleting(null); qc.invalidateQueries({ queryKey: ['roles'] }); }, onError: (e) => { toast(e.message, 'error'); setDeleting(null); } });
  const editable = can('roles:manage');
  if (error) return <ErrorState error={error} onRetry={refetch} />;
  return (
    <>
      <PageHeader title="Roles & Permissions" subtitle="Permissions are enforced by the server on every request." actions={editable && <button className="btn-primary btn-sm" onClick={() => setEditing({})}><Plus className="h-4 w-4" />New role</button>} />
      {isLoading ? <Skeleton className="h-72" /> : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {data.roles.map((r) => (
            <div key={r._id} className="card flex flex-col p-5">
              <div className="mb-3 flex items-start justify-between">
                <div><h2 className="flex items-center gap-2 text-base"><ShieldCheck className="h-4 w-4 text-navy-700" />{r.name}</h2><p className="text-xs text-slate-500">{r.users} user{r.users === 1 ? '' : 's'}{r.isSystem ? ' · built-in' : ''}</p></div>
                {editable && r.key !== 'super_admin' && (
                  <div className="flex gap-1">
                    <button className="rounded-lg p-2 text-navy-700 hover:bg-slate-100" onClick={() => setEditing(r)} aria-label={`Edit ${r.name}`}><Pencil className="h-4 w-4" /></button>
                    {!r.isSystem && <button className="rounded-lg p-2 text-rose-600 hover:bg-rose-50" onClick={() => setDeleting(r)} aria-label={`Delete ${r.name}`}><Trash2 className="h-4 w-4" /></button>}
                  </div>
                )}
                {r.key === 'super_admin' && <Lock className="h-4 w-4 text-slate-400" />}
              </div>
              <div className="flex flex-wrap gap-1.5">{r.permissions.includes('*') ? <Badge className="bg-navy-900 text-white">Full access</Badge> : r.permissions.map((p) => <Badge key={p} className="bg-navy-50 font-mono text-[10px] text-navy-800">{p}</Badge>)}</div>
            </div>
          ))}
        </div>
      )}
      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing?._id ? `Edit role: ${editing.name}` : 'New role'} size="max-w-3xl">
        {editing && data && <RoleEditor role={editing._id ? editing : null} catalogue={data.catalogue} onDone={() => { setEditing(null); qc.invalidateQueries({ queryKey: ['roles'] }); }} />}
      </Modal>
      <ConfirmModal open={!!deleting} onClose={() => setDeleting(null)} onConfirm={() => del.mutate(deleting)} loading={del.isPending} danger title="Delete role?" text={`“${deleting?.name}” will be removed. Roles that still have staff cannot be deleted.`} confirmText="Delete" />
    </>
  );
}
