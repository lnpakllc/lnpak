import { Seo, SectionHeading, Icon } from '../../components/ui';
import { PageHero } from '../../components/public/PublicLayout';
import FaqSection from '../../components/public/FaqSection';
import LeadForm from '../../components/LeadForm';
import { useI18n } from '../../context/I18nContext';

// Draft service copy: edit the wording here to match the exact services LN PAK offers.
const SERVICES = [
  ['BookOpen', 'Research Guidance', 'Choosing a topic, shaping a research question and planning the work from proposal to submission.'],
  ['FileText', 'Literature Review & Referencing', 'Finding credible sources, organising the review and citing correctly in the style your university requires.'],
  ['Compass', 'Research Proposals & Study Plans', 'Clear, well-structured proposals and statements of purpose for admissions and scholarship applications.'],
  ['Award', 'Publication & Journal Support', 'Formatting, journal selection and guidance on responding to reviewers.'],
  ['Briefcase', 'Professional Documents', 'CVs, cover letters, recommendation-letter guidance and professional profiles that present your work well.'],
  ['Users', 'One-to-One Mentoring', 'Regular sessions with an experienced mentor to keep your research or career plan on track.'],
];

export default function ResearchSupportPage() {
  const { t } = useI18n();
  return (
    <>
      <Seo title={t('Academic Research & Professional Support')} description="Research guidance, proposals, publication support and professional documents for students and professionals." />
      <PageHero eyebrow={t('Academic & Professional')} title={t('Academic Research & Professional Support')} subtitle={t('Guidance for students and professionals — from your first research idea to a polished proposal, paper or professional profile.')} image="/images/education-students.jpg" />
      <section className="container-x py-16">
        <SectionHeading title={t('How we can support you')} subtitle={t('We guide and coach you. The work, and the credit for it, stays yours.')} />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICES.map(([icon, title, d]) => (
            <div key={title} className="card p-6"><span className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-navy-50 text-navy-900"><Icon name={icon} className="h-6 w-6" /></span><h3 className="text-lg">{t(title)}</h3><p className="mt-1 text-sm text-slate-500">{t(d)}</p></div>
          ))}
        </div>
      </section>
      <section className="bg-navy-50 py-16">
        <div className="container-x mx-auto max-w-2xl">
          <div className="card p-6">
            <h2 className="text-xl">{t('Tell us what you need')}</h2>
            <p className="mb-4 mt-1 text-sm text-slate-500">{t('Share your topic or goal and our team will reply within one working day. Your request goes straight to our admin team.')}</p>
            <LeadForm service="research_support" formType="research_support_page" submitLabel={t('Send Request')} messagePlaceholder={t('Your field, what you need help with and any deadline…')} />
          </div>
        </div>
      </section>
      <FaqSection page="research-support" className="py-16" />
      <div className="pb-24" />
    </>
  );
}
