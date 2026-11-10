import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import PublicLayout from './components/public/PublicLayout';
import Home from './pages/public/Home';
import NotFound from './pages/public/NotFound';
import { PageLoader } from './components/ui';

// Public pages (split so the homepage loads fast)
const ServicesPages = () => import('./pages/public/ServicesPages');
const DestinationPages = () => import('./pages/public/DestinationPages');
const TourPages = () => import('./pages/public/TourPages');
const FinderPages = () => import('./pages/public/FinderPages');
const StaticPages = () => import('./pages/public/StaticPages');
const pick = (loader, name) => lazy(() => loader().then((m) => ({ default: m[name] })));

const ServicesPage = pick(ServicesPages, 'ServicesPage');
const ServiceDetail = pick(ServicesPages, 'ServiceDetail');
const EducationPage = pick(ServicesPages, 'EducationPage');
const DestinationsPage = pick(DestinationPages, 'DestinationsPage');
const DestinationDetail = pick(DestinationPages, 'DestinationDetail');
const ToursPage = pick(TourPages, 'ToursPage');
const TourDetail = pick(TourPages, 'TourDetail');
const UniversitiesPage = pick(FinderPages, 'UniversitiesPage');
const UniversityDetail = pick(FinderPages, 'UniversityDetail');
const ScholarshipsPage = pick(FinderPages, 'ScholarshipsPage');
const ScholarshipDetail = pick(FinderPages, 'ScholarshipDetail');
const AboutPage = pick(StaticPages, 'AboutPage');
const ContactPage = pick(StaticPages, 'ContactPage');
const PolicyPage = pick(StaticPages, 'PolicyPage');

// Admin CRM and client portal are separate bundles, loaded only when visited.
const AdminApp = lazy(() => import('./pages/admin/AdminApp'));
const ClientApp = lazy(() => import('./pages/client/ClientApp'));

export default function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/admin/*" element={<AdminApp />} />
        <Route path="/client/*" element={<ClientApp />} />
        <Route element={<PublicLayout />}>
          <Route index element={<Home />} />
          <Route path="services" element={<ServicesPage />} />
          <Route path="services/:slug" element={<ServiceDetail />} />
          <Route path="destinations" element={<DestinationsPage />} />
          <Route path="destinations/:slug" element={<DestinationDetail />} />
          <Route path="tours" element={<ToursPage />} />
          <Route path="tours/:slug" element={<TourDetail />} />
          <Route path="education" element={<EducationPage />} />
          <Route path="universities" element={<UniversitiesPage />} />
          <Route path="universities/:slug" element={<UniversityDetail />} />
          <Route path="scholarships" element={<ScholarshipsPage />} />
          <Route path="scholarships/:slug" element={<ScholarshipDetail />} />
          <Route path="about" element={<AboutPage />} />
          <Route path="contact" element={<ContactPage />} />
          <Route path="privacy-policy" element={<PolicyPage page="privacy" />} />
          <Route path="terms" element={<PolicyPage page="terms" />} />
          <Route path="refund-policy" element={<PolicyPage page="refund" />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
