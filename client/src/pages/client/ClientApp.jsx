import { useState } from 'react';
import { Routes, Route, Navigate, NavLink, Link, useLocation, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { LayoutDashboard, MessageSquarePlus, UserCircle2, Bell, LogOut, Phone, Mail, MessageCircle, ClipboardList, Send } from 'lucide-react';
import { api, get, getData } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useSettings } from '../../hooks/useSettings';
import { SERVICES, DESTINATIONS, serviceLabel, fmtDate, timeAgo, whatsappLink } from '../../lib/constants';
import { PageLoader, Seo, Badge, EmptyState, Field, Spinner, Skeleton, ErrorState } from '../../components/ui';
import { LoginPage, RegisterPage, ForgotPasswordPage, ResetPasswordPage } from '../auth/AuthPages';
import { ChangePasswordForm } from '../admin/MiscPages';

// Clients see a simplified status, not the internal sales pipeline.
const CLIENT_STATUS = {
  new: ['Received', 'bg-sky-100 text-sky-800'],
  contacted: ['In progress', 'bg-indigo-100 text-indigo-800'],
  interested: ['In progress', 'bg-indigo-100 text-indigo-800'],
  consultation_scheduled: ['Consultation scheduled', 'bg-cyan-100 text-cyan-800'],
  follow_up_required: ['In progress', 'bg-indigo-100 text-indigo-800'],
  documents_requested: ['Documents requested', 'bg-amber-100 text-amber-800'],
  converted: ['Active case', 'bg-emerald-100 text-emerald-800'],
  not_interested: ['Closed', 'bg-slate-200 text-slate-700'],
  lost: ['Closed', 'bg-slate-200 text-slate-700'],
};

const useOverview = () => useQuery({ queryKey: ['portal'], queryFn: () => getData('/portal/overview') });

function RequireClient({ children }) {
  const { user, isClient, loading } = useAuth();
  const location = useLocation();
  if (loading) return <PageLoader />;
  if (!user) return <Navigate to="/client/login" replace state={{ from: location.pathname }} />;
  if (!isClient) return <div className="flex min-h-screen items-center justify-center p-6 text-center"><div><p className="mb-4">You are signed in as staff.</p><Link to="/admin" className="btn-primary">Go to admin panel</Link></div></div>;
  return children;
}

