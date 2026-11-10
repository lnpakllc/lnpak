import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, CheckCircle2, Star, Plane, ChevronDown } from 'lucide-react';
import { getData } from '../../lib/api';
import { useSettings } from '../../hooks/useSettings';
import { useConsult } from '../../context/ConsultContext';
import { Seo, SectionHeading, Icon, Img, Skeleton } from '../../components/ui';
import { ServiceCard, TourCard, CountryCard } from '../../components/public/Cards';
import LeadForm from '../../components/LeadForm';

const useContent = (type, params) =>
  useQuery({ queryKey: ['content', type, params], queryFn: () => getData(`/content/${type}`, params), staleTime: 5 * 60 * 1000 });

const WHY = [
  ['ShieldCheck', 'Professional Consultancy', 'Honest, documented advice — no false promises.'],
  ['Award', 'Expert Guidance', 'Consultants who know each visa and admission process.'],
  ['Globe2', 'Global Network', 'Partners and contacts across key destinations.'],
  ['Handshake', 'Personalized Solutions', 'A plan built around your profile and budget.'],
  ['Zap', 'Transparent Process', 'Clear fees and live progress in your client portal.'],
  ['Headphones', 'Dedicated Support', 'One consultant who knows your file, start to finish.'],
];

const STEPS = [
  ['Submit Your Inquiry', 'Fill a short form or message us on WhatsApp.'],
  ['Free Initial Assessment', 'We review your profile and goals at no cost.'],
  ['Consultation with Our Team', 'Discuss options, timelines and fees openly.'],
  ['Documentation & Application', 'We prepare a complete, accurate file with you.'],
  ['Application Tracking', 'Follow every step from your client portal.'],
  ['Final Updates', 'We share the outcome and help with next steps.'],
];

const EDU_POINTS = ['Medical University Search', 'Scholarship Assistance', 'University Admissions', 'Course Guidance & Counseling', 'Complete Application Support'];

