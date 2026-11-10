import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { DndContext, PointerSensor, TouchSensor, useSensor, useSensors, useDraggable, useDroppable } from '@dnd-kit/core';
import { Plus, Download, LayoutList, Columns3, Search, X, CalendarClock, Phone } from 'lucide-react';
import { api, get, getData, download } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { SERVICES, LEAD_STATUSES, PRIORITIES, DESTINATIONS, serviceLabel, statusMeta, fmtDate, timeAgo } from '../../lib/constants';
import { Badge, Pagination, Skeleton, EmptyState, ErrorState, Modal, Field, Spinner } from '../../components/ui';
import { PageHeader } from './AdminLayout';

const FILTER_KEYS = ['q', 'status', 'service', 'destination', 'assignedTo', 'priority', 'from', 'to', 'followUp', 'source'];

export function useStaffOptions(enabled = true) {
  return useQuery({ queryKey: ['staff', 'assignable'], queryFn: () => getData('/admin/staff/assignable'), staleTime: 300000, enabled });
}

function AddLeadModal({ open, onClose }) {
  const { can } = useAuth();
  const staff = useStaffOptions(open && can('leads:assign'));
  const toast = useToast();
  const qc = useQueryClient();
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm({ defaultValues: { service: 'general', priority: 'medium', source: 'walk-in' } });
  const [err, setErr] = useState('');
  const submit = async (v) => {
    setErr('');
    try {
      await api.post('/admin/leads', v);
      toast('Lead added');
      qc.invalidateQueries({ queryKey: ['leads'] });
      reset(); onClose();
    } catch (e) { setErr(e.message); }
  };
  return (
    <Modal open={open} onClose={onClose} title="Add lead manually" size="max-w-2xl">
      <form onSubmit={handleSubmit(submit)} className="grid gap-4 sm:grid-cols-2">
        <Field label="Full name *"><input className="input" {...register('fullName', { required: true })} /></Field>
        <Field label="Phone *"><input className="input" {...register('phone', { required: true })} /></Field>
        <Field label="Email"><input className="input" type="email" {...register('email')} /></Field>
        <Field label="WhatsApp"><input className="input" {...register('whatsapp')} /></Field>
        <Field label="Service"><select className="input" {...register('service')}>{SERVICES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}</select></Field>
        <Field label="Destination"><input className="input" list="dest-list" {...register('destination')} /><datalist id="dest-list">{DESTINATIONS.map((d) => <option key={d} value={d} />)}</datalist></Field>
        <Field label="Source"><select className="input" {...register('source')}>{['walk-in', 'phone', 'whatsapp', 'facebook', 'instagram', 'referral', 'event', 'other'].map((s) => <option key={s}>{s}</option>)}</select></Field>
        <Field label="Priority"><select className="input" {...register('priority')}>{PRIORITIES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}</select></Field>
        <Field label="Lives in (country)"><input className="input" {...register('country')} /></Field>
        {can('leads:assign') && <Field label="Assign to"><select className="input" {...register('assignedTo')}><option value="">— Unassigned —</option>{(staff.data || []).map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}</select></Field>}
        <Field label="Message / notes" className="sm:col-span-2"><textarea rows={3} className="input" {...register('message')} /></Field>
        {err && <p className="field-error sm:col-span-2">{err}</p>}
        <div className="flex justify-end gap-2 sm:col-span-2"><button type="button" className="btn-ghost" onClick={onClose}>Cancel</button><button className="btn-primary" disabled={isSubmitting}>{isSubmitting && <Spinner className="h-4 w-4 text-white" />}Save lead</button></div>
      </form>
    </Modal>
  );
}

