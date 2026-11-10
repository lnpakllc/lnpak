import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useLocation } from 'react-router-dom';
import { CheckCircle2, Send, MessageCircle } from 'lucide-react';
import { api } from '../lib/api';
import { getUtm } from '../lib/utm';
import { SERVICES, DESTINATIONS, whatsappLink } from '../lib/constants';
import { useSettings } from '../hooks/useSettings';
import { Spinner } from './ui';

const schema = z.object({
  fullName: z.string().trim().min(2, 'Please enter your full name').max(120),
  email: z.string().trim().email('Please enter a valid email'),
  phone: z.string().trim().min(7, 'Please enter a valid phone / WhatsApp number').max(30).regex(/^[+0-9 ()-]+$/, 'Digits, spaces and + - ( ) only'),
  service: z.string(),
  destination: z.string().max(80).optional(),
  message: z.string().max(4000).optional(),
  website: z.string().optional(), // honeypot
});

/**
 * Every lead form on the website. It posts to /api/leads which creates a lead in the admin CRM.
 * Props let each page pre-select the service / destination and record which form was used.
 */
export default function LeadForm({
  service = 'general', destination = '', reference, formType = 'website_form', showService = true,
  showDestination = true, layout = 'stack', submitLabel = 'Get Free Consultation', messagePlaceholder = 'Tell us briefly what you need…', onSuccess,
}) {
  const location = useLocation();
  const settings = useSettings();
  const startedAt = useRef(Date.now());
  const [done, setDone] = useState(null);
  const [serverError, setServerError] = useState('');
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { service, destination, fullName: '', email: '', phone: '', message: '', website: '' },
  });

  const submit = async (values) => {
    setServerError('');
    try {
      const r = await api.post('/leads', {
        ...values,
        destination: values.destination || undefined,
        message: values.message || undefined,
        formType,
        reference,
        sourcePage: location.pathname,
        utm: getUtm(),
        startedAt: startedAt.current,
      });
      setDone(r.data.data);
      reset();
      onSuccess?.(r.data.data);
    } catch (e) {
      setServerError(e.message);
    }
  };

  if (done) {
    return (
      <div className="rounded-2xl bg-emerald-50 p-6 text-center" role="status">
        <CheckCircle2 className="mx-auto mb-3 h-12 w-12 text-emerald-600" />
        <h3 className="text-lg">Thank you! Your inquiry has been received.</h3>
        {done.code !== 'RECEIVED' && <p className="mt-1 text-sm text-slate-600">Reference: <strong>{done.code}</strong></p>}
        <p className="mt-2 text-sm text-slate-600">Our consultant will contact you shortly{done.duplicate ? ' — we already had your earlier request and have added this to it.' : '.'}</p>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {settings.contact?.whatsapp && (
            <a className="btn bg-emerald-600 text-white hover:bg-emerald-700" href={whatsappLink(settings.contact.whatsapp, `Hello, my inquiry reference is ${done.code}`)} target="_blank" rel="noreferrer">
              <MessageCircle className="h-4 w-4" /> Chat on WhatsApp
            </a>
          )}
          <button className="btn-outline" onClick={() => { setDone(null); startedAt.current = Date.now(); }}>Send another inquiry</button>
        </div>
      </div>
    );
  }

  const grid = layout === 'row' ? 'grid gap-3 sm:grid-cols-2 lg:grid-cols-6 lg:items-start' : layout === 'narrow' ? 'grid gap-3' : 'grid gap-3 sm:grid-cols-2';
  const wide = layout === 'row' ? 'sm:col-span-2 lg:col-span-6' : layout === 'narrow' ? '' : 'sm:col-span-2';

  return (
    <form onSubmit={handleSubmit(submit)} noValidate className={grid}>
      {/* Honeypot: hidden from people, bots fill it in */}
      <input type="text" tabIndex={-1} autoComplete="off" aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 opacity-0" {...register('website')} />

      <div className={layout === 'row' ? 'lg:col-span-1' : ''}>
        <input className="input" placeholder="Full name *" autoComplete="name" aria-label="Full name" {...register('fullName')} />
        {errors.fullName && <p className="field-error">{errors.fullName.message}</p>}
      </div>
      <div className={layout === 'row' ? 'lg:col-span-1' : ''}>
        <input className="input" type="email" placeholder="Email *" autoComplete="email" aria-label="Email" {...register('email')} />
        {errors.email && <p className="field-error">{errors.email.message}</p>}
      </div>
      <div className={layout === 'row' ? 'lg:col-span-1' : ''}>
        <input className="input" type="tel" placeholder="Phone / WhatsApp *" autoComplete="tel" aria-label="Phone or WhatsApp" {...register('phone')} />
        {errors.phone && <p className="field-error">{errors.phone.message}</p>}
      </div>
      {showService ? (
        <div className={layout === 'row' ? 'lg:col-span-1' : ''}>
          <select className="input" aria-label="Interested service" {...register('service')}>
            {SERVICES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
      ) : <input type="hidden" {...register('service')} />}
      {showDestination ? (
        <div className={layout === 'row' ? 'lg:col-span-1' : ''}>
          <select className="input" aria-label="Destination country" {...register('destination')}>
            <option value="">Destination country</option>
            {[...new Set([destination, ...DESTINATIONS].filter(Boolean))].map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
      ) : <input type="hidden" {...register('destination')} />}
      {layout === 'row' ? (
        <button type="submit" disabled={isSubmitting} className="btn-gold w-full py-3 lg:col-span-1">
          {isSubmitting ? <Spinner className="h-4 w-4 text-navy-950" /> : <Send className="h-4 w-4" />} {submitLabel}
        </button>
      ) : (
        <>
          <div className={wide}>
            <textarea rows={3} className="input resize-none" placeholder={messagePlaceholder} aria-label="Message" {...register('message')} />
          </div>
          <button type="submit" disabled={isSubmitting} className={`btn-primary w-full py-3 ${wide}`}>
            {isSubmitting ? <Spinner className="h-4 w-4 text-white" /> : <Send className="h-4 w-4" />} {isSubmitting ? 'Sending…' : submitLabel}
          </button>
        </>
      )}
      {serverError && <p className={`field-error ${wide}`} role="alert">{serverError}</p>}
      <p className={`text-[11px] text-slate-400 ${wide}`}>Free assessment · No obligation · Your details stay private.</p>
    </form>
  );
}
