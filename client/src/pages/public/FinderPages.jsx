import { useParams, useSearchParams, Link } from 'react-router-dom';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { SlidersHorizontal, ExternalLink, MapPin, CalendarDays, Info, AlertTriangle, Languages, Wallet, Award } from 'lucide-react';
import { get, getData } from '../../lib/api';
import { FUNDING, FUNDING_SOURCES, TEACHING_LANGUAGES, fundingLabel, fundingSourceLabel, languageLabel, fmtDate, paragraphs } from '../../lib/constants';
import { Seo, Skeleton, ErrorState, EmptyState, Pagination, List, Img, Badge, PageLoader } from '../../components/ui';
import { UniversityCard, ScholarshipCard } from '../../components/public/Cards';
import MultiSelect from '../../components/public/MultiSelect';
import FeeDisplay from '../../components/public/FeeDisplay';
import Price from '../../components/public/Price';
import FormattedText from '../../components/FormattedText';
import { SidebarForm } from './ServicesPages';
import NotFound from './NotFound';

export function useFilters() {
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

const arr = (v) => (v ? String(v).split(',').filter(Boolean) : []);

const Select = ({ label, value, onChange, options }) => (
  <label className="block"><span className="label">{label}</span>
    <select className="input" value={value || ''} onChange={(e) => onChange(e.target.value)}>
      <option value="">Any</option>
      {options.map((o) => (Array.isArray(o) ? <option key={o[0]} value={o[0]}>{o[1]}</option> : <option key={o} value={o}>{o}</option>))}
    </select>
  </label>
);

// ---------------- Universities ----------------
// The universities tab of the Education & Scholarships page (the page itself supplies the hero and search box).
export function UniversitiesFinder({ f, set, clear }) {
  const facets = useQuery({ queryKey: ['facets', 'universities'], queryFn: () => getData('/content/universities/facets'), staleTime: 600000 });
  const q = useQuery({ queryKey: ['content', 'universities', f], queryFn: () => get('/content/universities', { ...f, limit: 12 }), placeholderData: keepPreviousData });
  const medical = f.medical === 'true';
  return (
    <section className="container-x grid gap-8 py-12 lg:grid-cols-[280px_1fr]">
      <aside className="card h-fit space-y-4 p-5 lg:sticky lg:top-28">
        <p className="flex items-center gap-2 font-bold text-navy-900"><SlidersHorizontal className="h-4 w-4" />Filters</p>
        <label className="flex items-center gap-2 text-sm font-medium"><input type="checkbox" checked={medical} onChange={(e) => set('medical', e.target.checked ? 'true' : '')} className="h-4 w-4 accent-navy-900" />Medical universities only</label>
        <MultiSelect label="Country" options={facets.data?.country || []} value={arr(f.country)} onChange={(v) => set('country', v.join(','))} allLabel="All countries" />
        <MultiSelect label="Language of instruction" options={TEACHING_LANGUAGES} value={arr(f.language)} onChange={(v) => set('language', v.join(','))} allLabel="All languages" />
        <Select label="Scholarship" value={f.scholarship} onChange={(v) => set('scholarship', v)} options={[['any', 'Any scholarship option'], ...FUNDING.map((x) => [x.value, x.label])]} />
        <Select label="Scholarship funding" value={f.scholarshipSource} onChange={(v) => set('scholarshipSource', v)} options={FUNDING_SOURCES.map((x) => [x.value, x.label])} />
        <Select label="Degree" value={f.degree} onChange={(v) => set('degree', v)} options={facets.data?.['programs.degree'] || []} />
        <label className="block"><span className="label">Program</span><input className="input" defaultValue={f.program} onChange={(e) => set('program', e.target.value)} placeholder="e.g. Medicine" /></label>
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
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex gap-3 rounded-2xl border border-slate-100 p-4"><Wallet className="h-5 w-5 shrink-0 text-navy-700" /><div><p className="text-xs text-slate-500">Tuition fee</p><p className="font-semibold text-navy-900"><FeeDisplay u={u} /></p></div></div>
            {u.scholarshipType && <div className="flex gap-3 rounded-2xl border border-slate-100 p-4"><Award className="h-5 w-5 shrink-0 text-navy-700" /><div><p className="text-xs text-slate-500">Scholarship</p><p className="font-semibold text-navy-900">{fundingLabel(u.scholarshipType)}{u.scholarshipSource ? ` · ${fundingSourceLabel(u.scholarshipSource)}` : ''}</p></div></div>}
            {u.teachingLanguages?.length > 0 && <div className="flex gap-3 rounded-2xl border border-slate-100 p-4"><Languages className="h-5 w-5 shrink-0 text-navy-700" /><div><p className="text-xs text-slate-500">Language of instruction</p><p className="font-semibold text-navy-900">{u.teachingLanguages.map(languageLabel).join(', ')}</p></div></div>}
          </div>
          {u.description && <div className="prose-body text-slate-600">{paragraphs(u.description).map((p, i) => <p key={i}>{p}</p>)}</div>}
          {u.programs?.length > 0 && (
            <div>
              <h2 className="mb-4 text-xl">Programs & tuition</h2>
              <div className="overflow-x-auto rounded-2xl border border-slate-100">
                <table className="w-full text-left text-sm">
                  <thead className="bg-navy-50 text-xs uppercase text-navy-800"><tr><th className="p-3">Program</th><th className="p-3">Degree</th><th className="p-3">Duration</th><th className="p-3">Tuition / year</th><th className="p-3">Language</th><th className="p-3">Intake</th></tr></thead>
                  <tbody className="divide-y divide-slate-100">
                    {u.programs.map((p, i) => <tr key={i}><td className="p-3 font-semibold text-navy-900">{p.name}</td><td className="p-3">{p.degree}</td><td className="p-3">{p.durationYears ? `${p.durationYears} years` : '—'}</td><td className="p-3">{p.tuitionPerYear != null ? <Price amount={p.tuitionPerYear} currency={p.currency} /> : '—'}</td><td className="p-3">{p.language || '—'}</td><td className="p-3">{p.intake || '—'}</td></tr>)}
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
          <Link to="/education-scholarships?tab=universities" className="btn-outline">← Back to university finder</Link>
        </div>
        <SidebarForm title="Request admission assistance" service={u.isMedical ? 'medical_university' : 'university_admission'} destination={u.country} showService={false} showDestination={false} formType="university_inquiry" reference={{ kind: 'university', title: u.name, slug: u.slug }} submitLabel="Request Admission Help" messagePlaceholder="Your qualification, marks and preferred intake…" />
      </section>
      <div className="pb-24" />
    </>
  );
}

// ---------------- Scholarships ----------------
// The scholarships tab of the Education & Scholarships page.
export function ScholarshipsFinder({ f, set, clear }) {
  const facets = useQuery({ queryKey: ['facets', 'scholarships'], queryFn: () => getData('/content/scholarships/facets'), staleTime: 600000 });
  const q = useQuery({ queryKey: ['content', 'scholarships', f], queryFn: () => get('/content/scholarships', { ...f, limit: 12 }), placeholderData: keepPreviousData });
  return (
    <section className="container-x grid gap-8 py-12 lg:grid-cols-[280px_1fr]">
      <aside className="card h-fit space-y-4 p-5 lg:sticky lg:top-28">
        <p className="flex items-center gap-2 font-bold text-navy-900"><SlidersHorizontal className="h-4 w-4" />Scholarship filters</p>
        <MultiSelect label="Scholarship type" options={FUNDING.map((x) => [x.value, x.label])} value={arr(f.fundingType)} onChange={(v) => set('fundingType', v.join(','))} allLabel="All types" />
        <MultiSelect label="Funding source" options={FUNDING_SOURCES} value={arr(f.fundingSource)} onChange={(v) => set('fundingSource', v.join(','))} allLabel="Government & institution" />
        <MultiSelect label="Country" options={facets.data?.country || []} value={arr(f.country)} onChange={(v) => set('country', v.join(','))} allLabel="All countries" />
        <MultiSelect label="Language" options={TEACHING_LANGUAGES} value={arr(f.language)} onChange={(v) => set('language', v.join(','))} allLabel="All languages" />
        <Select label="Degree level" value={f.degreeLevel} onChange={(v) => set('degreeLevel', v)} options={facets.data?.degreeLevels || []} />
        <label className="block"><span className="label">Field of study</span><input className="input" defaultValue={f.field} onChange={(e) => set('field', e.target.value)} placeholder="e.g. Engineering" /></label>
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
            {s.fundingSource && <Badge className="bg-white">{fundingSourceLabel(s.fundingSource)}</Badge>}
            {!s.fundingSource && s.scholarshipType && <Badge className="bg-white">{s.scholarshipType}</Badge>}
            {s.languages?.map((l) => <Badge key={l} className="bg-white">{languageLabel(l)}</Badge>)}
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
          {s.fundingDetails && <div><h2 className="mb-2 text-xl">Funding details</h2><FormattedText text={s.fundingDetails} /></div>}
          <div className="grid gap-8 md:grid-cols-2">
            {s.eligibility?.length > 0 && <div><h2 className="mb-3 text-lg">Eligibility</h2><List items={s.eligibility} /></div>}
            {s.documents?.length > 0 && <div><h2 className="mb-3 text-lg">Required documents</h2><List items={s.documents} icon="FileText" /></div>}
          </div>
          {s.procedure?.length > 0 && (
            <div><h2 className="mb-3 text-lg">Application procedure</h2><ol className="space-y-2">{s.procedure.map((p, i) => <li key={i} className="flex gap-3"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-navy-900 text-xs font-bold text-white">{i + 1}</span>{p}</li>)}</ol></div>
          )}
          <div className="flex flex-wrap gap-3">
            {s.officialUrl && <a href={s.officialUrl} target="_blank" rel="noreferrer" className="btn-outline">Official application website <ExternalLink className="h-4 w-4" /></a>}
            <Link to="/education-scholarships?tab=scholarships" className="btn-ghost">← All scholarships</Link>
          </div>
        </div>
        <SidebarForm title="Apply through LN PAK" service="scholarship" destination={s.country} showService={false} showDestination={false} formType="scholarship_inquiry" reference={{ kind: 'scholarship', title: s.title, slug: s.slug }} submitLabel="Apply Through LN PAK" messagePlaceholder="Your degree, CGPA / marks and intended field…" />
      </section>
      <div className="pb-24" />
    </>
  );
}