function Filters({ filters, set, clear, staff }) {
  const active = FILTER_KEYS.filter((k) => filters[k]).length;
  return (
    <div className="card mb-4 grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
      <label className="relative sm:col-span-2"><Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" /><input className="input pl-9" placeholder="Name, email, phone or ID" defaultValue={filters.q} key={filters.q} onKeyDown={(e) => e.key === 'Enter' && set('q', e.target.value)} onBlur={(e) => e.target.value !== (filters.q || '') && set('q', e.target.value)} aria-label="Search leads" /></label>
      <select className="input" value={filters.status || ''} onChange={(e) => set('status', e.target.value)} aria-label="Status"><option value="">All statuses</option>{LEAD_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}</select>
      <select className="input" value={filters.service || ''} onChange={(e) => set('service', e.target.value)} aria-label="Service"><option value="">All services</option>{SERVICES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}</select>
      <select className="input" value={filters.destination || ''} onChange={(e) => set('destination', e.target.value)} aria-label="Destination"><option value="">All destinations</option>{DESTINATIONS.map((d) => <option key={d}>{d}</option>)}</select>
      {staff ? <select className="input" value={filters.assignedTo || ''} onChange={(e) => set('assignedTo', e.target.value)} aria-label="Assigned to"><option value="">Anyone</option><option value="unassigned">Unassigned</option>{staff.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}</select> : <select className="input" value={filters.priority || ''} onChange={(e) => set('priority', e.target.value)} aria-label="Priority"><option value="">Any priority</option>{PRIORITIES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}</select>}
      <input type="date" className="input" value={filters.from || ''} onChange={(e) => set('from', e.target.value)} aria-label="From date" title="From" />
      <input type="date" className="input" value={filters.to || ''} onChange={(e) => set('to', e.target.value)} aria-label="To date" title="To" />
      {active > 0 && (
        <div className="flex flex-wrap items-center gap-2 sm:col-span-2 lg:col-span-4 xl:col-span-8">
          {filters.followUp && <Badge className="bg-amber-100 text-amber-800">Follow-up: {filters.followUp}</Badge>}
          <button className="btn-ghost btn-sm" onClick={clear}><X className="h-3.5 w-3.5" />Clear {active} filter{active > 1 ? 's' : ''}</button>
        </div>
      )}
    </div>
  );
}

