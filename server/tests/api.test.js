// End-to-end API test against a running server (npm run dev) with a seeded database and a super admin.
// Usage: API_URL=http://localhost:5000/api ADMIN_EMAIL=... ADMIN_PASSWORD=... npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';

const API = process.env.API_URL || 'http://localhost:5000/api';
const stamp = Date.now();
const phone = `+92 3${String(stamp).slice(-9)}`; // unique per run so duplicate protection doesn't merge runs

function session() {
  let cookie = '';
  return async (method, path, body, { raw = false, headers = {} } = {}) => {
    const res = await fetch(API + path, {
      method,
      headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest', ...(cookie && { Cookie: cookie }), ...headers },
      body: body ? JSON.stringify(body) : undefined,
    });
    const set = res.headers.get('set-cookie');
    if (set) cookie = set.split(';')[0];
    if (raw) return res;
    return { status: res.status, body: await res.json() };
  };
}

const admin = session();
const agent = session();
const visitor = session();
const portal = session();
let leadId; let agentId; let clientId;

test('admin logs in and sees dashboard', async () => {
  const r = await admin('POST', '/auth/login', { email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD, portal: 'admin' });
  assert.equal(r.status, 200, JSON.stringify(r.body));
  assert.ok(r.body.data.permissions.includes('*'));
  const d = await admin('GET', '/admin/dashboard');
  assert.equal(d.status, 200);
  assert.equal(typeof d.body.data.cards.totalLeads, 'number');
});

