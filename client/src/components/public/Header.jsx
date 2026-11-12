import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Mail, Phone, MapPin, Clock, ChevronDown, Menu, X, ArrowRight, UserCircle2 } from 'lucide-react';
import { useSettings } from '../../hooks/useSettings';
import { useConsult } from '../../context/ConsultContext';
import { useAuth } from '../../context/AuthContext';
import SocialIcons from './SocialIcons';

export const NAV = [
  { to: '/', label: 'Home', end: true },
  {
    label: 'Services', to: '/services',
    children: [
      ['/services/study-visa', 'Study Visa'], ['/services/visit-visa', 'Visit Visa'], ['/services/business-visa', 'Business Visa'],
      ['/services/work-permit', 'Work Permit'], ['/services/business-setup-and-relocation', 'Business Setup & Relocation'], ['/services/hajj-and-umrah', 'Hajj & Umrah'],
      ['/services/documentation-services', 'Documentation'], ['/services', 'All services →'],
    ],
  },
  { to: '/destinations', label: 'Visa Destinations' },
  { to: '/tours', label: 'Travel & Tourism' },
  {
    label: 'Education', to: '/education',
    children: [['/education', 'Study Abroad'], ['/universities', 'Universities'], ['/universities?medical=true', 'Medical University Finder'], ['/scholarships', 'Scholarships']],
  },
  { to: '/about', label: 'About Us' },
  { to: '/contact', label: 'Contact Us' },
];

export default function Header() {
  const s = useSettings();
  const consult = useConsult();
  const { isClient } = useAuth();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => { setOpen(false); }, [location.pathname, location.search]);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const linkCls = ({ isActive }) => `whitespace-nowrap rounded-full px-2.5 py-2 text-[13px] font-semibold transition ${isActive ? 'bg-navy-900 text-white' : 'text-navy-900 hover:bg-navy-50'}`;

  return (
    <>
      {/* Top info bar */}
      <div className="hidden bg-navy-950 text-[12px] text-white/85 md:block">
        <div className="container-x flex h-9 items-center justify-between">
          <div className="flex items-center gap-6">
            {s.contact?.email && <a href={`mailto:${s.contact.email}`} className="flex items-center gap-1.5 hover:text-white"><Mail className="h-3.5 w-3.5" />{s.contact.email}</a>}
            {s.contact?.phone && <a href={`tel:${s.contact.phone.replace(/\s/g, '')}`} className="flex items-center gap-1.5 hover:text-white"><Phone className="h-3.5 w-3.5" />{s.contact.phone}</a>}
            {s.contact?.address && <span className="hidden items-center gap-1.5 lg:flex"><MapPin className="h-3.5 w-3.5" />{s.contact.address}</span>}
            {s.contact?.officeHours && <span className="hidden items-center gap-1.5 xl:flex"><Clock className="h-3.5 w-3.5" />{s.contact.officeHours}</span>}
          </div>
          <div className="flex items-center gap-3"><span className="text-white/60">Follow us:</span><SocialIcons social={s.social} className="h-3.5 w-3.5" /></div>
        </div>
      </div>

      <header className={`sticky top-0 z-50 border-b bg-white/95 backdrop-blur transition ${scrolled ? 'border-slate-200 shadow-sm' : 'border-transparent'}`}>
        <div className="container-x flex h-[72px] items-center justify-between gap-4 lg:h-20">
          <Link to="/" className="flex shrink-0 items-center gap-3" aria-label="LN PAK LLC home">
            <img src="/logo.jpg" alt="LN PAK LLC logo" className="h-12 w-auto lg:h-14" width="66" height="56" />
            <span className="leading-tight">
              <span className="block font-serif text-xl font-bold tracking-tight text-navy-900 lg:text-2xl">LN PAK LLC</span>
              <span className="hidden text-[11px] font-medium text-navy-700 sm:block xl:hidden 2xl:block">Your Global Journey Partner</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-0.5 xl:flex" aria-label="Main">
            {NAV.map((item) =>
              item.children ? (
                <div key={item.label} className="group relative">
                  <NavLink to={item.to} className={linkCls}>
                    <span className="inline-flex items-center gap-1">{item.label}<ChevronDown className="h-3.5 w-3.5 transition group-hover:rotate-180" /></span>
                  </NavLink>
                  <div className="invisible absolute left-0 top-full z-50 pt-2 opacity-0 transition group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
                    <div className="w-60 rounded-2xl border border-slate-100 bg-white p-2 shadow-lift">
                      {item.children.map(([to, label]) => (
                        <Link key={to + label} to={to} className="block rounded-xl px-3 py-2 text-sm text-slate-700 hover:bg-navy-50 hover:text-navy-900">{label}</Link>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <NavLink key={item.to} to={item.to} end={item.end} className={linkCls}>{item.label}</NavLink>
              ),
            )}
          </nav>

          <div className="flex items-center gap-2">
            <Link to={isClient ? '/client' : '/client/login'} className="btn-ghost hidden whitespace-nowrap px-3 lg:inline-flex" title={isClient ? 'My Portal' : 'Client Login'}><UserCircle2 className="h-4 w-4" /><span className="xl:hidden 2xl:inline">{isClient ? 'My Portal' : 'Client Login'}</span></Link>
            <button onClick={() => consult({ formType: 'header_cta' })} className="btn-primary hidden whitespace-nowrap sm:inline-flex">Get Free Consultation <ArrowRight className="h-4 w-4" /></button>
            <button className="rounded-full p-2 text-navy-900 hover:bg-navy-50 xl:hidden" onClick={() => setOpen((o) => !o)} aria-label="Menu" aria-expanded={open}>
              {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {open && (
          <div className="max-h-[calc(100vh-72px)] overflow-y-auto border-t border-slate-100 bg-white xl:hidden">
            <nav className="container-x space-y-1 py-4" aria-label="Mobile">
              {NAV.map((item) => (
                <div key={item.label}>
                  <NavLink to={item.to} end={item.end} className={({ isActive }) => `block rounded-xl px-3 py-2.5 font-semibold ${isActive ? 'bg-navy-50 text-navy-900' : 'text-slate-700'}`}>{item.label}</NavLink>
                  {item.children && (
                    <div className="ml-3 grid grid-cols-2 gap-1 border-l border-slate-100 pl-3">
                      {item.children.map(([to, label]) => <Link key={to + label} to={to} className="rounded-lg px-2 py-1.5 text-sm text-slate-600">{label}</Link>)}
                    </div>
                  )}
                </div>
              ))}
              <div className="grid gap-2 pt-3 sm:grid-cols-2">
                <button onClick={() => consult({ formType: 'mobile_menu_cta' })} className="btn-primary w-full">Get Free Consultation</button>
                <Link to={isClient ? '/client' : '/client/login'} className="btn-outline w-full">{isClient ? 'My Portal' : 'Client Login'}</Link>
              </div>
            </nav>
          </div>
        )}
      </header>
    </>
  );
}