function Layout({ children }) {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const { data: notif } = useQuery({ queryKey: ['notifications', 'client'], queryFn: () => get('/notifications', { limit: 1 }), refetchInterval: 120000 });
  const links = [['/client', 'Overview', LayoutDashboard, true], ['/client/inquiries', 'My Inquiries', ClipboardList], ['/client/new-inquiry', 'New Inquiry', MessageSquarePlus], ['/client/notifications', 'Notifications', Bell], ['/client/profile', 'My Profile', UserCircle2]];
  const cls = ({ isActive }) => `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${isActive ? 'bg-navy-900 text-white' : 'text-slate-600 hover:bg-navy-50'}`;
  return (
    <div className="min-h-screen bg-navy-50">
      <Seo title="Client Portal" noindex />
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white">
        <div className="container-x flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2"><img src="/logo.jpg" alt="LN PAK LLC" className="h-10" /><span className="font-serif text-lg font-bold text-navy-900">LN PAK LLC</span><span className="hidden rounded-full bg-navy-50 px-2 py-0.5 text-[11px] font-semibold text-navy-700 sm:inline">Client Portal</span></Link>
          <div className="flex items-center gap-3"><span className="hidden text-sm text-slate-600 sm:block">{user?.name}</span><button className="btn-ghost btn-sm" onClick={async () => { await logout(); nav('/client/login'); }}><LogOut className="h-4 w-4" />Sign out</button></div>
        </div>
      </header>
      <div className="container-x grid gap-6 py-6 lg:grid-cols-[230px_1fr]">
        <nav className="flex gap-1 overflow-x-auto lg:flex-col" aria-label="Portal">
          {links.map(([to, l, I, end]) => (
            <NavLink key={to} to={to} end={end} className={cls}><I className="h-4 w-4 shrink-0" /><span className="whitespace-nowrap">{l}</span>{to.endsWith('notifications') && notif?.meta?.unread > 0 && <span className="ml-auto rounded-full bg-rose-500 px-1.5 text-[10px] font-bold text-white">{notif.meta.unread}</span>}</NavLink>
          ))}
        </nav>
        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}

function InquiryList({ items }) {
  if (!items.length) return <EmptyState title="No inquiries yet" text="Send an inquiry and track its progress here." action={<Link to="/client/new-inquiry" className="btn-primary btn-sm">New inquiry</Link>} />;
  return (
    <ul className="space-y-3">
      {items.map((l) => {
        const [label, color] = CLIENT_STATUS[l.status] || ['In progress', 'bg-slate-100'];
        return (
          <li key={l._id} className="card p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div><p className="font-semibold text-navy-900">{serviceLabel(l.service)}{l.destination ? ` — ${l.destination}` : ''}</p><p className="text-xs text-slate-500">Ref {l.code} · sent {fmtDate(l.createdAt)} · updated {timeAgo(l.updatedAt)}</p></div>
              <Badge className={color}>{label}</Badge>
            </div>
            {l.reference?.title && <p className="mt-2 text-sm text-slate-600">About: {l.reference.title}</p>}
            {l.message && <p className="mt-2 line-clamp-3 text-sm text-slate-500">{l.message}</p>}
          </li>
        );
      })}
    </ul>
  );
}

function Overview() {
  const { data, isLoading, error, refetch } = useOverview();
  const s = useSettings();
  if (error) return <ErrorState error={error} onRetry={refetch} />;
  if (isLoading) return <Skeleton className="h-96" />;
  const { client, inquiries, user } = data;
  const open = inquiries.filter((i) => !['not_interested', 'lost'].includes(i.status)).length;
  const consultant = client?.assignedConsultant;
  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-gradient-to-r from-navy-900 to-navy-700 p-6 text-white sm:p-8">
        <p className="text-sm text-white/70">Welcome back,</p>
        <h1 className="text-2xl text-white sm:text-3xl">{client?.fullName || user.name}</h1>
        {client?.code && <p className="mt-1 text-sm text-white/70">Client ID: {client.code}</p>}
        {!client && <p className="mt-3 rounded-xl bg-white/10 p-3 text-sm">Our team is setting up your client profile. You can already send inquiries below.</p>}
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card p-5"><p className="text-3xl font-extrabold text-navy-900">{open}</p><p className="text-sm text-slate-500">Open inquiries</p></div>
        <div className="card p-5"><p className="text-3xl font-extrabold text-navy-900">{inquiries.length}</p><p className="text-sm text-slate-500">Total inquiries</p></div>
        <div className="card p-5"><p className="text-sm font-semibold text-navy-900">{client?.status === 'active' ? 'Active client' : client?.status === 'completed' ? 'Case completed' : 'Profile pending'}</p><p className="text-sm text-slate-500">Account status</p></div>
      </div>
      <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
        <div><div className="mb-3 flex items-center justify-between"><h2 className="text-lg">Recent inquiries</h2><Link to="/client/inquiries" className="text-sm font-semibold text-navy-700">View all</Link></div><InquiryList items={inquiries.slice(0, 4)} /></div>
        <div className="card h-fit p-5">
          <h2 className="mb-3 text-base">{consultant ? 'Your consultant' : 'Contact LN PAK'}</h2>
          {consultant && <p className="mb-3 font-semibold text-navy-900">{consultant.name}</p>}
          <div className="space-y-2 text-sm">
            {(consultant?.phone || s.contact?.phone) && <a className="flex items-center gap-2 text-slate-600 hover:text-navy-900" href={`tel:${consultant?.phone || s.contact.phone}`}><Phone className="h-4 w-4" />{consultant?.phone || s.contact.phone}</a>}
            {(consultant?.email || s.contact?.email) && <a className="flex items-center gap-2 text-slate-600 hover:text-navy-900" href={`mailto:${consultant?.email || s.contact.email}`}><Mail className="h-4 w-4" />{consultant?.email || s.contact.email}</a>}
            {s.contact?.whatsapp && <a className="btn mt-2 w-full bg-emerald-600 text-white hover:bg-emerald-700" href={whatsappLink(s.contact.whatsapp, `Hello, I am client ${client?.code || user.email}.`)} target="_blank" rel="noreferrer"><MessageCircle className="h-4 w-4" />WhatsApp us</a>}
          </div>
        </div>
      </div>
      <p className="text-xs text-slate-400">Application tracking, document upload, invoices and messaging with your consultant are being added to this portal.</p>
    </div>
  );
}

function Inquiries() {
  const { data, isLoading, error, refetch } = useOverview();
  if (error) return <ErrorState error={error} onRetry={refetch} />;
  return <><h1 className="mb-4 text-2xl">My inquiries</h1>{isLoading ? <Skeleton className="h-72" /> : <InquiryList items={data.inquiries} />}</>;
}

