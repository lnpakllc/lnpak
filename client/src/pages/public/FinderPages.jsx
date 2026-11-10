import { useParams, useSearchParams, Link } from 'react-router-dom';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { Search, SlidersHorizontal, ExternalLink, MapPin, CalendarDays, Info, AlertTriangle } from 'lucide-react';
import { get, getData } from '../../lib/api';
import { FUNDING, fundingLabel, money, fmtDate, paragraphs } from '../../lib/constants';
import { Seo, Skeleton, ErrorState, EmptyState, Pagination, List, Img, Badge, PageLoader } from '../../components/ui';
import { UniversityCard, ScholarshipCard } from '../../components/public/Cards';
import { PageHero } from '../../components/public/PublicLayout';
import { SidebarForm } from './ServicesPages';
import NotFound from './NotFound';

function useFilters() {
  const [params, setParams] = useSearchParams();
  const values = Object.fromEntries(params.entries());
  const set = (k, v) => {
    const p = new URLSearchParams(params);
    if (v === '' || v == null || v === false) p.delete(k); else p.set(k, v);
    if (k !== 'page') p.delete('page');
    setParams(p, { replace: true });
  };
  return [values, set, () => setParams({}, { replace: true })];
}

const Select = ({ label, value, onChange, options }) => (
  <label className="block"><span className="label">{label}</span>
    <select className="input" value={value || ''} onChange={(e) => onChange(e.target.value)}>
      <option value="">Any</option>
      {options.map((o) => (Array.isArray(o) ? <option key={o[0]} value={o[0]}>{o[1]}</option> : <option key={o} value={o}>{o}</option>))}
    </select>
  </label>
);

// ---------------- Universities ----------------
export function UniversitiesPage() {
  const [f, set, clear] = useFilters();
  const facets = useQuery({ queryKey: ['facets', 'universities'], queryFn: () => getData('/content/universities/facets'), staleTime: 600000 });
  const q = useQuery({ queryKey: ['content', 'universities', f], queryFn: () => get('/content/universities', { ...f, limit: 12 }), placeholderData: keepPreviousData });
  const medical = f.medical === 'true';
  return (
    <>
      <Seo title={medical ? 'Medical University Finder' : 'University Finder'} description="Search international and medical universities by country, degree, tuition fee, language and admission availability." />
      <PageHero eyebrow="Education" title={medical ? 'Medical University Finder' : 'University Finder'} subtitle="Compare universities by country, programme, tuition fee and language — then apply with our help." image="/images/education-students.jpg">
        <label className="relative mt-8 block max-w-xl"><Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" /><input defaultValue={f.q} onChange={(e) => set('q', e.target.value)} className="input pl-10" placeholder="Search university name or city…" aria-label="Search universities" /></label>
      </PageHero>
      <section className="container-x grid gap-8 py-12 lg:grid-cols-[280px_1fr]">
        <aside className="card h-fit space-y-4 p-5 lg:sticky lg:top-28">
          <p className="flex items-center gap-2 font-bold text-navy-900"><SlidersHorizontal className="h-4 w-4" />Filters</p>
          <label className="flex items-center gap-2 text-sm font-medium"><input type="checkbox" checked={medical} onChange={(e) => set('medical', e.target.checked ? 'true' : '')} className="h-4 w-4 accent-navy-900" />Medical universities only</label>
          <Select label="Country" value={f.country} onChange={(v) => set('country', v)} options={facets.data?.country || []} />
          <Select label="Degree" value={f.degree} onChange={(v) => set('degree', v)} options={facets.data?.['programs.degree'] || []} />
          <label className="block"><span className="label">Program</span><input className="input" defaultValue={f.program} onChange={(e) => set('program', e.target.value)} placeholder="e.g. Medicine" /></label>
          <Select label="Language of instruction" value={f.language} onChange={(v) => set('language', v)} options={facets.data?.languages || []} />
          <Select label="Max tuition / year (USD)" value={f.maxFee} onChange={(v) => set('maxFee', v)} options={[['3000', 'Up to $3,000'], ['5000', 'Up to $5,000'], ['8000', 'Up to $8,000'], ['12000', 'Up to $12,000'], ['20000', 'Up to $20,000']]} />
          <label className="block"><span className="label">Entry requirement</span><input className="input" defaultValue={f.requirement} onChange={(e) => set('requirement', e.target.value)} placeholder="e.g. FSc, A-Level, IELTS" /></label>
          <label className="flex items-center gap-2 text-sm font-medium"><input type="checkbox" checked={f.admissionOpen === 'true'} onChange={(e) => set('admissionOpen', e.target.checked ? 'true' : '')} className="h-4 w-4 accent-navy-900" />Admissions open now</label>
          <button className="btn-ghost btn-sm w-full" onClick={clear}>Clear all filters</button>
        </aside>
        <div>
          {q.error ? <ErrorState error={q.error} onRetry={q.refetch} /> : q.isLoading ? (
            <div className="grid gap-4 md:grid-cols-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-36" />)}</div>
          ) : q.data.data.length ? (
            <>
              <p className="mb-4 text-sm text-slate-500">{q.data.meta.total} universities found</p>
              <div className={`grid gap-4 md:grid-cols-2 ${q.isFetching ? 'opacity-60' : ''}`}>{q.data.data.map((u) => <UniversityCard key={u._id} u={u} />)}</div>
              <Pagination meta={q.data.meta} onPage={(p) => set('page', p)} />
            </>
          ) : <EmptyState title="No universities match these filters" text="Clear some filters, or ask our education team for options." action={<button className="btn-outline btn-sm" onClick={clear}>Clear filters</button>} />}
        </div>
      </section>
      <div className="pb-24" />
    </>
  );
}

