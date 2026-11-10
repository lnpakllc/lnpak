import { Link } from 'react-router-dom';
import { ArrowRight, Clock, MapPin, CalendarDays, GraduationCap, ExternalLink } from 'lucide-react';
import { Icon, Img, Badge } from '../ui';
import { money, fmtDate, fundingLabel } from '../../lib/constants';
import { useConsult } from '../../context/ConsultContext';

export function ServiceCard({ s, detailed = false }) {
  const consult = useConsult();
  return (
    <div className="card group flex flex-col p-5 transition hover:-translate-y-1 hover:shadow-lift">
      {detailed && s.image && <Img src={s.image} alt={s.title} className="-mx-5 -mt-5 mb-5 h-40 w-[calc(100%+2.5rem)] rounded-t-2xl object-cover" fallbackIcon={s.icon} />}
      <div className={`flex ${detailed ? 'items-center gap-3' : 'flex-col items-center text-center'}`}>
        <span className={`flex items-center justify-center rounded-2xl bg-navy-50 text-navy-900 ${detailed ? 'h-11 w-11' : 'mb-3 h-14 w-14'}`}><Icon name={s.icon} className="h-7 w-7" /></span>
        <h3 className="text-base">{s.title}</h3>
      </div>
      <p className={`mt-2 flex-1 text-sm text-slate-500 ${detailed ? '' : 'text-center'}`}>{s.shortDescription}</p>
      <div className={`mt-4 flex items-center gap-2 ${detailed ? '' : 'justify-center'}`}>
        <Link to={`/services/${s.slug}`} className="btn-outline btn-sm">Learn More</Link>
        <button onClick={() => consult({ service: s.serviceType, formType: 'service_card_apply', title: `Apply for ${s.title}`, reference: { kind: 'service', title: s.title, slug: s.slug } })} className="btn-primary btn-sm">Apply Now</button>
      </div>
    </div>
  );
}

export function TourCard({ t }) {
  return (
    <Link to={`/tours/${t.slug}`} className="card group flex flex-col overflow-hidden transition hover:-translate-y-1 hover:shadow-lift">
      <div className="relative h-44 overflow-hidden">
        <Img src={t.images?.[0]} alt={t.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" fallbackIcon="Plane" />
        {t.availability === 'limited' && <Badge className="absolute left-3 top-3 bg-gold-500 text-navy-950">Limited seats</Badge>}
        {t.availability === 'sold_out' && <Badge className="absolute left-3 top-3 bg-slate-900 text-white">Sold out</Badge>}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="text-base">{t.title}</h3>
        <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
          {t.durationDays ? <><Clock className="h-3.5 w-3.5" />{t.durationDays} Days{t.durationNights ? ` / ${t.durationNights} Nights` : ''}</> : null}
          {t.destination && <><MapPin className="ml-2 h-3.5 w-3.5" />{t.destination}</>}
        </p>
        <div className="mt-auto pt-4">
          {t.price != null ? (
            <span className="inline-flex items-center gap-2 rounded-lg bg-navy-900 px-3 py-1.5 text-sm font-bold text-white">From {money(t.price, t.currency)}<ArrowRight className="h-4 w-4" /></span>
          ) : <span className="btn-outline btn-sm">View package</span>}
        </div>
      </div>
    </Link>
  );
}

export function CountryCard({ c }) {
  return (
    <Link to={`/destinations/${c.slug}`} className="group relative block h-48 overflow-hidden rounded-2xl shadow-card">
      <Img src={c.image} alt={c.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" fallbackIcon="Globe2" />
      <div className="absolute inset-0 bg-gradient-to-t from-navy-950/90 via-navy-950/30 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 p-4 text-white">
        {c.isoCode && <span className="mb-1 inline-block rounded bg-white/15 px-1.5 text-[10px] font-bold tracking-widest">{c.isoCode}</span>}
        <h3 className="text-lg text-white">{c.name}</h3>
        <p className="mt-0.5 flex items-center gap-1 text-xs text-white/80">{(c.visas || []).length} visa categories <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-1" /></p>
      </div>
    </Link>
  );
}

export function UniversityCard({ u }) {
  const degrees = [...new Set((u.programs || []).map((p) => p.degree).filter(Boolean))];
  const fee = (u.programs || []).find((p) => p.tuitionPerYear === u.tuitionMin);
  return (
    <Link to={`/universities/${u.slug}`} className="card flex gap-4 p-5 transition hover:-translate-y-0.5 hover:shadow-lift">
      <Img src={u.logo} alt={`${u.name} logo`} className="h-16 w-16 shrink-0 rounded-xl border border-slate-100 object-contain p-1" fallbackIcon="GraduationCap" />
      <div className="min-w-0 flex-1">
        <h3 className="text-base leading-snug">{u.name}</h3>
        <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500"><MapPin className="h-3.5 w-3.5" />{[u.city, u.country].filter(Boolean).join(', ')}</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {u.isMedical && <Badge className="bg-emerald-50 text-emerald-700">Medical</Badge>}
          {degrees.map((d) => <Badge key={d} className="bg-navy-50 text-navy-800">{d}</Badge>)}
          {u.languages?.map((l) => <Badge key={l}>{l}</Badge>)}
          {u.admissionOpen ? <Badge className="bg-sky-50 text-sky-700">Admissions open</Badge> : <Badge>Admissions closed</Badge>}
        </div>
        {u.tuitionMin != null && <p className="mt-2 text-sm text-slate-600">Tuition from <strong className="text-navy-900">{money(u.tuitionMin, fee?.currency)}</strong> / year</p>}
      </div>
    </Link>
  );
}

export function ScholarshipCard({ s }) {
  const passed = s.deadline && new Date(s.deadline) < new Date();
  return (
    <div className="card flex flex-col p-5 transition hover:shadow-lift">
      <div className="mb-2 flex flex-wrap gap-1.5">
        {s.fundingType && <Badge className={s.fundingType === 'fully_funded' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}>{fundingLabel(s.fundingType)}</Badge>}
        {s.scholarshipType && <Badge>{s.scholarshipType}</Badge>}
      </div>
      <Link to={`/scholarships/${s.slug}`} className="hover:underline"><h3 className="text-base leading-snug">{s.title}</h3></Link>
      <p className="mt-1 text-sm text-slate-500">{[s.provider, s.country].filter(Boolean).join(' · ')}</p>
      <div className="mt-3 space-y-1 text-xs text-slate-600">
        {s.degreeLevels?.length > 0 && <p className="flex items-center gap-1.5"><GraduationCap className="h-3.5 w-3.5" />{s.degreeLevels.join(', ')}</p>}
        <p className={`flex items-center gap-1.5 ${passed ? 'text-rose-600' : ''}`}><CalendarDays className="h-3.5 w-3.5" />{s.deadline ? `Deadline: ${fmtDate(s.deadline)}${passed ? ' (passed)' : ''}` : 'Deadline: check official website'}</p>
      </div>
      <div className="mt-4 flex gap-2 pt-1">
        <Link to={`/scholarships/${s.slug}`} className="btn-primary btn-sm">View details</Link>
        {s.officialUrl && <a href={s.officialUrl} target="_blank" rel="noreferrer" className="btn-ghost btn-sm">Official site <ExternalLink className="h-3.5 w-3.5" /></a>}
      </div>
    </div>
  );
}
