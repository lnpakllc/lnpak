import { useEffect, useState } from 'react';
import { useParams, useSearchParams, Navigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { Plus, Search, Pencil, Trash2, ExternalLink, Eye, EyeOff } from 'lucide-react';
import { api, get } from '../../lib/api';
import { useToast } from '../../context/ToastContext';
import { Badge, Pagination, Skeleton, EmptyState, ErrorState, Modal, ConfirmModal, Spinner } from '../../components/ui';
import { FormField, prepare, initialValues } from '../../components/admin/FormFields';
import { PageHeader } from './AdminLayout';
import { CONTENT } from './contentConfig';

function Editor({ type, cfg, item, onClose }) {
  const toast = useToast();
  const qc = useQueryClient();
  const [values, setValues] = useState(() => initialValues(cfg.fields, item));
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const save = async (e) => {
    e.preventDefault();
    setErr('');
    const missing = cfg.fields.find((f) => f.required && !values[f.name]);
    if (missing) return setErr(`${missing.label} is required`);
    setBusy(true);
    try {
      const body = prepare(cfg.fields, values);
      if (item?._id) await api.patch(`/admin/content/${type}/${item._id}`, body);
      else await api.post(`/admin/content/${type}`, body);
      toast(`${cfg.singular} saved`);
      qc.invalidateQueries({ queryKey: ['admin-content', type] });
      qc.invalidateQueries({ queryKey: ['content'] });
      onClose();
    } catch (ex) { setErr(ex.message); } finally { setBusy(false); }
  };
  return (
    <Modal open onClose={onClose} title={item?._id ? `Edit ${cfg.singular.toLowerCase()}` : `New ${cfg.singular.toLowerCase()}`} size="max-w-3xl">
      <form onSubmit={save} className="grid gap-4 sm:grid-cols-2">
        {cfg.fields.map((f) => <FormField key={f.name} field={f} value={values[f.name]} onChange={(v) => setValues((s) => ({ ...s, [f.name]: v }))} />)}
        {err && <p className="field-error sm:col-span-2" role="alert">{err}</p>}
        <div className="sticky bottom-0 -mx-6 -mb-5 flex justify-end gap-2 border-t border-slate-100 bg-white px-6 py-4 sm:col-span-2">
          <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn-primary" disabled={busy}>{busy && <Spinner className="h-4 w-4 text-white" />}Save</button>
        </div>
      </form>
    </Modal>
  );
}

export default function ContentManager() {
  const { type } = useParams();
  const cfg = CONTENT[type];
  const toast = useToast();
  const qc = useQueryClient();
  const [params, setParams] = useSearchParams();
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const filters = Object.fromEntries(params.entries());
  const set = (k, v) => { const p = new URLSearchParams(params); if (v) p.set(k, v); else p.delete(k); if (k !== 'page') p.delete('page'); setParams(p, { replace: true }); };
  useEffect(() => { setEditing(null); }, [type]);

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['admin-content', type, filters],
    queryFn: () => get(`/admin/content/${type}`, { ...filters, limit: 20 }),
    placeholderData: keepPreviousData,
    enabled: !!cfg,
  });
  const toggle = useMutation({
    mutationFn: (it) => api.patch(`/admin/content/${type}/${it._id}`, { isPublished: !it.isPublished }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-content', type] }); qc.invalidateQueries({ queryKey: ['content'] }); },
    onError: (e) => toast(e.message, 'error'),
  });
  const remove = useMutation({
    mutationFn: (it) => api.delete(`/admin/content/${type}/${it._id}`),
    onSuccess: () => { toast('Deleted'); setDeleting(null); qc.invalidateQueries({ queryKey: ['admin-content', type] }); qc.invalidateQueries({ queryKey: ['content'] }); },
    onError: (e) => toast(e.message, 'error'),
  });

  // Open full record for editing (list rows may be trimmed).
  const openEdit = async (row) => {
    try { const r = await api.get(`/admin/content/${type}/${row._id}`); setEditing(r.data.data); } catch (e) { toast(e.message, 'error'); }
  };

  if (!cfg) return <Navigate to="/admin" replace />;
  return (
    <>
      <PageHeader title={cfg.title} subtitle="Changes appear on the public website immediately." actions={<button className="btn-primary btn-sm" onClick={() => setEditing({})}><Plus className="h-4 w-4" />Add {cfg.singular.toLowerCase()}</button>} />
      <div className="card mb-4 flex flex-wrap gap-3 p-4">
        <label className="relative min-w-60 flex-1"><Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" /><input className="input pl-9" placeholder="Search…" defaultValue={filters.q} key={type} onKeyDown={(e) => e.key === 'Enter' && set('q', e.target.value)} onBlur={(e) => e.target.value !== (filters.q || '') && set('q', e.target.value)} /></label>
        <select className="input w-44" value={filters.published || ''} onChange={(e) => set('published', e.target.value)}><option value="">All</option><option value="true">Published</option><option value="false">Hidden</option></select>
        {(cfg.filters || []).map((fl) => <select key={fl.name} className="input w-48" value={filters[fl.name] || ''} onChange={(e) => set(fl.name, e.target.value)}><option value="">All {fl.label.toLowerCase()}</option>{fl.options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>)}
      </div>
      {error ? <ErrorState error={error} onRetry={refetch} /> : isLoading ? <Skeleton className="h-80" /> : data.data.length === 0 ? (
        <EmptyState title={`No ${cfg.title.toLowerCase()} yet`} action={<button className="btn-primary btn-sm" onClick={() => setEditing({})}><Plus className="h-4 w-4" />Add the first one</button>} />
      ) : (
        <div className={isFetching ? 'opacity-70' : ''}>
          <div className="card overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-slate-100 bg-slate-50/70 text-xs uppercase tracking-wide text-slate-500"><tr>{cfg.columns.map(([, l]) => <th key={l} className="px-4 py-3">{l}</th>)}<th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Actions</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {data.data.map((row) => (
                  <tr key={row._id} className="hover:bg-slate-50/70">
                    {cfg.columns.map(([k, , fmt], i) => <td key={k} className={`px-4 py-3 ${i === 0 ? 'font-semibold text-navy-900' : ''}`}>{fmt ? fmt(row[k], row) : row[k] ?? '—'}</td>)}
                    <td className="px-4 py-3">{row.isPublished ? <Badge className="bg-emerald-100 text-emerald-800">Published</Badge> : <Badge>Hidden</Badge>}{row.isFeatured && <Badge className="ml-1 bg-gold-500/20 text-gold-600">Featured</Badge>}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        {cfg.publicPath && row.isPublished && <a href={`${cfg.publicPath}/${row.slug}`} target="_blank" rel="noreferrer" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" title="View on website"><ExternalLink className="h-4 w-4" /></a>}
                        <button onClick={() => toggle.mutate(row)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" title={row.isPublished ? 'Hide from website' : 'Publish'}>{row.isPublished ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
                        <button onClick={() => openEdit(row)} className="rounded-lg p-2 text-navy-700 hover:bg-slate-100" title="Edit"><Pencil className="h-4 w-4" /></button>
                        <button onClick={() => setDeleting(row)} className="rounded-lg p-2 text-rose-600 hover:bg-rose-50" title="Delete"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination meta={data.meta} onPage={(p) => set('page', String(p))} />
        </div>
      )}
      {editing && <Editor key={editing._id || 'new'} type={type} cfg={cfg} item={editing._id ? editing : null} onClose={() => setEditing(null)} />}
      <ConfirmModal open={!!deleting} onClose={() => setDeleting(null)} onConfirm={() => remove.mutate(deleting)} loading={remove.isPending} danger title={`Delete this ${cfg.singular.toLowerCase()}?`} text={`“${deleting?.[cfg.titleField]}” will be removed from the website permanently. To hide it temporarily, unpublish it instead.`} confirmText="Delete" />
    </>
  );
}
