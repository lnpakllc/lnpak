import { Router } from 'express';
import { authenticate, optionalAuth, requireStaff, requireClient, requirePermission } from '../middleware/auth.js';
import { validate, authLimiter, formLimiter, imageUpload } from '../middleware/common.js';
import * as auth from '../controllers/authController.js';
import * as leads from '../controllers/leadController.js';
import * as content from '../controllers/contentController.js';
import * as admin from '../controllers/adminController.js';
import * as clients from '../controllers/clientController.js';
import { stats } from '../controllers/dashboardController.js';
import { sitemap } from '../controllers/seoController.js';

const r = Router();
const staff = [authenticate, requireStaff];
const can = (...p) => [...staff, requirePermission(...p)];

// health check lives in app.js (works even when the database is down)
r.get('/sitemap.xml', sitemap);

// ---------- auth ----------
r.post('/auth/login', authLimiter, validate(auth.schemas.login), auth.login);
r.post('/auth/register', authLimiter, validate(auth.schemas.register), auth.register);
r.post('/auth/logout', auth.logout);
r.get('/auth/me', optionalAuth, auth.me); // returns null when signed out (no console noise for visitors)
r.patch('/auth/me', authenticate, validate(auth.schemas.updateMe), auth.updateMe);
r.post('/auth/change-password', authenticate, validate(auth.schemas.changePassword), auth.changePassword);
r.post('/auth/forgot-password', authLimiter, validate(auth.schemas.forgot), auth.forgotPassword);
r.post('/auth/reset-password', authLimiter, validate(auth.schemas.reset), auth.resetPassword);

// ---------- public website ----------
r.get('/settings/public', admin.publicSettings);
r.post('/leads', formLimiter, optionalAuth, validate(leads.schemas.publicCreate), leads.publicCreate);
r.post('/newsletter', formLimiter, validate(admin.schemas.newsletter), admin.subscribe);
r.get('/content/:type', content.publicList);
r.get('/content/:type/facets', content.publicFacets);
r.get('/content/:type/:slug', content.publicGet);

// ---------- admin: dashboard ----------
r.get('/admin/dashboard', can('dashboard:view'), stats);

// ---------- admin: leads ----------
r.get('/admin/leads', can('leads:read'), leads.list);
r.get('/admin/leads/board', can('leads:read'), leads.board);
r.get('/admin/leads/export', can('leads:export'), leads.exportLeads);
r.post('/admin/leads', can('leads:write'), validate(leads.schemas.staffCreate), leads.staffCreate);
r.get('/admin/leads/:id', can('leads:read'), leads.getOne);
r.patch('/admin/leads/:id', can('leads:write'), validate(leads.schemas.update), leads.update);
r.post('/admin/leads/:id/notes', can('leads:write'), validate(leads.schemas.note), leads.addNote);
r.post('/admin/leads/:id/convert', can('clients:write'), requirePermission('leads:write'), validate(leads.schemas.convert), leads.convert);
r.delete('/admin/leads/:id', can('leads:delete'), leads.remove);

// ---------- admin: clients ----------
r.get('/admin/clients', can('clients:read'), clients.list);
r.post('/admin/clients', can('clients:write'), validate(clients.schemas.create), clients.create);
r.get('/admin/clients/:id', can('clients:read'), clients.getOne);
r.patch('/admin/clients/:id', can('clients:write'), validate(clients.schemas.update), clients.update);
r.post('/admin/clients/:id/notes', can('clients:read'), validate(clients.schemas.note), clients.addNote);
r.post('/admin/clients/:id/portal-access', can('clients:write'), clients.portalAccess);

// ---------- admin: content (CMS) ----------
r.get('/admin/content/:type', can('content:manage'), content.adminList);
r.post('/admin/content/:type', can('content:manage'), content.adminCreate);
r.get('/admin/content/:type/:id', can('content:manage'), content.adminGet);
r.patch('/admin/content/:type/:id', can('content:manage'), content.adminUpdate);
r.delete('/admin/content/:type/:id', can('content:manage'), content.adminDelete);
r.post('/admin/uploads/images', can('content:manage', 'settings:manage'), imageUpload.array('images', 10), admin.uploadImages);

// ---------- admin: staff, roles, settings, newsletter, notifications, audit ----------
r.get('/admin/staff/assignable', can('leads:assign', 'leads:read_all', 'clients:write'), admin.assignableStaff);
r.get('/admin/staff', can('staff:manage'), admin.listStaff);
r.post('/admin/staff', can('staff:manage'), validate(admin.schemas.staffCreate), admin.createStaff);
r.patch('/admin/staff/:id', can('staff:manage'), validate(admin.schemas.staffUpdate), admin.updateStaff);
r.get('/admin/roles', can('staff:manage', 'roles:manage'), admin.listRoles);
r.post('/admin/roles', can('roles:manage'), validate(admin.schemas.role), admin.createRole);
r.put('/admin/roles/:id', can('roles:manage'), validate(admin.schemas.role), admin.updateRole);
r.delete('/admin/roles/:id', can('roles:manage'), admin.deleteRole);
r.put('/admin/settings', can('settings:manage'), admin.updateSettings);
r.get('/admin/newsletter', can('newsletter:manage'), admin.listSubscribers);
r.delete('/admin/newsletter/:id', can('newsletter:manage'), admin.deleteSubscriber);
r.get('/admin/audit-logs', can('audit:view'), admin.listAudit);

// ---------- notifications (staff and clients) ----------
r.get('/notifications', authenticate, admin.listNotifications);
r.post('/notifications/:id/read', authenticate, admin.markRead);

// ---------- client portal ----------
const client = [authenticate, requireClient];
r.get('/portal/overview', client, clients.portalOverview);
r.patch('/portal/profile', client, validate(clients.schemas.portalProfile), clients.portalUpdateProfile);
r.post('/portal/inquiries', client, formLimiter, validate(clients.schemas.portalInquiry), clients.portalInquiry);

export default r;
