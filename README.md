# LN PAK LLC — Visa, Travel, Education & Client Management Platform

MERN stack (MongoDB, Express, React, Node). Three parts in one project:

| Part | URL | Who |
|---|---|---|
| Public website | `/` | Visitors — every form creates a lead in the CRM |
| Admin CRM | `/admin` | Staff — leads, clients, website content, team |
| Client portal | `/client` | Clients — inquiries, profile, notifications |

```
lnpak/
├── server/                 Express API
│   ├── src/config/         env, database, permission catalogue + default roles
│   ├── src/models/         User, Role, Lead, Client, content (Service, Country, TourPackage,
│   │                       University, Scholarship, Testimonial, Faq), system (Notification,
│   │                       AuditLog, NewsletterSubscriber, Setting), Counter (LD-/CL- IDs)
│   ├── src/controllers/    auth, leads, content (one generic CMS controller), clients + portal,
│   │                       dashboard, admin (staff, roles, settings, newsletter, uploads, audit), seo
│   ├── src/middleware/     auth + permissions, validation, CSRF, rate limits, uploads, errors
│   ├── src/routes/         all /api routes in one readable file
│   ├── src/scripts/        seed (dev sample data), createSuperAdmin, roles
│   └── tests/              end-to-end API tests
└── client/                 React (Vite + Tailwind)
    ├── public/             logo, images, robots.txt
    └── src/
        ├── components/     shared UI, LeadForm, public layout, admin form fields
        ├── pages/public/   home, services, destinations, tours, universities, scholarships …
        ├── pages/admin/    dashboard, leads (table + kanban), lead detail, clients, CMS, staff, roles, settings
        ├── pages/client/   client portal
        └── pages/auth/     login / register / forgot / reset (admin + client)
```

---

## 1. Run it on your computer

You need **Node.js 20+** and **MongoDB** (local install, or a free MongoDB Atlas cluster).

```bash
# 1) API
cd server
npm install
cp .env.example .env          # then open .env and set MONGODB_URI and JWT_SECRET
npm run seed                  # development sample content (clearly marked "Sample")
npm run create-admin          # asks for your name, email and password → first Super Admin
npm run dev                   # http://localhost:5000

# 2) Website (new terminal)
cd client
npm install
npm run dev                   # http://localhost:5173  (calls the API through a proxy)
```

Open `http://localhost:5173` for the website and `http://localhost:5173/admin` for the CRM.

Generate a strong `JWT_SECRET`:
```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

### Tests
With the API running (`NODE_ENV=test` turns off rate limits for the test run):
```bash
cd server
NODE_ENV=test npm run dev            # terminal 1
ADMIN_EMAIL=you@lnpak.com ADMIN_PASSWORD=yourpassword npm test   # terminal 2
```
The 15 tests cover: lead form → CRM, duplicate and spam protection, sales agent can only see assigned leads,
agent cannot reassign or convert, notifications, lead → client conversion with portal invitation, client
cannot reach admin APIs, CSV/Excel export, CMS publish/unpublish, NoSQL-injection attempts, account disabling.

---

## 2. Going live (lnpak.com)

### Option A — one server (simplest): Render / Railway / a VPS
1. Create a free **MongoDB Atlas** cluster, copy the connection string.
2. Deploy the whole repo. Build command:
   `cd client && npm install && npm run build && cd ../server && npm install`
   Start command: `cd server && npm start`
3. Environment variables (from `server/.env.example`): `NODE_ENV=production`, `MONGODB_URI`, `JWT_SECRET`,
   `CLIENT_URL=https://lnpak.com`, `PUBLIC_SITE_URL=https://lnpak.com`, `COOKIE_SECURE=true`, SMTP settings.
4. In production the API also serves the built website, so `lnpak.com` points to this one server.
5. Run `npm run create-admin` once (Render/Railway shell) to make your Super Admin.

### Option B — website on Vercel, API on Render/Railway
1. Deploy `server/` as above (without the client build) at e.g. `api.lnpak.com`.
2. Deploy `client/` on Vercel (framework: Vite). In `client/vercel.json` replace `YOUR-API-DOMAIN` with
   your API domain — Vercel then forwards `/api`, `/uploads` and `/sitemap.xml` to it, so cookies stay
   on `lnpak.com` and no CORS setup is needed.
3. On the API set `CLIENT_URL=https://lnpak.com`.

> Uploaded website images are stored on the API server's disk (`server/uploads/public`). On hosts with
> temporary disks (Render free tier, Railway without a volume) attach a persistent disk/volume, or move
> uploads to cloud storage — that is planned together with the private document module (see below).