function LeadTable({ items }) {
  return (
    <div className="card overflow-x-auto">
      <table className="w-full min-w-[900px] text-left text-sm">
        <thead className="border-b border-slate-100 bg-slate-50/70 text-xs uppercase tracking-wide text-slate-500">
          <tr><th className="px-4 py-3">Lead</th><th className="px-4 py-3">Contact</th><th className="px-4 py-3">Service / Destination</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Assigned</th><th className="px-4 py-3">Follow-up</th><th className="px-4 py-3">Received</th></tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {items.map((l) => {
            const overdue = l.followUpDate && new Date(l.followUpDate) < new Date(new Date().setHours(0, 0, 0, 0));
            return (
              <tr key={l._id} className="hover:bg-slate-50/70">
                <td className="px-4 py-3"><Link to={`/admin/leads/${l._id}`} className="font-semibold text-navy-900 hover:underline">{l.fullName}</Link><p className="text-xs text-slate-400">{l.code} · <span className={PRIORITIES.find((p) => p.value === l.priority)?.color}>{l.priority}</span></p></td>
                <td className="px-4 py-3"><p>{l.phone}</p><p className="text-xs text-slate-500">{l.email}</p></td>
                <td className="px-4 py-3"><p>{serviceLabel(l.service)}</p><p className="text-xs text-slate-500">{l.destination || '—'}</p></td>
                <td className="px-4 py-3"><Badge className={statusMeta(l.status).color}>{statusMeta(l.status).label}</Badge></td>
                <td className="px-4 py-3">{l.assignedTo?.name || <span className="text-slate-400">Unassigned</span>}</td>
                <td className={`px-4 py-3 ${overdue ? 'font-semibold text-rose-600' : ''}`}>{l.followUpDate ? fmtDate(l.followUpDate) : '—'}</td>
                <td className="px-4 py-3 text-slate-500" title={new Date(l.createdAt).toLocaleString()}>{timeAgo(l.createdAt)}<p className="text-xs capitalize text-slate-400">{(l.source || '').replace(/[_:]/g, ' ')}</p></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function KanbanCard({ lead }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: lead._id, data: { lead } });
  const style = transform ? { transform: `translate(${transform.x}px, ${transform.y}px)`, zIndex: 50 } : undefined;
  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes} className={`cursor-grab touch-none rounded-xl border border-slate-100 bg-white p-3 shadow-sm active:cursor-grabbing ${isDragging ? 'shadow-lift ring-2 ring-navy-700' : ''}`}>
      <Link to={`/admin/leads/${lead._id}`} onPointerDown={(e) => e.stopPropagation()} className="text-sm font-semibold text-navy-900 hover:underline">{lead.fullName}</Link>
      <p className="text-xs text-slate-500">{serviceLabel(lead.service)}{lead.destination ? ` · ${lead.destination}` : ''}</p>
      <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
        <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{lead.phone}</span>
        {lead.followUpDate && <span className="flex items-center gap-1"><CalendarClock className="h-3 w-3" />{fmtDate(lead.followUpDate, { day: 'numeric', month: 'short' })}</span>}
      </div>
      {lead.assignedTo && <p className="mt-1 text-[11px] text-navy-700">{lead.assignedTo.name}</p>}
    </div>
  );
}

function KanbanColumn({ col }) {
  const { setNodeRef, isOver } = useDroppable({ id: col.status });
  const meta = statusMeta(col.status);
  return (
    <div ref={setNodeRef} className={`flex w-72 shrink-0 flex-col rounded-2xl bg-slate-100/80 p-2 transition ${isOver ? 'ring-2 ring-navy-700' : ''}`}>
      <div className="flex items-center justify-between px-2 py-2"><span className="flex items-center gap-2 text-sm font-bold text-navy-900"><span className={`h-2 w-2 rounded-full ${meta.dot}`} />{meta.label}</span><span className="rounded-full bg-white px-2 text-xs font-semibold text-slate-500">{col.total}</span></div>
      <div className="flex max-h-[65vh] min-h-24 flex-col gap-2 overflow-y-auto p-1">
        {col.items.map((l) => <KanbanCard key={l._id} lead={l} />)}
        {col.total > col.items.length && <p className="py-1 text-center text-[11px] text-slate-400">+{col.total - col.items.length} more — use the list view</p>}
      </div>
    </div>
  );
}

function Kanban({ params }) {
  const qc = useQueryClient();
  const toast = useToast();
  const { data, isLoading, error, refetch } = useQuery({ queryKey: ['leads', 'board', params], queryFn: () => getData('/admin/leads/board', params) });
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }), useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 6 } }));
  const move = useMutation({
    mutationFn: ({ id, status }) => api.patch(`/admin/leads/${id}`, { status }),
    onMutate: async ({ id, status }) => {
      const key = ['leads', 'board', params];
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData(key);
      qc.setQueryData(key, (cols) => {
        const lead = cols.flatMap((c) => c.items).find((l) => l._id === id);
        return cols.map((c) => (c.status === status ? { ...c, total: c.total + 1, items: [{ ...lead, status }, ...c.items] } : c.items.some((l) => l._id === id) ? { ...c, total: c.total - 1, items: c.items.filter((l) => l._id !== id) } : c));
      });
      return { prev, key };
    },
    onError: (e, _v, ctx) => { qc.setQueryData(ctx.key, ctx.prev); toast(e.message, 'error'); },
    onSuccess: () => toast('Status updated'),
    onSettled: () => qc.invalidateQueries({ queryKey: ['leads'] }),
  });
  if (error) return <ErrorState error={error} onRetry={refetch} />;
  if (isLoading) return <div className="flex gap-3 overflow-hidden">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-96 w-72 shrink-0" />)}</div>;
  const onDragEnd = ({ active, over }) => {
    if (!over) return;
    const lead = active.data.current.lead;
    if (lead.status === over.id) return;
    if (over.id === 'converted') { toast('Open the lead and use “Convert to client” to convert it.', 'error'); return; }
    move.mutate({ id: lead._id, status: over.id });
  };
  return (
    <DndContext sensors={sensors} onDragEnd={onDragEnd}>
      <div className="flex gap-3 overflow-x-auto pb-4">{data.map((col) => <KanbanColumn key={col.status} col={col} />)}</div>
    </DndContext>
  );
}

