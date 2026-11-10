import { lazy } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { PageLoader, Seo } from '../../components/ui';
import AdminLayout from './AdminLayout';
import { LoginPage, ResetPasswordPage, ForgotPasswordPage, SetupPage } from '../auth/AuthPages';
import Dashboard from './Dashboard';

const LeadsPage = lazy(() => import('./LeadsPage'));
const LeadDetail = lazy(() => import('./LeadDetail'));
const ClientsPage = lazy(() => import('./ClientsPages').then((m) => ({ default: m.ClientsPage })));
const ClientDetail = lazy(() => import('./ClientsPages').then((m) => ({ default: m.ClientDetail })));
const ContentManager = lazy(() => import('./ContentManager'));
const StaffPage = lazy(() => import('./TeamPages').then((m) => ({ default: m.StaffPage })));
const RolesPage = lazy(() => import('./TeamPages').then((m) => ({ default: m.RolesPage })));
const SettingsPage = lazy(() => import('./SettingsPage'));
const NewsletterPage = lazy(() => import('./MiscPages').then((m) => ({ default: m.NewsletterPage })));
const AuditPage = lazy(() => import('./MiscPages').then((m) => ({ default: m.AuditPage })));
const ProfilePage = lazy(() => import('./MiscPages').then((m) => ({ default: m.ProfilePage })));
const NotificationsPage = lazy(() => import('./MiscPages').then((m) => ({ default: m.NotificationsPage })));

function RequireStaff({ children }) {
  const { user, isStaff, loading } = useAuth();
  const location = useLocation();
  if (loading) return <PageLoader />;
  if (!user || !isStaff) return <Navigate to="/admin/login" replace state={{ from: location.pathname + location.search }} />;
  return children;
}

function Guard({ perm, children }) {
  const { can } = useAuth();
  if (perm && !can(...[].concat(perm))) {
    return <div className="rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center text-amber-900">You do not have permission to open this section. Ask an administrator if you need access.</div>;
  }
  return children;
}

export default function AdminApp() {
  return (
    <>
      <Seo title="Admin" noindex />
      <Routes>
        <Route path="login" element={<LoginPage portal="admin" />} />
        <Route path="setup" element={<SetupPage />} />
        <Route path="forgot-password" element={<ForgotPasswordPage portal="admin" />} />
        <Route path="reset-password" element={<ResetPasswordPage portal="admin" />} />
        <Route element={<RequireStaff><AdminLayout /></RequireStaff>}>
          <Route index element={<Guard perm="dashboard:view"><Dashboard /></Guard>} />
          <Route path="leads" element={<Guard perm="leads:read"><LeadsPage /></Guard>} />
          <Route path="leads/:id" element={<Guard perm="leads:read"><LeadDetail /></Guard>} />
          <Route path="clients" element={<Guard perm="clients:read"><ClientsPage /></Guard>} />
          <Route path="clients/:id" element={<Guard perm="clients:read"><ClientDetail /></Guard>} />
          <Route path="content/:type" element={<Guard perm="content:manage"><ContentManager /></Guard>} />
          <Route path="newsletter" element={<Guard perm="newsletter:manage"><NewsletterPage /></Guard>} />
          <Route path="staff" element={<Guard perm="staff:manage"><StaffPage /></Guard>} />
          <Route path="roles" element={<Guard perm={['roles:manage', 'staff:manage']}><RolesPage /></Guard>} />
          <Route path="settings" element={<Guard perm="settings:manage"><SettingsPage /></Guard>} />
          <Route path="audit" element={<Guard perm="audit:view"><AuditPage /></Guard>} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Route>
      </Routes>
    </>
  );
}