### Email (optional but recommended)
Fill `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM` (e.g. Gmail app password, Zoho,
Brevo). Used for password reset links, client portal invitations and `ADMIN_NOTIFY_EMAIL` new-lead alerts.
Without SMTP the system still works: invitation links are shown to staff in the admin panel to copy.

---

## 3. What is built (this phase)

**Public website** — homepage following the provided design (header with contact bar, hero, quick inquiry,
services, tour packages, destination explorer, education, why us, how it works, testimonials, FAQ,
newsletter, footer), services + detail pages, visa destinations + country pages (visa tabs, eligibility,
document checklist, process, FAQ, disclaimer and "last reviewed" date), tour packages + detail pages
(gallery, departures, itinerary, included/excluded), education page, **medical/university finder** with
filters, **scholarship finder** with filters, about, contact, privacy/terms/refund pages, 404.
Site-wide "Get Free Consultation" modal, WhatsApp button, click-to-call, UTM / Facebook / Google campaign
capture, SEO titles + meta + Open Graph, sitemap.xml, robots.txt, admin/client pages set to noindex.

**Lead generation** — every form validates input, shows loading/success states, saves to MongoDB with a
unique ID (`LD-2026-00001`), service, source page, form name, UTM campaign, honeypot + timing spam
check, rate limiting, duplicate merging (same email/phone + service within 24h), in-app notification to
staff and optional email alert.

**Admin CRM** — live dashboard (all numbers from MongoDB: leads, new, today, conversion rate, follow-ups
due/overdue, clients, subscribers; charts by month, service, status, destination, staff performance),
leads table with search, filters (status, service, destination, staff, dates, follow-up) and pagination,
**Kanban board with drag-and-drop**, add lead manually, lead detail (call/WhatsApp/email buttons, status,
priority, follow-up date, assignment, internal notes, full activity history), CSV + Excel export,
**convert lead → client** with portal invitation link, clients list + profile (passport fields only for
authorised staff, private notes, status, portal access), CMS for services, countries & visas, tours,
universities, scholarships, testimonials and FAQs (publish/unpublish, featured, sort, SEO fields, image
upload), newsletter subscribers + export, site settings (contact info, social links, homepage hero, about,
policy pages, SEO), staff accounts, **roles & permissions editor**, audit log, notifications, profile and
password change. Sidebar collapses; works on mobile.

**Client portal** — register / login / forgot / reset password, overview, my inquiries with status,
new inquiry (goes to their consultant), notifications, profile, change password.

**Security** — bcrypt (12 rounds) passwords, JWT in httpOnly cookie, tokens invalid after password change,
role permissions checked on the server for every route, staff only see their assigned leads/clients unless
given "read all", clients can only ever load their own records, CSRF header check, CORS allow-list,
Helmet headers, rate limits (login, forms, API), input validation (zod), NoSQL-injection sanitising,
upload type/size checks, audit log, no hard-coded credentials.

## 4. Next phases (not built yet)

1. **Visa application management** — applications, 14-step status timeline, client-visible vs internal updates.
2. **Secure document management** — private cloud storage (S3 / Cloudflare R2), signed download URLs,
   document requests, approve/reject with remarks, expiry dates.
3. **Payments & invoices** — invoices, partial payments, payment proof upload, invoice PDF.
4. **Tasks & appointments** — follow-up tasks, reminders, daily task view.
5. **Messaging** — client ↔ consultant threads with attachments.
6. **Tour bookings, saved universities/scholarships, compare universities** in the client portal.
7. **Email verification, WhatsApp Business API / SMS notifications, blog, reports page with exports.**

## 5. Before launch — please check

- `npm run seed` content is **sample data**: countries' visa text, university names/fees and tour prices are
  placeholders marked "Sample". Replace them with verified information in the admin panel, or start with
  `npm run seed -- --fresh` only in development. The 5 scholarships are real programmes with general
  descriptions and official links; deadlines are left empty on purpose.
- Testimonials are placeholders — publish only real client reviews with permission.
- Contact details are set to phone / WhatsApp `+7 962 359-59-40`, office `Izhevsk, Russia`, email
  `info@lnpak.com` and domain `lnpak.com`. Add the full street address any time in **Admin → Site Settings**.
- Policy pages contain placeholder text — add your approved Privacy, Terms and Refund policies.
- Hero and section images were cut from the design mockup and are low resolution; upload high-quality
  photos in **Site Settings → Homepage hero** and on each tour/service.
