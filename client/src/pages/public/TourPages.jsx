import { useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Clock, MapPin, Hotel, Bus, CalendarDays, CheckCircle2, XCircle } from 'lucide-react';
import { get, getData } from '../../lib/api';
import { TOUR_CATEGORIES, tourCategoryLabel, money, fmtDate } from '../../lib/constants';
import { Seo, Skeleton, ErrorState, EmptyState, Img, PageLoader, Pagination } from '../../components/ui';
import { TourCard } from '../../components/public/Cards';
import { PageHero } from '../../components/public/PublicLayout';
import { SidebarForm } from './ServicesPages';
import NotFound from './NotFound';

export function ToursPage() {
  const [params, setParams] = useSearchParams();
  const category = params.get('category') || '';
  const page = Number(params.get('page') || 1);
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['content', 'tours', category, page],
    queryFn: () => get('/content/tours', { category, page, limit: 12 }),
  });
  const setCat = (c) => setParams(c ? { category: c } : {}, { replace: true });
  return (
    <>
      <Seo title="Tour Packages" description="Turkey, Dubai, Malaysia, Europe, family and honeymoon holidays, Umrah and Hajj packages from LN PAK LLC." />
      <PageHero eyebrow="Popular Packages" title="Tour Packages" subtitle="Curated holidays and spiritual journeys — hotels, transport and guided tours arranged for you." image="/images/tour-banner.jpg" />
      <section className="container-x py-12">
        <div className="mb-8 flex gap-2 overflow-x-auto pb-2" role="tablist">
          {[['', 'All Packages'], ...TOUR_CATEGORIES].map(([k, l]) => (
            <button key={k} onClick={() => setCat(k)} className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${category === k ? 'bg-navy-900 text-white' : 'bg-navy-50 text-navy-900 hover:bg-navy-100'}`}>{l}</button>
          ))}
        </div>
        {error ? <ErrorState error={error} onRetry={refetch} /> : isLoading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-72" />)}</div>
        ) : data.data.length ? (
          <>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{data.data.map((t) => <TourCard key={t._id} t={t} />)}</div>
            <Pagination meta={data.meta} onPage={(p) => { const n = new URLSearchParams(params); n.set('page', p); setParams(n); }} />
          </>
        ) : <EmptyState title={`No ${category ? tourCategoryLabel(category) : 'packages'} available right now`} text="New departures are added regularly. Send us an inquiry and we will plan a custom package." />}
      </section>
      <div className="pb-24" />
    </>
  );
}

export function TourDetail() {
  const { slug } = useParams();
  const { data: t, isLoading, error } = useQuery({ queryKey: ['content', 'tours', slug], queryFn: () => getData(`/content/tours/${slug}`), retry: false });
  const [img, setImg] = useState(0);
  if (isLoading) return <PageLoader />;
  if (error?.status === 404) return <NotFound />;
  if (error) return <div className="container-x py-16"><ErrorState error={error} /></div>;
  const upcoming = (t.departureDates || []).filter((d) => new Date(d) >= new Date()).sort((a, b) => new Date(a) - new Date(b));
  const facts = [
    [Clock, 'Duration', t.durationDays ? `${t.durationDays} Days${t.durationNights ? ` / ${t.durationNights} Nights` : ''}` : null],
    [MapPin, 'Destination', t.destination],
    [Hotel, 'Hotel', t.hotel],
    [Bus, 'Transport', t.transport],
  ].filter(([, , v]) => v);

  return (
    <>
      <Seo title={t.seo?.metaTitle || t.title} description={t.seo?.metaDescription || t.summary} image={t.images?.[0]} />
      <section className="container-x py-10">
        <p className="eyebrow mb-2">{tourCategoryLabel(t.category)}</p>
        <h1 className="text-3xl sm:text-4xl">{t.title}</h1>
        <div className="mt-6 grid gap-3 lg:grid-cols-[1fr_200px]">
          <Img src={t.images?.[img]} alt={t.title} className="h-72 w-full rounded-3xl object-cover sm:h-[420px]" fallbackIcon="Plane" loading="eager" />
          {t.images?.length > 1 && (
            <div className="flex gap-3 overflow-x-auto lg:flex-col">
              {t.images.map((src, i) => (
                <button key={src} onClick={() => setImg(i)} className={`shrink-0 overflow-hidden rounded-2xl ring-2 ${i === img ? 'ring-navy-700' : 'ring-transparent'}`} aria-label={`Photo ${i + 1}`}>
                  <Img src={src} alt="" className="h-24 w-36 object-cover lg:w-full" />
                </button>
              ))}
            </div>
          )}
        </div>
      </section>
      <section className="container-x grid gap-10 pb-14 lg:grid-cols-[1fr_380px]">
        <div className="space-y-10">
          <div className="flex flex-wrap items-end justify-between gap-4 rounded-2xl bg-navy-50 p-5">
            <div>
              {t.price != null && <p className="text-3xl font-extrabold text-navy-900">{money(t.price, t.currency)}</p>}
              {t.priceNote && <p className="text-xs text-slate-500">{t.priceNote}</p>}
            </div>
            {t.availability !== 'available' && <span className="rounded-full bg-gold-500 px-3 py-1 text-xs font-bold text-navy-950">{t.availability === 'limited' ? 'Limited seats' : 'Sold out'}</span>}
          </div>
          {t.summary && <p className="text-lg text-slate-600">{t.summary}</p>}
          <div className="grid gap-3 sm:grid-cols-2">
            {facts.map(([I, l, v]) => <div key={l} className="flex gap-3 rounded-2xl border border-slate-100 p-4"><I className="h-5 w-5 shrink-0 text-navy-700" /><div><p className="text-xs text-slate-500">{l}</p><p className="font-semibold text-navy-900">{v}</p></div></div>)}
          </div>
          {upcoming.length > 0 && (
            <div><h2 className="mb-3 text-xl">Departure dates</h2><div className="flex flex-wrap gap-2">{upcoming.map((d) => <span key={d} className="inline-flex items-center gap-1.5 rounded-full bg-navy-50 px-3 py-1.5 text-sm font-semibold text-navy-900"><CalendarDays className="h-4 w-4" />{fmtDate(d)}</span>)}</div></div>
          )}
          {t.itinerary?.length > 0 && (
            <div>
              <h2 className="mb-4 text-xl">Day-wise itinerary</h2>
              <ol className="relative space-y-6 border-l-2 border-navy-100 pl-6">
                {t.itinerary.map((d) => (
                  <li key={d.day} className="relative">
                    <span className="absolute -left-[37px] flex h-6 w-6 items-center justify-center rounded-full bg-navy-900 text-[11px] font-bold text-white">{d.day}</span>
                    <h3 className="text-base">Day {d.day}: {d.title}</h3>
                    {d.description && <p className="mt-1 text-sm text-slate-600">{d.description}</p>}
                  </li>
                ))}
              </ol>
            </div>
          )}
          <div className="grid gap-6 md:grid-cols-2">
            {t.included?.length > 0 && <div className="card p-5"><h2 className="mb-3 text-base">Included</h2><ul className="space-y-2">{t.included.map((x) => <li key={x} className="flex gap-2 text-sm"><CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />{x}</li>)}</ul></div>}
            {t.excluded?.length > 0 && <div className="card p-5"><h2 className="mb-3 text-base">Not included</h2><ul className="space-y-2">{t.excluded.map((x) => <li key={x} className="flex gap-2 text-sm"><XCircle className="h-4 w-4 shrink-0 text-rose-500" />{x}</li>)}</ul></div>}
          </div>
        </div>
        <SidebarForm
          title="Book this package"
          service={['umrah', 'hajj'].includes(t.category) ? 'hajj_umrah' : 'tour_booking'}
          destination={t.destination}
          showService={false}
          showDestination={false}
          formType="tour_booking"
          reference={{ kind: 'tour', title: t.title, slug: t.slug }}
          submitLabel="Send Booking Inquiry"
          messagePlaceholder="Preferred dates, number of travellers, room type…"
        />
      </section>
      <div className="pb-24" />
    </>
  );
}
