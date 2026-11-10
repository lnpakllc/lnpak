import { useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Search } from 'lucide-react';
import { getData } from '../../lib/api';
import { VISA_TYPES, fmtDate, paragraphs } from '../../lib/constants';
import { Seo, Skeleton, ErrorState, EmptyState, List, PageLoader } from '../../components/ui';
import { CountryCard } from '../../components/public/Cards';
import { PageHero } from '../../components/public/PublicLayout';
import { FaqList, SidebarForm } from './ServicesPages';
import NotFound from './NotFound';

export function DestinationsPage() {
  const [params, setParams] = useSearchParams();
  const q = params.get('q') || '';
  const visa = params.get('visa') || '';
  const { data, isLoading, error, refetch } = useQuery({ queryKey: ['content', 'countries', q, visa], queryFn: () => getData('/content/countries', { q, visa, limit: 60 }) });
  const set = (k, v) => { const p = new URLSearchParams(params); if (v) p.set(k, v); else p.delete(k); setParams(p, { replace: true }); };
  return (
    <>
      <Seo title="Visa Destinations" description="Country-wise visa guidance for the UK, USA, Canada, Australia, Europe, Turkey, UAE, Saudi Arabia, Malaysia, China and more." />
      <PageHero eyebrow="Visa Destination Explorer" title="Where do you want to go?" subtitle="Study, visit, work and business visa guidance by country.">
        <div className="mt-8 flex max-w-2xl flex-col gap-2 sm:flex-row">
          <label className="relative flex-1"><Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" /><input defaultValue={q} onChange={(e) => set('q', e.target.value)} className="input pl-10" placeholder="Search a country…" aria-label="Search country" /></label>
          <select value={visa} onChange={(e) => set('visa', e.target.value)} className="input sm:w-52" aria-label="Visa type"><option value="">All visa types</option>{VISA_TYPES.map((v) => <option key={v.value} value={v.value}>{v.label}</option>)}</select>
        </div>
      </PageHero>
      <section className="container-x py-14">
        {error ? <ErrorState error={error} onRetry={refetch} /> : isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-48" />)}</div>
        ) : data.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{data.map((c) => <CountryCard key={c._id} c={c} />)}</div>
        ) : <EmptyState title="No destinations match" text="Try another search, or ask us — we cover many more countries." />}
      </section>
      <div className="pb-24" />
    </>
  );
}

export function DestinationDetail() {
  const { slug } = useParams();
  const { data: c, isLoading, error } = useQuery({ queryKey: ['content', 'countries', slug], queryFn: () => getData(`/content/countries/${slug}`), retry: false });
  const [tab, setTab] = useState(0);
  if (isLoading) return <PageLoader />;
  if (error?.status === 404) return <NotFound />;
  if (error) return <div className="container-x py-16"><ErrorState error={error} /></div>;
  const visas = c.visas || [];
  const v = visas[tab];
  const visaLabel = (t) => VISA_TYPES.find((x) => x.value === t)?.label || t;

  return (
    <>
      <Seo title={c.seo?.metaTitle || `${c.name} Visa Guide`} description={c.seo?.metaDescription || `Study, visit, work and business visa guidance for ${c.name} from LN PAK LLC.`} image={c.image} />
      <PageHero eyebrow="Visa Destination" title={`${c.name} Visa Guide`} subtitle={`Available visa categories, eligibility basics, document checklist and the application process for ${c.name}.`} image={c.image} />
      <section className="container-x grid gap-10 py-14 lg:grid-cols-[1fr_380px]">
        <div className="space-y-10">
          <div className="flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900" role="note">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <p>Visa rules change often. This page is general guidance, not official immigration advice. Always confirm current requirements with our consultant and the official embassy website.{c.lastReviewedAt && <> Last reviewed: <strong>{fmtDate(c.lastReviewedAt)}</strong>.</>}</p>
          </div>
          {c.overview && <div><h2 className="mb-3 text-xl">Country overview</h2><div className="prose-body text-slate-600">{paragraphs(c.overview).map((p, i) => <p key={i}>{p}</p>)}</div></div>}

          {visas.length > 0 && (
            <div>
              <h2 className="mb-4 text-xl">Available visa categories</h2>
              <div className="mb-6 flex flex-wrap gap-2" role="tablist">
                {visas.map((x, i) => (
                  <button key={x.type} role="tab" aria-selected={tab === i} onClick={() => setTab(i)} className={`rounded-full px-4 py-2 text-sm font-semibold transition ${tab === i ? 'bg-navy-900 text-white' : 'bg-navy-50 text-navy-900 hover:bg-navy-100'}`}>{x.title || visaLabel(x.type)}</button>
                ))}
              </div>
              {v && (
                <div className="card space-y-8 p-6" role="tabpanel">
                  {v.overview && <p className="text-slate-600">{v.overview}</p>}
                  <div className="grid gap-8 md:grid-cols-2">
                    {v.eligibility?.length > 0 && <div><h3 className="mb-3 text-base">Basic eligibility</h3><List items={v.eligibility} /></div>}
                    {v.documents?.length > 0 && <div><h3 className="mb-3 text-base">Document checklist</h3><List items={v.documents} icon="FileText" /></div>}
                  </div>
                  {v.process?.length > 0 && (
                    <div>
                      <h3 className="mb-3 text-base">Application process</h3>
                      <ol className="space-y-2">{v.process.map((p, i) => <li key={i} className="flex gap-3"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-navy-900 text-xs font-bold text-white">{i + 1}</span><span>{p}</span></li>)}</ol>
                    </div>
                  )}
                  {v.processingNote && <p className="rounded-xl bg-navy-50 p-4 text-sm text-navy-900">{v.processingNote}</p>}
                </div>
              )}
            </div>
          )}
          {c.faqs?.length > 0 && <div><h2 className="mb-4 text-xl">Frequently asked questions</h2><FaqList faqs={c.faqs} /></div>}
        </div>
        <SidebarForm
          title={`${c.name} visa inquiry`}
          service={v?.type || 'visit_visa'}
          destination={c.name}
          showDestination={false}
          formType={`country_page_${c.slug}`}
          reference={{ kind: 'country', title: c.name, slug: c.slug }}
        />
      </section>
      <div className="pb-24" />
    </>
  );
}
