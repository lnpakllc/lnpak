import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ChevronDown } from 'lucide-react';
import { getData } from '../../lib/api';
import { SectionHeading } from '../ui';
import FormattedText from '../FormattedText';

// FAQs managed in Admin → FAQs. With `page`, only questions assigned to that page are shown (grouped by category).
// Without `page` it shows every question (the /faq page) with category filters. Renders nothing when there are none.
export default function FaqSection({ page, title = 'Frequently Asked Questions', filter = false, className = 'bg-navy-50 py-16' }) {
  const { data } = useQuery({ queryKey: ['content', 'faqs', page || 'all'], queryFn: () => getData('/content/faqs', { page, limit: 100 }), staleTime: 5 * 60 * 1000 });
  const cats = useQuery({ queryKey: ['content', 'faqCategories'], queryFn: () => getData('/content/faqCategories', { limit: 100 }), staleTime: 5 * 60 * 1000 });
  const [open, setOpen] = useState(null);
  const [cat, setCat] = useState('');
  const faqs = data || [];
  if (!faqs.length) return null;

  const order = (cats.data || []).map((c) => c.name);
  const names = [...new Set(faqs.map((f) => f.category || 'General'))].sort((a, b) => (order.indexOf(a) + 1 || 999) - (order.indexOf(b) + 1 || 999));
  const shown = names.filter((n) => !cat || n === cat);

  return (
    <section className={className} aria-labelledby={`faq-${page || 'all'}`}>
      <div className="container-x max-w-3xl">
        <SectionHeading eyebrow="FAQ" title={title} />
        {filter && names.length > 1 && (
          <div className="mb-6 flex flex-wrap justify-center gap-2">
            {['', ...names].map((n) => <button key={n || 'all'} onClick={() => setCat(n)} className={`rounded-full px-4 py-1.5 text-sm font-semibold ${cat === n ? 'bg-navy-900 text-white' : 'bg-white text-navy-900 hover:bg-navy-100'}`}>{n || 'All'}</button>)}
          </div>
        )}
        <div className="space-y-8">
          {shown.map((n) => (
            <div key={n}>
              {names.length > 1 && <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-navy-700">{n}</h3>}
              <div className="space-y-3">
                {faqs.filter((f) => (f.category || 'General') === n).map((f) => (
                  <div key={f._id} className="card overflow-hidden">
                    <button className="flex w-full items-center justify-between gap-3 p-4 text-left font-semibold text-navy-900" aria-expanded={open === f._id} onClick={() => setOpen(open === f._id ? null : f._id)}>
                      {f.title}<ChevronDown className={`h-5 w-5 shrink-0 transition ${open === f._id ? 'rotate-180' : ''}`} />
                    </button>
                    {open === f._id && <div className="border-t border-slate-100 p-4"><FormattedText text={f.answer} /></div>}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        {page && <p className="mt-6 text-center text-sm text-slate-500">More questions? <Link className="font-semibold text-navy-700 underline" to="/faq">See all FAQs</Link> or <Link className="font-semibold text-navy-700 underline" to="/contact">contact our team</Link></p>}
      </div>
    </section>
  );
}
