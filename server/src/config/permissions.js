// Permission catalogue. Roles store a list of these keys and are editable from the admin panel.
// "*" grants everything (Super Admin).

export const PERMISSIONS = {
  'dashboard:view': 'View dashboard statistics',
  'leads:read': 'View assigned leads',
  'leads:read_all': 'View all leads (not only assigned)',
  'leads:write': 'Update leads, add notes, change status',
  'leads:assign': 'Assign leads to staff',
  'leads:delete': 'Delete leads',
  'leads:export': 'Export leads to CSV / Excel',
  'clients:read': 'View assigned clients',
  'clients:read_all': 'View all clients (not only assigned)',
  'clients:write': 'Create and edit clients, convert leads',
  'content:manage': 'Manage website content (services, countries, tours, universities, scholarships, FAQs, testimonials)',
  'newsletter:manage': 'Manage newsletter subscribers',
  'staff:manage': 'Manage staff accounts',
  'roles:manage': 'Manage roles and permissions',
  'settings:manage': 'Manage website settings and pages',
  'reports:view': 'View reports and analytics',
  'audit:view': 'View audit logs',
};

export const STAFF_ROLES = [
  { key: 'super_admin', name: 'Super Admin', permissions: ['*'] },
  { key: 'admin', name: 'Admin', permissions: Object.keys(PERMISSIONS).filter((p) => p !== 'roles:manage') },
  {
    key: 'manager',
    name: 'Manager',
    permissions: ['dashboard:view', 'leads:read', 'leads:read_all', 'leads:write', 'leads:assign', 'leads:export', 'clients:read', 'clients:read_all', 'clients:write', 'reports:view'],
  },
  { key: 'visa_consultant', name: 'Visa Consultant', permissions: ['dashboard:view', 'leads:read', 'leads:write', 'clients:read', 'clients:write'] },
  { key: 'education_consultant', name: 'Education Consultant', permissions: ['dashboard:view', 'leads:read', 'leads:write', 'clients:read', 'clients:write'] },
  { key: 'travel_consultant', name: 'Travel Consultant', permissions: ['dashboard:view', 'leads:read', 'leads:write', 'clients:read', 'clients:write'] },
  { key: 'sales_agent', name: 'Sales Agent', permissions: ['dashboard:view', 'leads:read', 'leads:write'] },
  { key: 'documentation_officer', name: 'Documentation Officer', permissions: ['dashboard:view', 'clients:read', 'clients:read_all'] },
  { key: 'support_staff', name: 'Support Staff', permissions: ['dashboard:view', 'leads:read', 'leads:write'] },
];

export const CLIENT_ROLE = 'client';

export const LEAD_STATUSES = [
  'new', 'contacted', 'interested', 'consultation_scheduled', 'follow_up_required',
  'documents_requested', 'converted', 'not_interested', 'lost',
];

export const SERVICE_TYPES = [
  'study_visa', 'visit_visa', 'business_visa', 'work_permit', 'immigration', 'business_setup', 'tour_booking',
  'hajj_umrah', 'religious_tour', 'university_admission', 'medical_university', 'scholarship',
  'documentation', 'general',
];
