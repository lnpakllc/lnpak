import { Mail, Phone, MapPin, Clock, MessageCircle, Target, Eye } from 'lucide-react';
import { useSettings } from '../../hooks/useSettings';
import { paragraphs, whatsappLink } from '../../lib/constants';
import { Seo, Icon } from '../../components/ui';
import { PageHero } from '../../components/public/PublicLayout';
import LeadForm from '../../components/LeadForm';

const VALUE_ICONS = ['ShieldCheck', 'Award', 'Globe2', 'Heart', 'CheckCircle2', 'Handshake'];

export function AboutPage() {
  const s = useSettings();
  const a = s.about || {};
  return (
    <>
      <Seo title="About Us" description={a.mission || 'About LN PAK LLC — visa, travel, education and immigration consultancy.'} />
      <PageHero eyebrow="About LN PAK LLC" title={a.title || 'About LN PAK LLC'} subtitle="International education and consultancy company, established in 2019." image="/images/hero-landmarks.jpg" />
      <section className="container-x grid gap-12 py-16 lg:grid-cols-[1.3fr_1fr]">
        <div className="prose-body text-lg text-slate-600">{paragraphs(a.body).map((p, i) => <p key={i}>{p}</p>)}</div>
        <div className="space-y-4">
          {a.mission && <div className="card flex gap-4 p-6"><Target className="h-8 w-8 shrink-0 text-gold-600" /><div><h2 className="text-lg">Our Mission</h2><p className="mt-1 text-sm text-slate-600">{a.mission}</p></div></div>}
          {a.vision && <div className="card flex gap-4 p-6"><Eye className="h-8 w-8 shrink-0 text-gold-600" /><div><h2 className="text-lg">Our Vision</h2><p className="mt-1 text-sm text-slate-600">{a.vision}</p></div></div>}
          <div className="rounded-2xl bg-navy-950 p-6 text-white">
            <img src="/logo.jpg" alt="LN PAK LLC logo" className="mb-4 h-20 rounded-xl bg-white p-1" />
            <p className="text-sm text-white/80">Student recruitment, university admissions, institutional partnerships, tourism and international business facilitation.</p>
          </div>
        </div>
      </section>
      {a.values?.length > 0 && (
        <section className="bg-navy-50 py-16">
          <div className="container-x">
            <h2 className="mb-8 text-center text-2xl sm:text-3xl">Core Values</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {a.values.map((v, i) => (
                <div key={v} className="card flex items-center gap-4 p-5">
                  <Icon name={VALUE_ICONS[i % VALUE_ICONS.length]} className="h-8 w-8 shrink-0 text-navy-700" />
                  <h3 className="text-base">{v}</h3>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
      <div className="pb-24" />
    </>
  );
}

export function ContactPage() {
  const s = useSettings();
  const c = s.contact || {};
  const items = [
    [Phone, 'Call us', c.phone, c.phone && `tel:${c.phone.replace(/\s/g, '')}`],
    [MessageCircle, 'WhatsApp', c.whatsapp && ((c.phone || '').replace(/\D/g, '') === c.whatsapp ? c.phone : `+${c.whatsapp}`), c.whatsapp && whatsappLink(c.whatsapp)],
    [Mail, 'Email', c.email, c.email && `mailto:${c.email}`],
    [MapPin, 'Office', c.address, c.mapUrl],
    [Clock, 'Office hours', c.officeHours],
  ].filter(([, , v]) => v);
  return (
    <>
      <Seo title="Contact Us" description="Contact LN PAK LLC for a free visa, travel or education consultation." />
      <PageHero eyebrow="Contact Us" title="Let's talk about your plans" subtitle="Send a message, call, or WhatsApp us — the first assessment is free." />
      <section className="container-x grid gap-10 py-14 lg:grid-cols-[1fr_1.3fr]">
        <div className="space-y-3">
          {items.map(([I, l, v, href]) => {
            const body = <><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-navy-50 text-navy-900"><I className="h-5 w-5" /></span><span><span className="block text-xs text-slate-500">{l}</span><span className="font-semibold text-navy-900">{v}</span></span></>;
            return href ? <a key={l} href={href} target={href.startsWith('http') ? '_blank' : undefined} rel="noreferrer" className="card flex items-center gap-4 p-4 transition hover:shadow-lift">{body}</a> : <div key={l} className="card flex items-center gap-4 p-4">{body}</div>;
          })}
        </div>
        <div className="card p-6 sm:p-8">
          <h2 className="text-xl">Send us a message</h2>
          <p className="mb-5 mt-1 text-sm text-slate-500">We reply within one working day.</p>
          <LeadForm formType="contact_page" submitLabel="Send Message" />
        </div>
      </section>
      <div className="pb-24" />
    </>
  );
}

const POLICY = { privacy: 'Privacy Policy', terms: 'Terms & Conditions', refund: 'Refund Policy' };
export function PolicyPage({ page }) {
  const s = useSettings();
  const text = s.pages?.[page];
  return (
    <>
      <Seo title={POLICY[page]} />
      <PageHero title={POLICY[page]} />
      <section className="container-x max-w-3xl py-14">
        <div className="prose-body text-slate-600">{text ? paragraphs(text).map((p, i) => <p key={i}>{p}</p>) : <p>This page is being updated.</p>}</div>
      </section>
      <div className="pb-24" />
    </>
  );
}
