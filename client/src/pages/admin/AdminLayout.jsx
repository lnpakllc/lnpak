import { Suspense, useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  LayoutDashboard, Users, UserCheck, Briefcase, Globe2, Plane, GraduationCap, Award, MessageSquareQuote, HelpCircle, Video, Mail,
  UserCog, ShieldCheck, Settings, ScrollText, Bell, Search, Menu, ChevronsLeft, LogOut, UserCircle2, ExternalLink, ChevronRight,
} from 'lucide-react';
import { api, get } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { roleLabel, timeAgo } from '../../lib/constants';
import { PageLoader } from '../../components/ui';

const MENU = [
  { group: 'CRM', items: [
    ['/admin', 'Dashboard', LayoutDashboard, 'dashboard:view', true],
    ['/admin/leads', 'Leads & Inquiries', Users, 'leads:read'],
    ['/admin/clients', 'Clients', UserCheck, 'clients:read'],
  ] },
  { group: 'Website', items: [
    ['/admin/content/services', 'Services', Briefcase, 'content:manage'],
    ['/admin/content/countries', 'Countries & Visas', Globe2, 'content:manage'],
    ['/admin/content/tours', 'Tour Packages', Plane, 'content:manage'],
    ['/admin/content/universities', 'Universities', GraduationCap, 'content:manage'],
    ['/admin/content/scholarships', 'Scholarships', Award, 'content:manage'],
    ['/admin/content/videos', 'Videos & Reels', Video, 'content:manage'],
    ['/admin/content/testimonials', 'Testimonials', MessageSquareQuote, 'content:manage'],
    ['/admin/content/faqs', 'FAQs', HelpCircle, 'content:manage'],
    ['/admin/newsletter', 'Newsletter', Mail, 'newsletter:manage'],
    ['/admin/settings', 'Site Settings', Settings, 'settings:manage'],
  ] },
  { group: 'Team', items: [
    ['/admin/staff', 'Staff', UserCog, 'staff:manage'],
    ['/admin/roles', 'Roles & Permissions', ShieldCheck, ['roles:manage', 'staff:manage']],
    ['/admin/audit', 'Audit Log', ScrollText, 'audit:view'],
  ] },
];

function NotificationBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const nav = useNavigate();
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ['notifications', 'bell'], queryFn: () => get('/notifications', { limit: 8 }), refetchInterval: 60000 });
  useEffect(() => {
    const close = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);
  const unread = data?.meta?.unread || 0;
  const openItem = async (n) => {
    setOpen(false);
    if (!n.read) { await api.post(`/notifications/${n._id}/read`); qc.invalidateQueries({ queryKey: ['notifications'] }); }
    if (n.link) nav(n.link);
  };
  const readAll = async () => { await api.post('/notifications/all/read'); qc.invalidateQueries({ queryKey: ['notifications'] }); };
  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen((o) => !o)} className="relative rounded-full p-2 text-slate-600 hover:bg-slate-100" aria-label={`Notifications (${unread} unread)`}>
        <Bell className="h-5 w-5" />
        {unread > 0 && <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">{unread > 9 ? '9+' : unread}</span>}
      </button>
      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-lift">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3"><p className="font-bold text-navy-900">Notifications</p>{unread > 0 && <button onClick={readAll} className="text-xs font-semibold text-navy-700">Mark all read</button>}</div>
          <div className="max-h-96 overflow-y-auto">
            {(data?.data || []).length === 0 ? <p className="px-4 py-8 text-center text-sm text-slate-400">No notifications yet</p> : data.data.map((n) => (
              <button key={n._id} onClick={() => openItem(n)} className={`block w-full border-b border-slate-50 px-4 py-3 text-left hover:bg-slate-50 ${n.read ? '' : 'bg-sky-50/60'}`}>
                <p className="text-sm font-semibold text-navy-900">{n.title}</p>
                {n.body && <p className="truncate text-xs text-slate-500">{n.body}</p>}
                <p className="mt-0.5 text-[11px] text-slate-400">{timeAgo(n.createdAt)}</p>
              </button>
            ))}
          </div>
          <Link to="/admin/notifications" onClick={() => setOpen(false)} className="block bg-slate-50 py-2.5 text-center text-xs font-semibold text-navy-700">View all</Link>
        </div>
      )}
    </div>
  );
}

function Breadcrumbs() {
  const { pathname } = useLocation();
  const parts = pathname.split('/').filter(Boolean).slice(1);
  if (!parts.length) return null;
  return (
    <nav className="hidden items-center gap-1 text-xs text-slate-500 md:flex" aria-label="Breadcrumb">
      <Link to="/admin" className="hover:text-navy-900">Admin</Link>
      {parts.map((p, i) => (
        <span key={i} className="flex items-center gap-1"><ChevronRight className="h-3 w-3" />
          {i < parts.length - 1 ? <Link className="capitalize hover:text-navy-900" to={`/admin/${parts.slice(0, i + 1).join('/')}`}>{p}</Link> : <span className="capitalize">{/^[a-f0-9]{24}$/.test(p) ? 'Details' : p.replace(/-/g, ' ')}</span>}
        </span>
      ))}
    </nav>
  );
}

