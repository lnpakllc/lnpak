import { Suspense, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import Header from './Header';
import Footer from './Footer';
import { useSettings } from '../../hooks/useSettings';
import { whatsappLink } from '../../lib/constants';
import { PageLoader } from '../ui';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

export default function PublicLayout() {
  const s = useSettings();
  return (
    <div className="flex min-h-screen flex-col">
      <ScrollToTop />
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded focus:bg-white focus:px-3 focus:py-2">Skip to content</a>
      <Header />
      <main id="main" className="flex-1">
        <Suspense fallback={<PageLoader />}><Outlet /></Suspense>
      </main>
      <Footer />
      {s.contact?.whatsapp && (
        <a href={whatsappLink(s.contact.whatsapp)} target="_blank" rel="noreferrer" aria-label="Chat with us on WhatsApp"
          className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lift transition hover:scale-105 hover:bg-emerald-600">
          <MessageCircle className="h-7 w-7" />
        </a>
      )}
    </div>
  );
}

export function PageHero({ eyebrow, title, subtitle, image, children }) {
  return (
    <section className="relative overflow-hidden bg-navy-950 text-white">
      {image && <img src={image} alt="" className="absolute inset-0 h-full w-full object-cover opacity-25" />}
      <div className="absolute inset-0 bg-gradient-to-r from-navy-950 via-navy-950/90 to-navy-900/60" />
      <div className="container-x relative py-14 sm:py-20">
        {eyebrow && <p className="eyebrow mb-3 text-gold-500">{eyebrow}</p>}
        <h1 className="max-w-3xl text-3xl text-white sm:text-4xl lg:text-5xl">{title}</h1>
        {subtitle && <p className="mt-4 max-w-2xl text-base text-white/75 sm:text-lg">{subtitle}</p>}
        {children}
      </div>
    </section>
  );
}