export default function Home() {
  const s = useSettings();
  const consult = useConsult();
  const services = useContent('services', { limit: 8 });
  const tours = useContent('tours', { featured: 'true', limit: 4 });
  const countries = useContent('countries', { featured: 'true', limit: 8 });
  const testimonials = useContent('testimonials', { limit: 3 });
  const faqs = useContent('faqs', { limit: 6 });
  const hero = s.hero || {};

  return (
    <>
      <Seo title={s.seo?.metaTitle ? undefined : 'Visa, Travel, Education & Immigration Consultancy'} description={s.seo?.metaDescription} />

      {/* ---------- HERO ---------- */}
      <section className="relative overflow-hidden bg-gradient-to-b from-sky-50 to-white">
        <div className="absolute inset-y-0 right-0 hidden w-[58%] lg:block">
          <Img src={hero.image || '/images/hero-landmarks.jpg'} alt="Airplane flying over world landmarks" className="h-full w-full object-cover object-left" fetchPriority="high" loading="eager" />
          <div className="absolute inset-0 bg-gradient-to-r from-sky-50 via-sky-50/50 to-transparent via-20%" />
        </div>
        <div className="container-x relative grid min-h-[520px] items-center gap-8 py-14 lg:grid-cols-2 lg:py-20">
          <div>
            <p className="eyebrow mb-4 text-navy-800">{hero.eyebrow || 'Dream • Plan • Travel • Study • Settle'}</p>
            <h1 className="text-[2.1rem] leading-[1.1] sm:text-5xl lg:text-[3.4rem]">{hero.title || 'Your Global Journey Starts with LN PAK LLC'}</h1>
            <p className="mt-5 max-w-lg text-base text-slate-600 sm:text-lg">{hero.subtitle || 'Expert Visa, Travel, Education and Immigration Consultancy Services for a Better Future Abroad.'}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <button className="btn-primary px-6 py-3" onClick={() => consult({ formType: 'hero_cta' })}>Get Free Consultation <ArrowRight className="h-4 w-4" /></button>
              <a href="#services" className="btn-outline px-6 py-3">Explore Our Services</a>
            </div>
          </div>
          <div className="lg:hidden">
            <Img src={hero.image || '/images/hero-landmarks.jpg'} alt="Airplane flying over world landmarks" className="h-56 w-full rounded-3xl object-cover sm:h-72" loading="eager" />
          </div>
        </div>
      </section>

      {/* ---------- QUICK INQUIRY ---------- */}
      <section className="container-x relative z-10 -mt-10 lg:-mt-14">
        <div className="card p-5 sm:p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg">Quick Inquiry — get a free assessment</h2>
            <p className="text-xs text-slate-500">Reply within one working day</p>
          </div>
          <LeadForm layout="row" formType="hero_quick_inquiry" submitLabel="Send" />
        </div>
      </section>

      {/* ---------- SERVICES ---------- */}
      <section id="services" className="scroll-mt-24 py-20">
        <div className="container-x">
          <SectionHeading title="Our Services" subtitle="Comprehensive solutions for your international journey" />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {services.isLoading ? Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-56" />)
              : (services.data || []).map((x) => <ServiceCard key={x._id} s={x} />)}
          </div>
        </div>
      </section>

      {/* ---------- TOURS ---------- */}
      <section className="bg-navy-50 py-16">
        <div className="container-x grid items-center gap-8 lg:grid-cols-[minmax(260px,340px)_1fr]">
          <div className="relative overflow-hidden rounded-3xl">
            <img src="/images/tour-banner.jpg" alt="Traveller looking over a coastal town" className="h-64 w-full object-cover object-top lg:h-[340px]" loading="lazy" />
            <div className="absolute inset-0 bg-gradient-to-t from-navy-950/85 via-navy-950/20 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-6 text-white">
              <p className="eyebrow mb-1 text-gold-500">Popular Packages</p>
              <h2 className="text-3xl text-white">Tour Packages</h2>
              <p className="mt-1 text-sm text-white/80">Discover the world with our curated travel packages.</p>
              <Link to="/tours" className="btn-gold mt-4">View All Packages <ArrowRight className="h-4 w-4" /></Link>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {tours.isLoading ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-72" />)
              : (tours.data || []).map((t) => <TourCard key={t._id} t={t} />)}
          </div>
        </div>
      </section>

      {/* ---------- DESTINATIONS ---------- */}
      <section className="py-20">
        <div className="container-x">
          <SectionHeading title="Visa Destination Explorer" subtitle="Country-wise guidance for study, visit, work and business visas" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {countries.isLoading ? Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-48" />)
              : (countries.data || []).map((c) => <CountryCard key={c._id} c={c} />)}
          </div>
          <div className="mt-8 text-center"><Link to="/destinations" className="btn-outline">See all destinations <ArrowRight className="h-4 w-4" /></Link></div>
        </div>
      </section>

      {/* ---------- EDUCATION ---------- */}
      <section className="bg-gradient-to-b from-white to-navy-50 pb-20">
        <div className="container-x">
          <SectionHeading title="Education Services" subtitle="Your future in the best hands" />
          <div className="grid items-stretch gap-6 lg:grid-cols-[1.1fr_1fr_1fr]">
            <img src="/images/education-students.jpg" alt="Graduating students in front of a university" className="h-72 w-full rounded-3xl object-cover lg:h-full lg:min-h-80" loading="lazy" />
            <div className="card flex flex-col justify-center p-6">
              <ul className="space-y-4">
                {EDU_POINTS.map((p) => <li key={p} className="flex items-center gap-3 font-medium text-navy-900"><CheckCircle2 className="h-5 w-5 shrink-0 text-navy-700" />{p}</li>)}
              </ul>
              <Link to="/education" className="btn-outline mt-6 self-start">Explore Education <ArrowRight className="h-4 w-4" /></Link>
            </div>
            <div className="flex flex-col justify-center rounded-3xl bg-navy-100/70 p-8 text-center">
              <Icon name="GraduationCap" className="mx-auto mb-3 h-12 w-12 text-navy-900" />
              <h3 className="text-xl">Study Medicine Abroad</h3>
              <p className="mt-2 text-sm text-slate-600">Compare medical universities by country, fees, language and entry requirements.</p>
              <div className="mt-5 flex flex-wrap justify-center gap-2">
                <Link to="/universities?medical=true" className="btn-primary">Medical University Finder</Link>
                <Link to="/scholarships" className="btn-outline">Scholarships</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- WHY + HOW ---------- */}
      <section className="py-20">
        <div className="container-x">
          <SectionHeading title="Why Choose LN PAK LLC?" subtitle="Your trusted partner for international services" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {WHY.map(([icon, t, d]) => (
              <div key={t} className="flex gap-4 rounded-2xl border border-slate-100 p-5">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-navy-900 text-white"><Icon name={icon} className="h-6 w-6" /></span>
                <div><h3 className="text-base">{t}</h3><p className="mt-1 text-sm text-slate-500">{d}</p></div>
              </div>
            ))}
          </div>

          <div className="mt-20 overflow-hidden rounded-3xl bg-navy-950 px-6 py-12 text-white sm:px-10">
            <SectionHeading light title="How It Works" subtitle="A clear, simple process from first message to final decision" />
            <ol className="grid gap-6 sm:grid-cols-2 lg:grid-cols-6">
              {STEPS.map(([t, d], i) => (
                <li key={t} className="relative">
                  <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-gold-500 font-bold text-navy-950">{i + 1}</span>
                  <h3 className="text-sm text-white">{t}</h3>
                  <p className="mt-1 text-xs text-white/65">{d}</p>
                </li>
              ))}
            </ol>
            <div className="mt-10 flex flex-col items-center justify-between gap-4 rounded-2xl bg-white/5 p-6 sm:flex-row">
              <div className="flex items-center gap-3"><Plane className="h-8 w-8 text-gold-500" /><p className="text-lg font-bold">Let's make your global dreams a reality</p></div>
              <button onClick={() => consult({ formType: 'how_it_works_cta' })} className="btn-gold">Contact Us Today <ArrowRight className="h-4 w-4" /></button>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- TESTIMONIALS ---------- */}
      {(testimonials.data || []).length > 0 && (
        <section className="bg-navy-50 py-20">
          <div className="container-x">
            <SectionHeading title="What Our Clients Say" subtitle="Experiences shared by our clients" />
            <div className="grid gap-5 md:grid-cols-3">
              {testimonials.data.map((t) => (
                <figure key={t._id} className="card flex gap-4 p-6">
                  <Img src={t.photo} alt={t.name} className="h-14 w-14 shrink-0 rounded-full object-cover" fallbackIcon="Users" />
                  <div>
                    <blockquote className="text-sm italic text-slate-600">“{t.quote}”</blockquote>
                    <figcaption className="mt-3">
                      <p className="font-bold text-navy-900">{t.name}</p>
                      <p className="text-xs text-slate-500">{t.service}</p>
                      <p className="mt-1 flex gap-0.5" aria-label={`${t.rating} out of 5`}>{Array.from({ length: t.rating || 5 }).map((_, i) => <Star key={i} className="h-4 w-4 fill-gold-500 text-gold-500" />)}</p>
                    </figcaption>
                  </div>
                </figure>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ---------- FAQ ---------- */}
      {(faqs.data || []).length > 0 && (
        <section className="py-20">
          <div className="container-x max-w-3xl">
            <SectionHeading title="Frequently Asked Questions" />
            <div className="space-y-3">
              {faqs.data.map((f) => (
                <details key={f._id} className="group card px-5 py-4 open:shadow-lift">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-navy-900">
                    {f.title}<ChevronDown className="h-5 w-5 shrink-0 transition group-open:rotate-180" />
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600">{f.answer}</p>
                </details>
              ))}
            </div>
            <p className="mt-6 text-center text-sm text-slate-500">More questions? <Link className="font-semibold text-navy-700 underline" to="/contact">Contact our team</Link></p>
          </div>
        </section>
      )}
      <div className="pb-24" />
    </>
  );
}
