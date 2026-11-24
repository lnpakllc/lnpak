import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import PublicLayout from './components/public/PublicLayout';
import Home from './pages/public/Home';
import NotFound from './pages/public/NotFound';
import { PageLoader } from './components/ui';

// Public pages (split so the homepage loads fast)
const ServicesPages = () => import('./pages/public/ServicesPages');
const EducationScholarshipsPage = lazy(() => import('./pages/public/EducationScholarships'));
const ResearchSupportPage = lazy(() => import('./pages/public/ResearchSupport'));
const FaqPage = lazy(() => import('./pages/public/FaqPage'));
const DestinationPages = () => import('./pages/public/DestinationPages');
const TourPages = () => import('./pages/public/TourPages');
const FinderPages = () => import('./pages/public/FinderPages');
const VideoPages = () => import('./pages/public/VideoPages');
const StaticPages = () => import('./pages/public/StaticPages');
const pick = (loader, name) => lazy(() => loader().then((m) => ({ default: m[name] })));

const ServicesPage = pick(ServicesPages, 'ServicesPage');
const ServiceDetail = pick(ServicesPages, 'ServiceDetail');
const DestinationsPage = pick(DestinationPages, 'DestinationsPage');
const DestinationDetail = pick(DestinationPages, 'DestinationDetail');
const ToursPage = pick(TourPages, 'ToursPage');
const TourDetail = pick(TourPages, 'TourDetail');
const UniversityDetail = pick(FinderPages, 'UniversityDetail');
const ScholarshipDetail = pick(FinderPages, 'ScholarshipDetail');
const VideosPage = pick(VideoPages, 'VideosPage');
const AboutPage = pick(StaticPages, 'AboutPage');
const ContactPage = pick(StaticPages, 'ContactPage');
const PolicyPage = pick(StaticPages, 'PolicyPage');

// Admin CRM and client portal are separate bundles, loaded only when visited.
const AdminApp = lazy(() => import('./pages/admin/AdminApp'));
const ClientApp = lazy(() => import('./pages/client/ClientApp'));

// Old Education, University Finder and Scholarship Finder links now open the merged page (filters in the URL are kept).
function ToEducation({ tab }) {
  const { search } = useLocation();
  const p = new URLSearchParams(search);
  if (tab === 'scholarships') p.set('tab', 'scholarships');
  return <Navigate to={`/education-scholarships${p.toString() ? `?${p}` : ''}`} replace />;
}

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
          <Route path="education-scholarships" element={<EducationScholarshipsPage />} />
          <Route path="education" element={<ToEducation />} />
          <Route path="universities" element={<ToEducation />} />
          <Route path="universities/:slug" element={<UniversityDetail />} />
          <Route path="scholarships" element={<ToEducation tab="scholarships" />} />
          <Route path="academic-research-support" element={<ResearchSupportPage />} />
          <Route path="faq" element={<FaqPage />} />
          <Route path="scholarships/:slug" element={<ScholarshipDetail />} />
          <Route path="videos" element={<VideosPage />} />
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
