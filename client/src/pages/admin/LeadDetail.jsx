import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Phone, Mail, MessageCircle, MapPin, Globe2, Link2, Trash2, UserCheck, Send, Copy, ArrowLeft, Megaphone } from 'lucide-react';
import { api, getData } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { LEAD_STATUSES, PRIORITIES, SERVICES, serviceLabel, statusMeta, fmtDateTime, timeAgo, whatsappLink } from '../../lib/constants';
import { Badge, PageLoader, ErrorState, Field, ConfirmModal, Modal, Spinner } from '../../components/ui';
import { useStaffOptions } from './LeadsPage';

function ConvertModal({ lead, open, onClose }) {
  const staff = useStaffOptions(open);
  const qc = useQueryClient();
  const toast = useToast();
  const [portal, setPortal] = useState(!!lead.email);
  const [consultant, setConsultant] = useState(lead.assignedTo?._id || '');
  const [result, setResult] = useState(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const go = async () => {
    setBusy(true); setErr('');
    try {
      const r = await api.post(`/admin/leads/${lead._id}/convert`, { createPortalAccess: portal, ...(consultant && { assignedConsultant: consultant }) });
      setResult(r.data.data);
      qc.invalidateQueries({ queryKey: ['leads'] });
      qc.invalidateQueries({ queryKey: ['lead', lead._id] });
      toast(`Converted to client ${r.data.data.client.code}`);
    } catch (e) { setErr(e.message); } finally { setBusy(false); }
  };
  return (
    <Modal open={open} onClose={onClose} title="Convert lead to client">
      {result ? (
        <div className="space-y-4 text-sm">
          <p className="rounded-xl bg-emerald-50 p-4 text-emerald-800">Client <strong>{result.client.code}</strong> created.</p>
          {result.portalInviteLink && (
            <div>
              <p className="mb-2 text-slate-600">An invitation email is sent when email (SMTP) is configured. You can also share this one-time link with the client (valid 7 days):</p>
              <div className="flex gap-2"><input readOnly value={result.portalInviteLink} className="input text-xs" /><button className="btn-outline btn-sm" onClick={() => { navigator.clipboard.writeText(result.portalInviteLink); toast('Link copied'); }}><Copy className="h-4 w-4" /></button></div>
            </div>
          )}
          <div className="flex justify-end gap-2"><Link to={`/admin/clients/${result.client._id}`} className="btn-primary">Open client</Link></div>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-slate-600">This creates a client record for <strong>{lead.fullName}</strong> and marks the lead as converted.</p>
          <Field label="Assigned consultant"><select className="input" value={consultant} onChange={(e) => setConsultant(e.target.value)}><option value="">Me</option>{(staff.data || []).map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}</select></Field>
          <label className={`flex items-start gap-3 rounded-xl border p-3 text-sm ${lead.email ? 'border-slate-200' : 'border-slate-100 opacity-60'}`}>
            <input type="checkbox" className="mt-0.5 h-4 w-4 accent-navy-900" checked={portal} disabled={!lead.email} onChange={(e) => setPortal(e.target.checked)} />
            <span><strong className="block text-navy-900">Give client portal access</strong>{lead.email ? `A secure set-password link is created for ${lead.email}.` : 'Add an email to this lead first.'}</span>
          </label>
          {err && <p className="field-error">{err}</p>}
          <div className="flex justify-end gap-2"><button className="btn-ghost" onClick={onClose}>Cancel</button><button className="btn-primary" onClick={go} disabled={busy}>{busy && <Spinner className="h-4 w-4 text-white" />}Convert to client</button></div>
        </div>
      )}
    </Modal>
  );
}

export default function LeadDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const { can } = useAuth();
  const toast = useToast();
  const qc = useQueryClient();
  const staff = useStaffOptions(can('leads:assign'));
  const [note, setNote] = useState('');
  const [convert, setConvert] = useState(false);
  const [del, setDel] = useState(false);
  const { data: lead, isLoading, error, refetch } = useQuery({ queryKey: ['lead', id], queryFn: () => getData(`/admin/leads/${id}`), retry: false });

  const update = useMutation({
    mutationFn: (body) => api.patch(`/admin/leads/${id}`, body),
    onSuccess: () => { toast('Lead updated'); qc.invalidateQueries({ queryKey: ['lead', id] }); qc.invalidateQueries({ queryKey: ['leads'] }); qc.invalidateQueries({ queryKey: ['dashboard'] }); },
    onError: (e) => toast(e.message, 'error'),
  });
  const addNote = useMutation({
    mutationFn: () => api.post(`/admin/leads/${id}/notes`, { text: note }),
    onSuccess: () => { setNote(''); qc.invalidateQueries({ queryKey: ['lead', id] }); },
    onError: (e) => toast(e.message, 'error'),
  });
  const remove = useMutation({
    mutationFn: () => api.delete(`/admin/leads/${id}`),
    onSuccess: () => { toast('Lead deleted'); qc.invalidateQueries({ queryKey: ['leads'] }); nav('/admin/leads'); },
    onError: (e) => { toast(e.message, 'error'); setDel(false); },
  });

  if (isLoading) return <PageLoader />;
  if (error) return <ErrorState error={error} onRetry={error.status === 404 ? undefined : refetch} />;
  const editable = can('leads:write');
  const st = statusMeta(lead.status);
  const followValue = lead.followUpDate ? new Date(lead.followUpDate).toISOString().slice(0, 10) : '';

  return (
    <>
      <Link to="/admin/leads" className="mb-3 mt-2 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-navy-900"><ArrowLeft className="h-4 w-4" />All leads</Link>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2"><h1 className="text-2xl">{lead.fullName}</h1><Badge className={st.color}>{st.label}</Badge></div>
          <p className="mt-1 text-sm text-slate-500">{lead.code} · received {fmtDateTime(lead.createdAt)} · {serviceLabel(lead.service)}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a href={`tel:${lead.phone}`} className="btn-outline btn-sm"><Phone className="h-4 w-4" />Call</a>
          {(lead.whatsapp || lead.phone) && <a href={whatsappLink(lead.whatsapp || lead.phone, `Hello ${lead.fullName}, this is LN PAK LLC regarding your ${serviceLabel(lead.service)} inquiry.`)} target="_blank" rel="noreferrer" className="btn btn-sm bg-emerald-600 text-white hover:bg-emerald-700"><MessageCircle className="h-4 w-4" />WhatsApp</a>}
          {lead.email && <a href={`mailto:${lead.email}`} className="btn-outline btn-sm"><Mail className="h-4 w-4" />Email</a>}
          {lead.client ? <Link to={`/admin/clients/${lead.client._id}`} className="btn-primary btn-sm"><UserCheck className="h-4 w-4" />Client {lead.client.code}</Link>
            : can('clients:write') && editable && <button className="btn-primary btn-sm" onClick={() => setConvert(true)}><UserCheck className="h-4 w-4" />Convert to client</button>}
          {can('leads:delete') && !lead.client && <button className="btn-ghost btn-sm text-rose-600" onClick={() => setDel(true)} aria-label="Delete lead"><Trash2 className="h-4 w-4" /></button>}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <div className="card grid gap-5 p-5 sm:grid-cols-2">
            {[[Phone, 'Phone', lead.phone], [MessageCircle, 'WhatsApp', lead.whatsapp], [Mail, 'Email', lead.email], [MapPin, 'Lives in', lead.country], [Globe2, 'Destination', lead.destination], [Link2, 'Asked about', lead.reference?.title], [Megaphone, 'Source', [lead.source, lead.utm?.campaign && `campaign: ${lead.utm.campaign}`].filter(Boolean).join(' · ')], [Link2, 'Form / page', [lead.formType, lead.sourcePage].filter(Boolean).join(' · ')]].map(([I, l, v]) => (
              <div key={l} className="flex gap-3"><I className="mt-0.5 h-4 w-4 shrink-0 text-navy-700" /><div className="min-w-0"><p className="text-xs text-slate-500">{l}</p><p className="break-words font-medium text-navy-900">{v || '—'}</p></div></div>
            ))}
            {lead.message && <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-700 sm:col-span-2"><p className="mb-1 text-xs font-semibold text-slate-500">Message</p><p className="whitespace-pre-wrap">{lead.message}</p></div>}
          </div>

          <div className="card p-5">
            <h2 className="mb-4 text-base">Internal notes <span className="text-xs font-normal text-slate-400">(staff only)</span></h2>
            {editable && (
              <form onSubmit={(e) => { e.preventDefault(); if (note.trim()) addNote.mutate(); }} className="mb-5 flex gap-2">
                <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} className="input" placeholder="Call summary, next steps…" />
                <button className="btn-primary self-end" disabled={addNote.isPending || !note.trim()} aria-label="Add note">{addNote.isPending ? <Spinner className="h-4 w-4 text-white" /> : <Send className="h-4 w-4" />}</button>
              </form>
            )}
            {lead.notes.length === 0 ? <p className="text-sm text-slate-400">No notes yet.</p> : (
              <ul className="space-y-3">{[...lead.notes].reverse().map((n) => <li key={n._id} className="rounded-xl border border-slate-100 p-3"><p className="whitespace-pre-wrap text-sm">{n.text}</p><p className="mt-1 text-xs text-slate-400">{n.author?.name || 'Staff'} · {fmtDateTime(n.createdAt)}</p></li>)}</ul>
            )}
          </div>

          <div className="card p-5">
            <h2 className="mb-4 text-base">Activity history</h2>
            <ol className="relative space-y-4 border-l border-slate-200 pl-5">
              {[...lead.activity].reverse().map((a) => (
                <li key={a._id} className="relative"><span className="absolute -left-[25px] top-1.5 h-2.5 w-2.5 rounded-full bg-navy-700 ring-4 ring-white" />
                  <p className="text-sm text-navy-900">{a.message || a.action}</p><p className="text-xs text-slate-400">{a.by?.name ? `${a.by.name} · ` : ''}{timeAgo(a.createdAt)}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>

        <aside className="space-y-4">
          <div className="card space-y-4 p-5">
            <h2 className="text-base">Manage lead</h2>
            <Field label="Status">
              <select className="input" value={lead.status} disabled={!editable || update.isPending} onChange={(e) => (e.target.value === 'converted' ? setConvert(true) : update.mutate({ status: e.target.value }))}>
                {LEAD_STATUSES.map((s) => <option key={s.value} value={s.value} disabled={s.value === 'converted' && !lead.client && !can('clients:write')}>{s.label}</option>)}
              </select>
            </Field>
            <Field label="Priority"><select className="input" value={lead.priority} disabled={!editable} onChange={(e) => update.mutate({ priority: e.target.value })}>{PRIORITIES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}</select></Field>
            <Field label="Follow-up date">
              <div className="flex gap-2"><input type="date" className="input" value={followValue} disabled={!editable} onChange={(e) => update.mutate({ followUpDate: e.target.value || null })} />{followValue && editable && <button className="btn-ghost btn-sm" onClick={() => update.mutate({ followUpDate: null })}>Clear</button>}</div>
            </Field>
            <Field label="Assigned to">
              {can('leads:assign') ? (
                <select className="input" value={lead.assignedTo?._id || ''} onChange={(e) => update.mutate({ assignedTo: e.target.value || null })}>
                  <option value="">— Unassigned —</option>{(staff.data || []).map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
                </select>
              ) : <p className="text-sm font-medium text-navy-900">{lead.assignedTo?.name || 'Unassigned'}</p>}
            </Field>
            <Field label="Service"><select className="input" value={lead.service} disabled={!editable} onChange={(e) => update.mutate({ service: e.target.value })}>{SERVICES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}</select></Field>
          </div>
        </aside>
      </div>

      {convert && <ConvertModal lead={lead} open={convert} onClose={() => setConvert(false)} />}
      <ConfirmModal open={del} onClose={() => setDel(false)} onConfirm={() => remove.mutate()} loading={remove.isPending} danger title="Delete this lead?" text="The lead, its notes and history will be removed permanently." confirmText="Delete" />
    </>
  );
}
