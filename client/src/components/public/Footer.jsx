import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Mail, Phone, MapPin, Clock, Send, CheckCircle2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api, getData } from '../../lib/api';
import { useSettings } from '../../hooks/useSettings';
import SocialIcons from './SocialIcons';
import { Spinner } from '../ui';
import { getOffices } from '../../lib/constants';

export function Newsletter() {
  const [email, setEmail] = useState('');
  const [state, setState] = useState({ status: 'idle', msg: '' });
  const { pathname } = useLocation();
  const submit = async (e) => {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email)) return setState({ status: 'error', msg: 'Please enter a valid email' });
    setState({ status: 'loading' });
    try {
      await api.post('/newsletter', { email, sourcePage: pathname });
      setState({ status: 'done', msg: 'Subscribed! You will receive our latest updates.' });
      setEmail('');
    } catch (err) {
      setState({ status: 'error', msg: err.message });
    }
  };
  return (
    <section className="container-x relative z-10 -mb-14">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-navy-900 to-navy-700 px-6 py-7 shadow-lift sm:px-10">
        <div className="pointer-events-none absolute -right-10 -top-16 h-56 w-56 rounded-full bg-white/5" />
        <div className="relative grid items-center gap-5 lg:grid-cols-[auto_1fr_minmax(320px,440px)]">
          <div className="hidden h-12 w-12 items-center justify-center rounded-2xl bg-white/10 lg:flex"><Mail className="h-6 w-6 text-white" /></div>
          <div>
            <h3 className="text-lg text-white sm:text-xl">Stay Updated with Latest Visa, Travel & Education Opportunities</h3>
            <p className="text-sm text-white/70">Subscribe to our newsletter and get the latest updates.</p>
          </div>
          <form onSubmit={submit} className="w-full" noValidate>
            {state.status === 'done' ? (
              <p className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-3 text-sm text-white"><CheckCircle2 className="h-4 w-4 text-gold-500" />{state.msg}</p>
            ) : (
              <div className="flex rounded-full bg-white p-1.5">
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter your email address" aria-label="Email address" className="min-w-0 flex-1 rounded-full px-4 text-sm text-slate-800 outline-none" />
                <button className="btn-primary px-5" disabled={state.status === 'loading'}>
                  {state.status === 'loading' ? <Spinner className="h-4 w-4 text-white" /> : <Send className="h-4 w-4 sm:hidden" />}<span className="hidden sm:inline">Subscribe</span>
                </button>
              </div>
            )}
            {state.status === 'error' && <p className="mt-2 pl-4 text-xs text-gold-500">{state.msg}</p>}
          </form>
        </div>
      </div>
    </section>
  );
}

export default function Footer() {
  const s = useSettings();
  const { data: services } = useQuery({ queryKey: ['content', 'services', 'footer'], queryFn: () => getData('/content/services', { limit: 8 }), staleTime: 600000 });
  const { data: countries } = useQuery({ queryKey: ['content', 'countries', 'footer'], queryFn: () => getData('/content/countries', { footer: 'true', limit: 6 }), staleTime: 600000 });
  const head = 'mb-4 text-sm font-bold text-white';
  const link = 'text-sm text-white/70 transition hover:text-gold-500';
  return (
    <>
      <Newsletter />
      <footer className="bg-navy-950 pt-24 text-white">
        <div className="container-x grid gap-10 pb-12 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr_1.3fr]">
          <div>
            <div className="mb-4 flex items-center gap-3">
              <span className="rounded-2xl bg-white p-1.5"><img src="/logo.jpg" alt="LN PAK LLC logo" className="h-14 w-auto" loading="lazy" /></span>
              <span><span className="block font-serif text-2xl font-bold">LN PAK LLC</span><span className="text-xs text-white/70">Your Global Journey Partner</span></span>
            </div>
            <p className="max-w-xs text-sm leading-relaxed text-white/70">{s.footerAbout || 'Expert visa, travel, education and immigration consultancy.'}</p>
            <div className="mt-5 text-white/80"><SocialIcons social={s.social} className="h-5 w-5" linkClass="hover:text-gold-500" /></div>
          </div>
          <div>
            <p className={head}>Quick Links</p>
            <ul className="space-y-2">
              {[['/', 'Home'], ['/services', 'Services'], ['/tours', 'Travel & Tourism'], ['/education', 'Education'], ['/universities', 'Universities'], ['/scholarships', 'Scholarships'], ['/about', 'About Us'], ['/contact', 'Contact Us']].map(([to, l]) => <li key={to}><Link className={link} to={to}>{l}</Link></li>)}
            </ul>
          </div>
          <div>
            <p className={head}>Our Services</p>
            <ul className="space-y-2">{(services || []).map((x) => <li key={x._id}><Link className={link} to={`/services/${x.slug}`}>{x.title}</Link></li>)}</ul>
          </div>
          <div>
            <p className={head}>Popular Destinations</p>
            <ul className="space-y-2">{(countries || []).map((x) => <li key={x._id}><Link className={link} to={`/destinations/${x.slug}`}>{x.name}</Link></li>)}</ul>
          </div>
          <div>
            <p className={head}>Contact Us</p>
            <ul className="space-y-3 text-sm text-white/75">
              {s.contact?.phone && <li><a className="flex gap-3 hover:text-gold-500" href={`tel:${s.contact.phone.replace(/\s/g, '')}`}><Phone className="h-4 w-4 shrink-0 text-gold-500" />{s.contact.phone}</a></li>}
              {s.contact?.email && <li><a className="flex gap-3 hover:text-gold-500" href={`mailto:${s.contact.email}`}><Mail className="h-4 w-4 shrink-0 text-gold-500" />{s.contact.email}</a></li>}
              {getOffices(s.contact).map((o, i) => (
                <li key={i} className="flex gap-3"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold-500" /><span>{o.name && <span className="block font-semibold text-white/90">{o.name}</span>}{o.address}</span></li>
              ))}
              {s.contact?.officeHours && <li className="flex gap-3"><Clock className="h-4 w-4 shrink-0 text-gold-500" />{s.contact.officeHours}</li>}
            </ul>
          </div>
        </div>
        <div className="border-t border-white/10">
          <div className="container-x flex flex-col items-center justify-between gap-3 py-5 text-xs text-white/60 sm:flex-row">
            <p>© {new Date().getFullYear()} LN PAK LLC. All Rights Reserved.</p>
            <div className="flex gap-4">
              <Link to="/privacy-policy" className="hover:text-white">Privacy Policy</Link>
              <Link to="/terms" className="hover:text-white">Terms & Conditions</Link>
              <Link to="/refund-policy" className="hover:text-white">Refund Policy</Link>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
