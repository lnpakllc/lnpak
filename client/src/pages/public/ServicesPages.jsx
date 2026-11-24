import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ChevronDown, ArrowRight } from 'lucide-react';
import { getData } from '../../lib/api';
import { paragraphs } from '../../lib/constants';
import { Seo, Skeleton, ErrorState, List, PageLoader } from '../../components/ui';
import { ServiceCard } from '../../components/public/Cards';
import { PageHero } from '../../components/public/PublicLayout';
import LeadForm from '../../components/LeadForm';
import FaqSection from '../../components/public/FaqSection';
import NotFound from './NotFound';

export function ServicesPage() {
  const { data, isLoading, error, refetch } = useQuery({ queryKey: ['content', 'services', 'all'], queryFn: () => getData('/content/services', { limit: 50 }) });
  return (
    <>
      <Seo title="Our Services" description="Study visa, visit visa, business visa, work permit, immigration, Hajj & Umrah and documentation services." />
      <PageHero eyebrow="What we do" title="Our Services" subtitle="Comprehensive visa, travel, education and immigration solutions — handled by experienced consultants." image="/images/hero-landmarks.jpg" />
      <section className="container-x py-16">
        {error ? <ErrorState error={error} onRetry={refetch} /> : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {isLoading ? Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-72" />) : data.map((s) => <ServiceCard key={s._id} s={s} detailed />)}
          </div>
        )}
      </section>
      <FaqSection page="services" className="py-16" />
    </>
  );
}

export function FaqList({ faqs }) {
  if (!faqs?.length) return null;
  return (
    <div className="space-y-3">
      {faqs.map((f, i) => (
        <details key={i} className="group card px-5 py-4">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-navy-900">{f.question}<ChevronDown className="h-5 w-5 shrink-0 transition group-open:rotate-180" /></summary>
          <p className="mt-3 text-sm leading-relaxed text-slate-600">{f.answer}</p>
        </details>
      ))}
    </div>
  );
}

export function SidebarForm({ title = 'Get a Free Assessment', ...props }) {
  return (
    <aside className="lg:sticky lg:top-28">
      <div className="card p-6">
        <h2 className="text-lg">{title}</h2>
        <p className="mb-4 mt-1 text-sm text-slate-500">Our consultant will contact you within one working day.</p>
        <LeadForm layout="narrow" {...props} />
      </div>
    </aside>
  );
}

export function ServiceDetail() {
  const { slug } = useParams();
  const { data: s, isLoading, error } = useQuery({ queryKey: ['content', 'services', slug], queryFn: () => getData(`/content/services/${slug}`), retry: false });
  if (isLoading) return <PageLoader />;
  if (error?.status === 404) return <NotFound />;
  if (error) return <div className="container-x py-16"><ErrorState error={error} /></div>;
  return (
    <>
      <Seo title={s.seo?.metaTitle || s.title} description={s.seo?.metaDescription || s.shortDescription} image={s.seo?.ogImage || s.image} />
      <PageHero eyebrow="Our Services" title={s.title} subtitle={s.shortDescription} image={s.image || '/images/hero-landmarks.jpg'} />
      <section className="container-x grid gap-10 py-14 lg:grid-cols-[1fr_380px]">
        <div className="space-y-12">
          <div className="prose-body text-slate-600">{paragraphs(s.description).map((p, i) => <p key={i}>{p}</p>)}</div>
          {s.features?.length > 0 && (<div><h2 className="mb-4 text-xl">What we help with</h2><div className="card p-6"><List items={s.features} /></div></div>)}
          {s.process?.length > 0 && (
            <div>
              <h2 className="mb-4 text-xl">How the process works</h2>
              <ol className="grid gap-3 sm:grid-cols-2">
                {s.process.map((p, i) => <li key={i} className="flex gap-3 rounded-2xl bg-navy-50 p-4"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-navy-900 text-sm font-bold text-white">{i + 1}</span><span className="pt-1 font-medium text-navy-900">{p}</span></li>)}
              </ol>
            </div>
          )}
          {s.documents?.length > 0 && (<div><h2 className="mb-4 text-xl">Common documents</h2><List items={s.documents} icon="FileText" /></div>)}
          {s.faqs?.length > 0 && (<div><h2 className="mb-4 text-xl">Frequently asked questions</h2><FaqList faqs={s.faqs} /></div>)}
          <Link to="/destinations" className="inline-flex items-center gap-2 font-semibold text-navy-700 hover:underline">Check visa guidance by country <ArrowRight className="h-4 w-4" /></Link>
        </div>
        <SidebarForm title={`Apply for ${s.title}`} service={s.serviceType} formType={`service_page_${s.slug}`} reference={{ kind: 'service', title: s.title, slug: s.slug }} showService={false} submitLabel="Apply Now" />
      </section>
    </>
  );
}
