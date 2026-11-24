import { useSearchParams } from 'react-router-dom';
import { Search } from 'lucide-react';
import { Seo, SectionHeading, Icon, Img } from '../../components/ui';
import { PageHero } from '../../components/public/PublicLayout';
import FaqSection from '../../components/public/FaqSection';
import LeadForm from '../../components/LeadForm';
import { UniversitiesFinder, ScholarshipsFinder } from './FinderPages';

const HELP = [
  ['Compass', 'Study Abroad Consultancy', 'Choose the right country, course and budget with a clear plan.'],
  ['Building2', 'International University Admissions', 'Application preparation and submission to partner and other universities.'],
  ['Stethoscope', 'Medical University Search', 'Compare MBBS / MD programmes by country, fees and requirements.'],
  ['Award', 'Scholarship Assistance', 'Find scholarships you are eligible for and prepare strong applications.'],
  ['FileText', 'Student Visa Guidance', 'Complete visa file preparation and interview practice.'],
  ['BookOpen', 'Course Selection & Counseling', 'One-to-one counseling for subject and career choices.'],
];

// One page for study abroad: universities and scholarships side by side as tabs, each with its own filters.
export default function EducationScholarshipsPage() {
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') === 'scholarships' ? 'scholarships' : 'universities';
  const { tab: _t, ...filters } = Object.fromEntries(params.entries());

  const set = (k, v) => {
    const p = new URLSearchParams(params);
    if (v === '' || v == null || v === false) p.delete(k); else p.set(k, v);
    if (k !== 'page') p.delete('page');
    setParams(p, { replace: true });
  };
  const clear = () => setParams(tab === 'scholarships' ? { tab } : {}, { replace: true });
  const switchTab = (next) => setParams(next === 'scholarships' ? { tab: next } : {}, { replace: true });
  const medical = filters.medical === 'true';

  return (
    <>
      <Seo title="Education & Scholarships" description="Search universities and scholarships by country, language, tuition fee and funding type — and apply with LN PAK's help." />
      <PageHero eyebrow="Education & Scholarships" title={medical ? 'Medical University Finder' : 'Universities & Scholarships'} subtitle="Compare universities by country, language and tuition fee, and find fully funded, partially funded and institutional scholarships — then apply with our help." image="/images/education-students.jpg">
        <label className="relative mt-8 block max-w-xl"><Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
          <input key={tab} defaultValue={filters.q} onChange={(e) => set('q', e.target.value)} className="input pl-10" placeholder={tab === 'scholarships' ? 'Search scholarship, provider or country…' : 'Search university name or city…'} aria-label="Search" />
        </label>
      </PageHero>

      <div className="border-b border-slate-100 bg-white">
        <div className="container-x flex gap-2 py-3" role="tablist">
          {[['universities', 'Universities'], ['scholarships', 'Scholarships']].map(([k, l]) => (
            <button key={k} role="tab" aria-selected={tab === k} onClick={() => switchTab(k)} className={`rounded-full px-5 py-2 text-sm font-semibold transition ${tab === k ? 'bg-navy-900 text-white' : 'bg-navy-50 text-navy-900 hover:bg-navy-100'}`}>{l}</button>
          ))}
        </div>
      </div>

      {tab === 'universities' ? <UniversitiesFinder f={filters} set={set} clear={clear} /> : <ScholarshipsFinder f={filters} set={set} clear={clear} />}

      <section className="container-x py-12">
        <SectionHeading title="How we help students" />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {HELP.map(([icon, t, d]) => (
            <div key={t} className="card p-6"><span className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-navy-50 text-navy-900"><Icon name={icon} className="h-6 w-6" /></span><h3 className="text-lg">{t}</h3><p className="mt-1 text-sm text-slate-500">{d}</p></div>
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
      <FaqSection page="education-scholarships" className="py-16" />
      <div className="pb-24" />
    </>
  );
}