function NewInquiry() {
  const toast = useToast();
  const qc = useQueryClient();
  const nav = useNavigate();
  const { register, handleSubmit, formState: { isSubmitting } } = useForm({ defaultValues: { service: 'study_visa' } });
  const [err, setErr] = useState('');
  const submit = async (v) => {
    setErr('');
    try {
      const r = await api.post('/portal/inquiries', { ...v, destination: v.destination || undefined });
      toast(`Inquiry sent — reference ${r.data.data.code}`);
      qc.invalidateQueries({ queryKey: ['portal'] });
      nav('/client/inquiries');
    } catch (e) { setErr(e.message); }
  };
  return (
    <div className="card max-w-2xl p-6">
      <h1 className="text-2xl">New inquiry</h1>
      <p className="mb-5 mt-1 text-sm text-slate-500">Your consultant will reply by phone, WhatsApp or email.</p>
      <form onSubmit={handleSubmit(submit)} className="grid gap-4 sm:grid-cols-2">
        <Field label="Service"><select className="input" {...register('service')}>{SERVICES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}</select></Field>
        <Field label="Destination"><select className="input" {...register('destination')}><option value="">—</option>{DESTINATIONS.map((d) => <option key={d}>{d}</option>)}</select></Field>
        <Field label="What do you need?" className="sm:col-span-2"><textarea rows={5} className="input" {...register('message', { required: true, minLength: 5 })} placeholder="Describe your plans, dates and any questions…" /></Field>
        {err && <p className="field-error sm:col-span-2">{err}</p>}
        <div className="sm:col-span-2"><button className="btn-primary" disabled={isSubmitting}>{isSubmitting ? <Spinner className="h-4 w-4 text-white" /> : <Send className="h-4 w-4" />}Send inquiry</button></div>
      </form>
    </div>
  );
}

function Notifications() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['notifications', 'client', 'list'], queryFn: () => get('/notifications', { limit: 30 }) });
  const readAll = async () => { await api.post('/notifications/all/read'); qc.invalidateQueries({ queryKey: ['notifications'] }); };
  return (
    <>
      <div className="mb-4 flex items-center justify-between"><h1 className="text-2xl">Notifications</h1>{data?.meta?.unread > 0 && <button className="btn-outline btn-sm" onClick={readAll}>Mark all read</button>}</div>
      {isLoading ? <Skeleton className="h-60" /> : data.data.length === 0 ? <EmptyState title="No notifications yet" text="Updates from your consultant will appear here." icon={Bell} /> : (
        <div className="card divide-y divide-slate-100">{data.data.map((n) => <div key={n._id} className={`px-4 py-3 ${n.read ? '' : 'bg-sky-50/60'}`}><p className="text-sm font-semibold text-navy-900">{n.title}</p>{n.body && <p className="text-xs text-slate-500">{n.body}</p>}<p className="text-[11px] text-slate-400">{timeAgo(n.createdAt)}</p></div>)}</div>
      )}
    </>
  );
}

function Profile() {
  const { data, isLoading } = useOverview();
  const toast = useToast();
  const qc = useQueryClient();
  const { refresh } = useAuth();
  const { register, handleSubmit, formState: { isSubmitting } } = useForm({ values: data?.client ? { fullName: data.client.fullName, phone: data.client.phone || '', whatsapp: data.client.whatsapp || '', address: data.client.address || '' } : undefined });
  if (isLoading) return <Skeleton className="h-72" />;
  const save = async (v) => {
    try { await api.patch('/portal/profile', v); qc.invalidateQueries({ queryKey: ['portal'] }); refresh(); toast('Profile updated'); } catch (e) { toast(e.message, 'error'); }
  };
  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <div className="card p-6">
        <h1 className="mb-1 text-xl">My profile</h1>
        <p className="mb-5 text-sm text-slate-500">{data.user.email} <span className="text-xs">(contact us to change your email)</span></p>
        {data.client ? (
          <form onSubmit={handleSubmit(save)} className="space-y-4">
            <Field label="Full name"><input className="input" {...register('fullName', { required: true })} /></Field>
            <Field label="Phone"><input className="input" {...register('phone')} /></Field>
            <Field label="WhatsApp"><input className="input" {...register('whatsapp')} /></Field>
            <Field label="Address"><input className="input" {...register('address')} /></Field>
            <button className="btn-primary" disabled={isSubmitting}>Save</button>
          </form>
        ) : <p className="text-sm text-slate-500">Your profile will be editable once our team has set it up.</p>}
      </div>
      <div className="card p-6"><h2 className="mb-4 text-xl">Change password</h2><ChangePasswordForm /></div>
    </div>
  );
}

export default function ClientApp() {
  return (
    <Routes>
      <Route path="login" element={<LoginPage portal="client" />} />
      <Route path="register" element={<RegisterPage />} />
      <Route path="forgot-password" element={<ForgotPasswordPage portal="client" />} />
      <Route path="reset-password" element={<ResetPasswordPage portal="client" />} />
      <Route path="*" element={
        <RequireClient>
          <Layout>
            <Routes>
              <Route index element={<Overview />} />
              <Route path="inquiries" element={<Inquiries />} />
              <Route path="new-inquiry" element={<NewInquiry />} />
              <Route path="notifications" element={<Notifications />} />
              <Route path="profile" element={<Profile />} />
              <Route path="*" element={<Navigate to="/client" replace />} />
            </Routes>
          </Layout>
        </RequireClient>
      } />
    </Routes>
  );
}

