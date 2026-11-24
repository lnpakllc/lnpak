import { Seo } from '../../components/ui';
import { PageHero } from '../../components/public/PublicLayout';
import FaqSection from '../../components/public/FaqSection';

export default function FaqPage() {
  return (
    <>
      <Seo title="Frequently Asked Questions" description="Answers to common questions about visas, study abroad, scholarships, tours and our services." />
      <PageHero eyebrow="Help" title="Frequently Asked Questions" subtitle="Answers to the questions we hear most. Cannot find yours? Our team is happy to help." />
      <FaqSection title="All questions" filter className="py-16" />
      <div className="pb-24" />
    </>
  );
}