export default function AdminLayout() {
  const { user, can, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(() => { try { return localStorage.getItem('lnpak_sidebar') === '1'; } catch { return false; } });
  const [mobile, setMobile] = useState(false);
  const [menu, setMenu] = useState(false);
  const [q, setQ] = useState('');
  const nav = useNavigate();
  const location = useLocation();
  useEffect(() => { setMobile(false); }, [location.pathname]);
  useEffect(() => { try { localStorage.setItem('lnpak_sidebar', collapsed ? '1' : '0'); } catch { /* ignore */ } }, [collapsed]);

  const search = (e) => { e.preventDefault(); if (q.trim()) nav(`/admin/${can('leads:read') ? 'leads' : 'clients'}?q=${encodeURIComponent(q.trim())}`); };
  const doLogout = async () => { await logout(); nav('/admin/login'); };

  const sidebar = (
    <aside className={`flex h-full flex-col bg-navy-950 text-white transition-all ${collapsed ? 'lg:w-[76px]' : 'lg:w-64'} w-72`}>
      <div className="flex h-16 items-center gap-3 px-4">
        <img src="/logo.jpg" alt="LN PAK LLC" className="h-10 w-10 shrink-0 rounded-lg bg-white object-contain p-0.5" />
        {!collapsed && <div className="leading-tight"><p className="font-serif text-lg font-bold">LN PAK LLC</p><p className="text-[10px] uppercase tracking-widest text-white/50">Admin CRM</p></div>}
      </div>
      <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4" aria-label="Admin">
        {MENU.map((g) => {
          const items = g.items.filter(([, , , perm]) => can(...[].concat(perm)));
          if (!items.length) return null;
          return (
            <div key={g.group}>
              {!collapsed && <p className="mb-1.5 px-3 text-[10px] font-bold uppercase tracking-widest text-white/40">{g.group}</p>}
              {items.map(([to, label, I, , end]) => (
                <NavLink key={to} to={to} end={end} title={collapsed ? label : undefined}
                  className={({ isActive }) => `mb-0.5 flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition ${isActive ? 'bg-white text-navy-950' : 'text-white/75 hover:bg-white/10 hover:text-white'} ${collapsed ? 'lg:justify-center' : ''}`}>
                  <I className="h-[18px] w-[18px] shrink-0" />{(!collapsed || mobile) && <span>{label}</span>}
                </NavLink>
              ))}
            </div>
          );
        })}
      </nav>
      <button onClick={() => setCollapsed((c) => !c)} className="hidden items-center gap-2 border-t border-white/10 px-6 py-3 text-xs text-white/60 hover:text-white lg:flex">
        <ChevronsLeft className={`h-4 w-4 transition ${collapsed ? 'rotate-180' : ''}`} />{!collapsed && 'Collapse'}
      </button>
    </aside>
  );

  return (
    <div className="flex h-screen bg-slate-50">
      <div className="hidden shrink-0 lg:block">{sidebar}</div>
      {mobile && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="h-full">{sidebar}</div>
          <button className="flex-1 bg-navy-950/50" onClick={() => setMobile(false)} aria-label="Close menu" />
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center gap-3 border-b border-slate-200 bg-white px-4 sm:px-6">
          <button className="rounded-lg p-2 hover:bg-slate-100 lg:hidden" onClick={() => setMobile(true)} aria-label="Open menu"><Menu className="h-5 w-5" /></button>
          <form onSubmit={search} className="relative max-w-md flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input value={q} onChange={(e) => setQ(e.target.value)} className="input rounded-full bg-slate-50 py-2 pl-9" placeholder="Search leads by name, email, phone, ID…" aria-label="Global search" />
          </form>
          <div className="ml-auto flex items-center gap-1">
            <a href="/" target="_blank" rel="noreferrer" className="hidden rounded-full p-2 text-slate-600 hover:bg-slate-100 sm:block" title="Open website"><ExternalLink className="h-5 w-5" /></a>
            <NotificationBell />
            <div className="relative">
              <button onClick={() => setMenu((m) => !m)} className="flex items-center gap-2 rounded-full py-1 pl-1 pr-3 hover:bg-slate-100" aria-expanded={menu}>
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-navy-900 text-sm font-bold text-white">{user?.name?.[0]?.toUpperCase()}</span>
                <span className="hidden text-left leading-tight sm:block"><span className="block text-sm font-semibold text-navy-900">{user?.name}</span><span className="block text-[11px] text-slate-500">{roleLabel(user?.role)}</span></span>
              </button>
              {menu && (
                <div className="absolute right-0 z-50 mt-2 w-48 rounded-2xl border border-slate-100 bg-white p-1.5 shadow-lift" onMouseLeave={() => setMenu(false)}>
                  <Link to="/admin/profile" onClick={() => setMenu(false)} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm hover:bg-slate-50"><UserCircle2 className="h-4 w-4" />My profile</Link>
                  <button onClick={doLogout} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-rose-600 hover:bg-rose-50"><LogOut className="h-4 w-4" />Sign out</button>
                </div>
              )}
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6">
            <Breadcrumbs />
            <Suspense fallback={<PageLoader />}><Outlet /></Suspense>
          </div>
        </main>
      </div>
    </div>
  );
}

export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="mb-6 mt-2 flex flex-wrap items-end justify-between gap-4">
      <div><h1 className="text-2xl">{title}</h1>{subtitle && <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>}</div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}