test('requests without the CSRF header are rejected', async () => {
  const res = await fetch(`${API}/leads`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
  assert.equal(res.status, 403);
});

test('visitor submits a study visa inquiry → lead in CRM', async () => {
  const r = await visitor('POST', '/leads', {
    fullName: 'Test Student', email: `student${stamp}@example.com`, phone, service: 'study_visa',
    destination: 'United Kingdom', message: 'I want to study MSc', formType: 'hero_quick_form', sourcePage: '/',
    utm: { source: 'facebook', campaign: 'nov-study' }, startedAt: Date.now() - 10_000,
  });
  assert.equal(r.status, 201, JSON.stringify(r.body));
  assert.match(r.body.data.code, /^LD-\d{4}-\d{5}$/);
  const list = await admin('GET', `/admin/leads?q=student${stamp}`);
  assert.equal(list.body.data.length, 1);
  leadId = list.body.data[0]._id;
  assert.equal(list.body.data[0].status, 'new');
  assert.equal(list.body.data[0].utm.campaign, 'nov-study');
});

test('duplicate submission within 24h does not create a second lead', async () => {
  const r = await visitor('POST', '/leads', { fullName: 'Test Student', email: `student${stamp}@example.com`, phone, service: 'study_visa', startedAt: Date.now() - 10_000 });
  assert.equal(r.body.data.duplicate, true);
  const list = await admin('GET', `/admin/leads?q=student${stamp}`);
  assert.equal(list.body.data.length, 1);
});

test('honeypot submissions are silently dropped', async () => {
  const r = await visitor('POST', '/leads', { fullName: 'Spam Bot', email: `bot${stamp}@spam.com`, phone: '1234567', website: 'http://spam', startedAt: Date.now() - 10_000 });
  assert.equal(r.status, 201);
  const list = await admin('GET', `/admin/leads?q=bot${stamp}`);
  assert.equal(list.body.data.length, 0);
});

test('invalid lead input returns a clear 400', async () => {
  const r = await visitor('POST', '/leads', { fullName: 'A', email: 'nope', phone: '1' });
  assert.equal(r.status, 400);
  assert.ok(r.body.message);
});

test('admin creates a sales agent; agent only sees assigned leads', async () => {
  const c = await admin('POST', '/admin/staff', { name: 'Agent One', email: `agent${stamp}@test.local`, role: 'sales_agent', password: 'Agent12345' });
  assert.equal(c.status, 201, JSON.stringify(c.body));
  agentId = c.body.data._id;
  const login = await agent('POST', '/auth/login', { email: `agent${stamp}@test.local`, password: 'Agent12345', portal: 'admin' });
  assert.equal(login.status, 200);
  const before = await agent('GET', `/admin/leads/${leadId}`);
  assert.equal(before.status, 404, 'unassigned lead must be invisible to agent');
  const forbidden = await agent('GET', '/admin/staff');
  assert.equal(forbidden.status, 403);
  const assign = await admin('PATCH', `/admin/leads/${leadId}`, { assignedTo: agentId, status: 'contacted', followUpDate: new Date().toISOString() });
  assert.equal(assign.status, 200, JSON.stringify(assign.body));
  const after = await agent('GET', `/admin/leads/${leadId}`);
  assert.equal(after.status, 200);
  const reassign = await agent('PATCH', `/admin/leads/${leadId}`, { assignedTo: null });
  assert.equal(reassign.status, 403, 'agent cannot reassign');
  const note = await agent('POST', `/admin/leads/${leadId}/notes`, { text: 'Called the student, interested in Sept intake' });
  assert.equal(note.status, 201);
  const conv = await agent('POST', `/admin/leads/${leadId}/convert`, {});
  assert.equal(conv.status, 403, 'sales agent cannot convert to client');
});

test('agent gets a notification about the assignment', async () => {
  const n = await agent('GET', '/notifications');
  assert.ok(n.body.data.some((x) => x.type === 'lead_assigned'));
});

test('admin converts lead to client with portal invitation', async () => {
  const r = await admin('POST', `/admin/leads/${leadId}/convert`, { createPortalAccess: true });
  assert.equal(r.status, 200, JSON.stringify(r.body));
  clientId = r.body.data.client._id;
  const token = new URL(r.body.data.portalInviteLink).searchParams.get('token');
  const set = await portal('POST', '/auth/reset-password', { token, password: 'Client12345' });
  assert.equal(set.status, 200);
  const login = await portal('POST', '/auth/login', { email: `student${stamp}@example.com`, password: 'Client12345', portal: 'client' });
  assert.equal(login.status, 200);
  const ov = await portal('GET', '/portal/overview');
  assert.equal(ov.status, 200);
  assert.equal(ov.body.data.client._id, clientId);
  assert.equal(ov.body.data.inquiries.length, 1);
  assert.equal(ov.body.data.client.staffNotes, undefined);
});

test('clients cannot reach admin APIs or use the admin login', async () => {
  assert.equal((await portal('GET', '/admin/leads')).status, 403);
  assert.equal((await portal('GET', `/admin/clients/${clientId}`)).status, 403);
  const wrongPortal = await session()('POST', '/auth/login', { email: `student${stamp}@example.com`, password: 'Client12345', portal: 'admin' });
  assert.equal(wrongPortal.status, 403);
});

test('lead export works for CSV and Excel', async () => {
  const csv = await admin('GET', '/admin/leads/export?format=csv', null, { raw: true });
  assert.equal(csv.status, 200);
  assert.match(await csv.text(), /Lead ID/);
  const xlsx = await admin('GET', '/admin/leads/export?format=xlsx', null, { raw: true });
  assert.equal(xlsx.status, 200);
  assert.match(xlsx.headers.get('content-type'), /spreadsheetml/);
});

test('CMS: create, publish, read publicly, unpublish', async () => {
  const c = await admin('POST', '/admin/content/tours', { title: `Test Tour ${stamp}`, category: 'europe', price: 999, isPublished: true });
  assert.equal(c.status, 201, JSON.stringify(c.body));
  const pub = await visitor('GET', `/content/tours/${c.body.data.slug}`);
  assert.equal(pub.status, 200);
  await admin('PATCH', `/admin/content/tours/${c.body.data._id}`, { isPublished: false });
  assert.equal((await visitor('GET', `/content/tours/${c.body.data.slug}`)).status, 404);
  assert.equal((await admin('DELETE', `/admin/content/tours/${c.body.data._id}`)).status, 200);
});

test('NoSQL injection in search is neutralised', async () => {
  const r = await visitor('GET', '/content/universities?country[$ne]=x');
  assert.equal(r.status, 200);
  const login = await visitor('POST', '/auth/login', { email: { $ne: null }, password: { $ne: null }, portal: 'admin' });
  assert.equal(login.status, 400);
});

test('newsletter subscribe is idempotent', async () => {
  assert.equal((await visitor('POST', '/newsletter', { email: `news${stamp}@example.com` })).status, 201);
  assert.equal((await visitor('POST', '/newsletter', { email: `news${stamp}@example.com` })).status, 201);
});

test('cleanup: disable test agent', async () => {
  const r = await admin('PATCH', `/admin/staff/${agentId}`, { isActive: false });
  assert.equal(r.status, 200);
  assert.equal((await agent('GET', '/auth/me')).body.data, null, 'disabled user is signed out');
  assert.equal((await agent('GET', '/admin/leads')).status, 401);
});
