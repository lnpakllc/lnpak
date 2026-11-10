import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar, Legend } from 'recharts';
import { serviceLabel, statusMeta } from '../../lib/constants';
import { EmptyState } from '../../components/ui';

const NAVY = '#082d50';
const BLUE = '#145a91';
const GOLD = '#f5b52e';

function Panel({ title, children, className = '' }) {
  return <div className={`card p-5 ${className}`}><h2 className="mb-4 text-base">{title}</h2>{children}</div>;
}

const tooltipStyle = { borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 };

export default function DashboardCharts({ charts }) {
  const services = charts.byService.map((s) => ({ name: serviceLabel(s.service), count: s.count }));
  const statuses = charts.byStatus.map((s) => ({ name: statusMeta(s.status).label, count: s.count }));
  const hasData = charts.byMonth.some((m) => m.leads > 0);
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Panel title="Leads by month (last 12 months)" className="md:col-span-2">
        {!hasData ? <EmptyState title="No leads yet" /> : (
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={charts.byMonth} margin={{ left: -20, right: 8 }}>
              <defs><linearGradient id="g1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={BLUE} stopOpacity={0.35} /><stop offset="100%" stopColor={BLUE} stopOpacity={0} /></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Area type="monotone" dataKey="leads" name="Leads" stroke={BLUE} strokeWidth={2} fill="url(#g1)" />
              <Area type="monotone" dataKey="converted" name="Converted" stroke={GOLD} strokeWidth={2} fill="transparent" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </Panel>
      <Panel title="Leads by service">
        {!services.length ? <EmptyState title="No data yet" /> : (
          <ResponsiveContainer width="100%" height={Math.max(180, services.length * 34)}>
            <BarChart data={services} layout="vertical" margin={{ left: 10, right: 16 }}>
              <XAxis type="number" allowDecimals={false} hide />
              <YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: '#f4f8fc' }} />
              <Bar dataKey="count" name="Leads" fill={NAVY} radius={[0, 6, 6, 0]} barSize={16} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </Panel>
      <Panel title="Lead status">
        {!statuses.length ? <EmptyState title="No data yet" /> : (
          <ResponsiveContainer width="100%" height={Math.max(180, statuses.length * 34)}>
            <BarChart data={statuses} layout="vertical" margin={{ left: 10, right: 16 }}>
              <XAxis type="number" allowDecimals={false} hide />
              <YAxis type="category" dataKey="name" width={150} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: '#f4f8fc' }} />
              <Bar dataKey="count" name="Leads" fill={BLUE} radius={[0, 6, 6, 0]} barSize={16} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </Panel>
      <Panel title="Top destinations">
        {!charts.byDestination.length ? <EmptyState title="No data yet" /> : (
          <ul className="space-y-2.5">
            {charts.byDestination.map((d) => {
              const max = charts.byDestination[0].count;
              return <li key={d.destination}><div className="mb-1 flex justify-between text-sm"><span>{d.destination}</span><strong className="text-navy-900">{d.count}</strong></div><div className="h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-navy-700" style={{ width: `${(d.count / max) * 100}%` }} /></div></li>;
            })}
          </ul>
        )}
      </Panel>
      <Panel title={charts.staffPerformance.length ? 'Staff performance' : 'Lead sources'}>
        {charts.staffPerformance.length ? (
          <div className="overflow-x-auto"><table className="w-full text-sm">
            <thead className="text-left text-xs text-slate-500"><tr><th className="pb-2">Staff</th><th className="pb-2 text-right">Assigned</th><th className="pb-2 text-right">Open</th><th className="pb-2 text-right">Converted</th></tr></thead>
            <tbody className="divide-y divide-slate-100">{charts.staffPerformance.map((s) => <tr key={s.name}><td className="py-2 font-medium text-navy-900">{s.name}</td><td className="py-2 text-right">{s.assigned}</td><td className="py-2 text-right">{s.open}</td><td className="py-2 text-right font-bold text-emerald-700">{s.converted}</td></tr>)}</tbody>
          </table></div>
        ) : !charts.bySource.length ? <EmptyState title="No data yet" /> : (
          <ul className="space-y-2 text-sm">{charts.bySource.map((s) => <li key={s.source} className="flex justify-between"><span className="capitalize">{s.source.replace(/[_:]/g, ' ')}</span><strong>{s.count}</strong></li>)}</ul>
        )}
      </Panel>
    </div>
  );
}
