import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { lazy, Suspense } from 'react';
import { Users, UserPlus, UserCheck, CalendarClock, AlertTriangle, TrendingUp, Mail, Inbox } from 'lucide-react';
import { getData } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { serviceLabel, statusMeta, timeAgo } from '../../lib/constants';
import { Skeleton, ErrorState, Badge, EmptyState } from '../../components/ui';
import { PageHeader } from './AdminLayout';

const Charts = lazy(() => import('./DashboardCharts'));

function Stat({ icon: I, label, value, tone = 'bg-navy-50 text-navy-900', to }) {
  const body = (
    <div className="card flex items-center gap-4 p-5 transition hover:shadow-lift">
      <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${tone}`}><I className="h-6 w-6" /></span>
      <div><p className="text-2xl font-extrabold text-navy-900">{value ?? '—'}</p><p className="text-xs font-medium text-slate-500">{label}</p></div>
    </div>
  );
  return to ? <Link to={to}>{body}</Link> : body;
}

export default function Dashboard() {
  const { user } = useAuth();
  const { data, isLoading, error, refetch } = useQuery({ queryKey: ['dashboard'], queryFn: () => getData('/admin/dashboard'), refetchInterval: 120000 });
  if (error) return <ErrorState error={error} onRetry={refetch} />;
  const c = data?.cards || {};
  return (
    <>
      <PageHeader title={`Welcome back, ${user?.name?.split(' ')[0] || ''}`} subtitle={data?.scope === 'assigned' ? 'Figures below cover the leads and clients assigned to you.' : 'Live overview from your CRM.'} />
      {isLoading ? <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-24" />)}</div> : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Stat icon={Users} label="Total leads" value={c.totalLeads} to="/admin/leads" />
          <Stat icon={Inbox} label="New (not yet contacted)" value={c.newLeads} tone="bg-sky-50 text-sky-700" to="/admin/leads?status=new" />
          <Stat icon={UserPlus} label="Leads today" value={c.leadsToday} tone="bg-violet-50 text-violet-700" />
          <Stat icon={TrendingUp} label="Conversion rate" value={`${c.conversionRate ?? 0}%`} tone="bg-emerald-50 text-emerald-700" />
          <Stat icon={CalendarClock} label="Follow-ups due today" value={c.followUpsToday} tone="bg-amber-50 text-amber-700" to="/admin/leads?followUp=today" />
          <Stat icon={AlertTriangle} label="Overdue follow-ups" value={c.overdueFollowUps} tone="bg-rose-50 text-rose-700" to="/admin/leads?followUp=overdue" />
          <Stat icon={UserCheck} label="Active clients" value={`${c.activeClients ?? 0} / ${c.totalClients ?? 0}`} tone="bg-emerald-50 text-emerald-700" to="/admin/clients" />
          {c.subscribers != null && <Stat icon={Mail} label="Newsletter subscribers" value={c.subscribers} to="/admin/newsletter" />}
        </div>
      )}

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <Suspense fallback={<Skeleton className="h-80" />}>{data && <Charts charts={data.charts} />}</Suspense>
        </div>
        <div className="card p-5">
          <div className="mb-3 flex items-center justify-between"><h2 className="text-base">Latest leads</h2><Link to="/admin/leads" className="text-xs font-semibold text-navy-700">View all</Link></div>
          {isLoading ? <Skeleton className="h-60" /> : data.recentLeads.length === 0 ? <EmptyState title="No leads yet" text="Website inquiries will appear here instantly." /> : (
            <ul className="divide-y divide-slate-100">
              {data.recentLeads.map((l) => (
                <li key={l._id}><Link to={`/admin/leads/${l._id}`} className="flex items-center justify-between gap-3 py-3 hover:bg-slate-50">
                  <div className="min-w-0"><p className="truncate text-sm font-semibold text-navy-900">{l.fullName}</p><p className="truncate text-xs text-slate-500">{serviceLabel(l.service)}{l.destination ? ` · ${l.destination}` : ''} · {timeAgo(l.createdAt)}</p></div>
                  <Badge className={statusMeta(l.status).color}>{statusMeta(l.status).label}</Badge>
                </Link></li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <p className="mt-6 text-xs text-slate-400">Application, payment and booking figures will appear here once those modules are added (next phase).</p>
    </>
  );
}