export function UniversityDetail() {
  const { slug } = useParams();
  const { data: u, isLoading, error } = useQuery({ queryKey: ['content', 'universities', slug], queryFn: () => getData(`/content/universities/${slug}`), retry: false });
  if (isLoading) return <PageLoader />;
  if (error?.status === 404) return <NotFound />;
  if (error) return <div className="container-x py-16"><ErrorState error={error} /></div>;
  return (
    <>
      <Seo title={u.seo?.metaTitle || u.name} description={u.seo?.metaDescription || `Programs, tuition fees and admission requirements for ${u.name}, ${u.country}.`} image={u.image || u.logo} />
      <section className="bg-navy-50">
        <div className="container-x flex flex-col gap-6 py-10 sm:flex-row sm:items-center">
          <Img src={u.logo} alt={`${u.name} logo`} className="h-24 w-24 shrink-0 rounded-2xl bg-white object-contain p-2 shadow-card" fallbackIcon="GraduationCap" />
          <div>
            <h1 className="text-2xl sm:text-3xl">{u.name}</h1>
            <p className="mt-1 flex items-center gap-1.5 text-slate-600"><MapPin className="h-4 w-4" />{[u.city, u.country].filter(Boolean).join(', ')}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {u.isMedical && <Badge className="bg-emerald-100 text-emerald-800">Medical</Badge>}
              {u.admissionOpen ? <Badge className="bg-sky-100 text-sky-800">Admissions open</Badge> : <Badge>Admissions closed</Badge>}
              {u.website && <a href={u.website} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm font-semibold text-navy-700 hover:underline">Official website <ExternalLink className="h-3.5 w-3.5" /></a>}
            </div>
          </div>
        </div>
      </section>
      <section className="container-x grid gap-10 py-12 lg:grid-cols-[1fr_380px]">
        <div className="space-y-10">
          {u.dataNote && <p className="flex gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900"><Info className="h-4 w-4 shrink-0" />{u.dataNote}</p>}
          {u.description && <div className="prose-body text-slate-600">{paragraphs(u.description).map((p, i) => <p key={i}>{p}</p>)}</div>}
          {u.programs?.length > 0 && (
            <div>
              <h2 className="mb-4 text-xl">Programs & tuition</h2>
              <div className="overflow-x-auto rounded-2xl border border-slate-100">
                <table className="w-full text-left text-sm">
                  <thead className="bg-navy-50 text-xs uppercase text-navy-800"><tr><th className="p-3">Program</th><th className="p-3">Degree</th><th className="p-3">Duration</th><th className="p-3">Tuition / year</th><th className="p-3">Language</th><th className="p-3">Intake</th></tr></thead>
                  <tbody className="divide-y divide-slate-100">
                    {u.programs.map((p, i) => <tr key={i}><td className="p-3 font-semibold text-navy-900">{p.name}</td><td className="p-3">{p.degree}</td><td className="p-3">{p.durationYears ? `${p.durationYears} years` : '—'}</td><td className="p-3">{p.tuitionPerYear != null ? money(p.tuitionPerYear, p.currency) : '—'}</td><td className="p-3">{p.language || '—'}</td><td className="p-3">{p.intake || '—'}</td></tr>)}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          <div className="grid gap-8 md:grid-cols-2">
            {u.admissionRequirements?.length > 0 && <div><h2 className="mb-3 text-lg">Admission requirements</h2><List items={u.admissionRequirements} /></div>}
            {u.requiredDocuments?.length > 0 && <div><h2 className="mb-3 text-lg">Required documents</h2><List items={u.requiredDocuments} icon="FileText" /></div>}
          </div>
          {u.languageRequirements && <div><h2 className="mb-2 text-lg">Language requirements</h2><p className="text-slate-600">{u.languageRequirements}</p></div>}
          {u.deadlines && <div><h2 className="mb-2 text-lg">Application deadlines</h2><p className="flex gap-2 text-slate-600"><CalendarDays className="h-5 w-5 shrink-0 text-navy-700" />{u.deadlines}</p></div>}
          <Link to="/universities?medical=true" className="btn-outline">← Back to university finder</Link>
        </div>
        <SidebarForm title="Request admission assistance" service={u.isMedical ? 'medical_university' : 'university_admission'} destination={u.country} showService={false} showDestination={false} formType="university_inquiry" reference={{ kind: 'university', title: u.name, slug: u.slug }} submitLabel="Request Admission Help" messagePlaceholder="Your qualification, marks and preferred intake…" />
      </section>
      <div className="pb-24" />
    </>
  );
}

// ---------------- Scholarships ----------------
export function ScholarshipsPage() {
  const [f, set, clear] = useFilters();
  const facets = useQuery({ queryKey: ['facets', 'scholarships'], queryFn: () => getData('/content/scholarships/facets'), staleTime: 600000 });
  const q = useQuery({ queryKey: ['content', 'scholarships', f], queryFn: () => get('/content/scholarships', { ...f, limit: 12 }), placeholderData: keepPreviousData });
  return (
    <>
      <Seo title="Scholarship Finder" description="Search fully and partially funded scholarships by country, degree level and field of study." />
      <PageHero eyebrow="Scholarship Finder" title="Find Scholarships You Can Apply For" subtitle="Government, university and international scholarships — with application support from LN PAK." image="/images/education-students.jpg">
        <label className="relative mt-8 block max-w-xl"><Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" /><input defaultValue={f.q} onChange={(e) => set('q', e.target.value)} className="input pl-10" placeholder="Search scholarship, provider or country…" aria-label="Search scholarships" /></label>
      </PageHero>
      <section className="container-x grid gap-8 py-12 lg:grid-cols-[280px_1fr]">
        <aside className="card h-fit space-y-4 p-5 lg:sticky lg:top-28">
          <p className="flex items-center gap-2 font-bold text-navy-900"><SlidersHorizontal className="h-4 w-4" />Filters</p>
          <Select label="Country" value={f.country} onChange={(v) => set('country', v)} options={facets.data?.country || []} />
          <Select label="Degree level" value={f.degreeLevel} onChange={(v) => set('degreeLevel', v)} options={facets.data?.degreeLevels || []} />
          <label className="block"><span className="label">Field of study</span><input className="input" defaultValue={f.field} onChange={(e) => set('field', e.target.value)} placeholder="e.g. Engineering" /></label>
          <Select label="Funding" value={f.fundingType} onChange={(v) => set('fundingType', v)} options={FUNDING.map((x) => [x.value, x.label])} />
          <Select label="Scholarship type" value={f.scholarshipType} onChange={(v) => set('scholarshipType', v)} options={facets.data?.scholarshipType || []} />
          <Select label="Deadline" value={f.deadline} onChange={(v) => set('deadline', v)} options={[['upcoming', 'Not yet passed'], ['next90', 'Within 90 days']]} />
          <label className="block"><span className="label">Eligibility keyword</span><input className="input" defaultValue={f.eligibility} onChange={(e) => set('eligibility', e.target.value)} placeholder="e.g. IELTS, age" /></label>
          <button className="btn-ghost btn-sm w-full" onClick={clear}>Clear all filters</button>
        </aside>
        <div>
          {q.error ? <ErrorState error={q.error} onRetry={q.refetch} /> : q.isLoading ? (
            <div className="grid gap-4 md:grid-cols-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-52" />)}</div>
          ) : q.data.data.length ? (
            <>
              <p className="mb-4 text-sm text-slate-500">{q.data.meta.total} scholarships found</p>
              <div className={`grid gap-4 md:grid-cols-2 ${q.isFetching ? 'opacity-60' : ''}`}>{q.data.data.map((s) => <ScholarshipCard key={s._id} s={s} />)}</div>
              <Pagination meta={q.data.meta} onPage={(p) => set('page', p)} />
            </>
          ) : <EmptyState title="No scholarships match these filters" action={<button className="btn-outline btn-sm" onClick={clear}>Clear filters</button>} />}
        </div>
      </section>
      <div className="pb-24" />
    </>
  );
}

export function ScholarshipDetail() {
  const { slug } = useParams();
  const { data: s, isLoading, error } = useQuery({ queryKey: ['content', 'scholarships', slug], queryFn: () => getData(`/content/scholarships/${slug}`), retry: false });
  if (isLoading) return <PageLoader />;
  if (error?.status === 404) return <NotFound />;
  if (error) return <div className="container-x py-16"><ErrorState error={error} /></div>;
  return (
    <>
      <Seo title={s.seo?.metaTitle || s.title} description={s.seo?.metaDescription || `${s.title} — eligibility, funding, documents and how to apply.`} image={s.image} />
      <section className="bg-navy-50">
        <div className="container-x py-10">
          <div className="mb-3 flex flex-wrap gap-2">
            {s.fundingType && <Badge className="bg-emerald-100 text-emerald-800">{fundingLabel(s.fundingType)}</Badge>}
            {s.scholarshipType && <Badge className="bg-white">{s.scholarshipType}</Badge>}
            {s.degreeLevels?.map((d) => <Badge key={d} className="bg-white">{d}</Badge>)}
          </div>
          <h1 className="text-2xl sm:text-4xl">{s.title}</h1>
          <p className="mt-2 text-slate-600">{[s.provider, s.country].filter(Boolean).join(' · ')}</p>
          <p className="mt-3 flex items-center gap-2 font-semibold text-navy-900"><CalendarDays className="h-5 w-5" />{s.deadline ? `Application deadline: ${fmtDate(s.deadline)}` : 'Deadline: please check the official website for the current cycle'}</p>
        </div>
      </section>
      <section className="container-x grid gap-10 py-12 lg:grid-cols-[1fr_380px]">
        <div className="space-y-10">
          <p className="flex gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900"><AlertTriangle className="h-4 w-4 shrink-0" />Scholarship terms change every cycle. Confirm the details on the official website before applying.</p>
          {s.fundingDetails && <div><h2 className="mb-2 text-xl">Funding details</h2><p className="text-slate-600">{s.fundingDetails}</p></div>}
          <div className="grid gap-8 md:grid-cols-2">
            {s.eligibility?.length > 0 && <div><h2 className="mb-3 text-lg">Eligibility</h2><List items={s.eligibility} /></div>}
            {s.documents?.length > 0 && <div><h2 className="mb-3 text-lg">Required documents</h2><List items={s.documents} icon="FileText" /></div>}
          </div>
          {s.procedure?.length > 0 && (
            <div><h2 className="mb-3 text-lg">Application procedure</h2><ol className="space-y-2">{s.procedure.map((p, i) => <li key={i} className="flex gap-3"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-navy-900 text-xs font-bold text-white">{i + 1}</span>{p}</li>)}</ol></div>
          )}
          <div className="flex flex-wrap gap-3">
            {s.officialUrl && <a href={s.officialUrl} target="_blank" rel="noreferrer" className="btn-outline">Official application website <ExternalLink className="h-4 w-4" /></a>}
            <Link to="/scholarships" className="btn-ghost">← All scholarships</Link>
          </div>
        </div>
        <SidebarForm title="Apply through LN PAK" service="scholarship" destination={s.country} showService={false} showDestination={false} formType="scholarship_inquiry" reference={{ kind: 'scholarship', title: s.title, slug: s.slug }} submitLabel="Apply Through LN PAK" messagePlaceholder="Your degree, CGPA / marks and intended field…" />
      </section>
      <div className="pb-24" />
    </>
  );
}
