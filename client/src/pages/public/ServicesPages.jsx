import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ChevronDown, ArrowRight } from 'lucide-react';
import { getData } from '../../lib/api';
import { paragraphs } from '../../lib/constants';
import { Seo, SectionHeading, Skeleton, ErrorState, List, Icon, Img, PageLoader } from '../../components/ui';
import { ServiceCard } from '../../components/public/Cards';
import { PageHero } from '../../components/public/PublicLayout';
import LeadForm from '../../components/LeadForm';
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

export function EducationPage() {
  const items = [
    ['Compass', 'Study Abroad Consultancy', 'Choose the right country, course and budget with a clear plan.'],
    ['Building2', 'International University Admissions', 'Application preparation and submission to partner and other universities.'],
    ['Stethoscope', 'Medical University Search', 'Compare MBBS / MD programmes by country, fees and requirements.'],
    ['Award', 'Scholarship Assistance', 'Find scholarships you are eligible for and prepare strong applications.'],
    ['FileText', 'Student Visa Guidance', 'Complete visa file preparation and interview practice.'],
    ['BookOpen', 'Course Selection & Counseling', 'One-to-one counseling for subject and career choices.'],
  ];
  return (
    <>
      <Seo title="Education & Study Abroad" description="Study abroad consultancy, university admissions, medical universities and scholarship assistance." />
      <PageHero eyebrow="Education" title="Study Abroad with Confidence" subtitle="From choosing a course to landing on campus — admissions, scholarships and student visas in one place." image="/images/education-students.jpg">
        <div className="mt-8 flex flex-wrap gap-3">
          <Link to="/universities?medical=true" className="btn-gold">Medical University Finder</Link>
          <Link to="/scholarships" className="btn border border-white/40 text-white hover:bg-white/10">Scholarship Finder</Link>
        </div>
      </PageHero>
      <section className="container-x py-16">
        <SectionHeading title="How we help students" />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map(([icon, t, d]) => (
            <div key={t} className="card p-6"><span className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-navy-50 text-navy-900"><Icon name={icon} className="h-6 w-6" /></span><h3 className="text-base">{t}</h3><p className="mt-1 text-sm text-slate-500">{d}</p></div>
          ))}
        </div>
      </section>
      <section className="bg-navy-50 py-16">
        <div className="container-x grid items-center gap-10 lg:grid-cols-2">
          <Img src="/images/education-students.jpg" alt="Students" className="h-80 w-full rounded-3xl object-cover" />
          <div className="card p-6">
            <h2 className="text-xl">Book a free education counseling session</h2>
            <p className="mb-4 mt-1 text-sm text-slate-500">Tell us your qualification and goals — we will suggest suitable options.</p>
            <LeadForm service="university_admission" formType="education_page" submitLabel="Book Free Counseling" messagePlaceholder="Your last qualification, marks and the course you want…" />
          </div>
        </div>
      </section>
      <div className="pb-24" />
    </>
  );
}