export default function LeadsPage() {
  const { can } = useAuth();
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const [adding, setAdding] = useState(false);
  const [view, setView] = useState(() => { try { return localStorage.getItem('lnpak_leads_view') || 'table'; } catch { return 'table'; } });
  const staff = useStaffOptions(can('leads:read_all'));
  const filters = Object.fromEntries([...params.entries()].filter(([k]) => FILTER_KEYS.includes(k) || k === 'page'));
  const set = (k, v) => { const p = new URLSearchParams(params); if (v) p.set(k, v); else p.delete(k); if (k !== 'page') p.delete('page'); setParams(p, { replace: true }); };
  const clear = () => setParams({}, { replace: true });
  const switchView = (v) => { setView(v); try { localStorage.setItem('lnpak_leads_view', v); } catch { /* ignore */ } };

  const list = useQuery({ queryKey: ['leads', 'list', filters], queryFn: () => get('/admin/leads', { ...filters, limit: 25 }), placeholderData: keepPreviousData, enabled: view === 'table' });
  const exportAs = async (format) => {
    try { await download('/admin/leads/export', { ...filters, format }, `lnpak-leads.${format}`); } catch (e) { toast(e.message, 'error'); }
  };

  return (
    <>
      <PageHeader
        title="Leads & Inquiries"
        subtitle="Every website form submission lands here automatically."
        actions={<>
          <div className="flex rounded-full bg-white p-1 shadow-card" role="tablist">
            <button onClick={() => switchView('table')} className={`btn-sm btn ${view === 'table' ? 'bg-navy-900 text-white' : 'text-slate-600'}`} aria-pressed={view === 'table'}><LayoutList className="h-4 w-4" />List</button>
            <button onClick={() => switchView('kanban')} className={`btn-sm btn ${view === 'kanban' ? 'bg-navy-900 text-white' : 'text-slate-600'}`} aria-pressed={view === 'kanban'}><Columns3 className="h-4 w-4" />Kanban</button>
          </div>
          {can('leads:export') && <><button className="btn-outline btn-sm" onClick={() => exportAs('csv')}><Download className="h-4 w-4" />CSV</button><button className="btn-outline btn-sm" onClick={() => exportAs('xlsx')}><Download className="h-4 w-4" />Excel</button></>}
          {can('leads:write') && <button className="btn-primary btn-sm" onClick={() => setAdding(true)}><Plus className="h-4 w-4" />Add lead</button>}
        </>}
      />
      <Filters filters={filters} set={set} clear={clear} staff={can('leads:read_all') ? staff.data : null} />
      {view === 'kanban' ? <Kanban params={Object.fromEntries(Object.entries(filters).filter(([k]) => k !== 'status' && k !== 'page'))} /> : list.error ? <ErrorState error={list.error} onRetry={list.refetch} /> : list.isLoading ? <Skeleton className="h-96" /> : list.data.data.length === 0 ? (
        <EmptyState title="No leads found" text={Object.keys(filters).length ? 'Try clearing some filters.' : 'New website inquiries will appear here.'} />
      ) : (
        <div className={list.isFetching ? 'opacity-70' : ''}>
          <LeadTable items={list.data.data} />
          <Pagination meta={list.data.meta} onPage={(p) => set('page', String(p))} />
        </div>
      )}
      <AddLeadModal open={adding} onClose={() => setAdding(false)} />
    </>
  );
}
