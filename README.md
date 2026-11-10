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

### Option A — Vercel (recommended): two projects from this one GitHub repo

```
visitor ──► lnpak.com  (Vercel project "lnpak-web", folder client/)
               │  /api/*  and /sitemap.xml are forwarded ──►  api.lnpak.com  (Vercel project "lnpak-api", folder server/)
               │                                                    │
               └─ images from Vercel Blob                           └─► MongoDB Atlas
```
Because the website forwards `/api` to the API, the browser only ever talks to `lnpak.com`, so login
cookies work without any cross-domain setup. LN PAK is a business website, so use a Vercel **Pro** team
(the free Hobby plan is for non-commercial use only).

**Step 1 — Database (MongoDB Atlas)**
1. Create a cluster at mongodb.com/atlas. The API runs in Vercel's Mumbai region (`bom1`, set in
   `server/vercel.json`) to sit next to the LN PAK cluster (AWS Mumbai); change both together if you move.
2. Database Access → add a user with a strong password.
3. Network Access → allow `0.0.0.0/0` (Vercel functions do not have fixed IPs), or use the
   MongoDB Atlas integration from the Vercel Marketplace, which sets this up for you.
4. Copy the connection string, e.g. `mongodb+srv://USER:PASS@cluster0.xxxx.mongodb.net/lnpak`.

**Step 2 — API project (`lnpak-api`)**
1. Vercel → Add New → Project → import `lnpakllc/lnpak`.
2. **Root Directory: `server`**. Framework preset: Express (detected automatically from `src/app.js`).
3. Environment variables:

   | Name | Value |
   |---|---|
   | `NODE_ENV` | `production` |
   | `MONGODB_URI` | your Atlas connection string |
   | `JWT_SECRET` | a long random string (see section 1) |
   | `CLIENT_URL` | `https://lnpak.com,https://www.lnpak.com` |
   | `PUBLIC_SITE_URL` | `https://lnpak.com` |
   | `COOKIE_SECURE` | `true` |
   | `SETUP_KEY` | a long secret, used once on `/admin/setup` |
   | SMTP_* / `MAIL_FROM` / `ADMIN_NOTIFY_EMAIL` | optional, for emails |

4. Storage → **Blob** → create a store and connect it to this project. This adds `BLOB_READ_WRITE_TOKEN`;
   all images uploaded in the admin panel are then stored there (Vercel's own disk is not permanent).
5. Deploy, then Settings → Domains → add **`api.lnpak.com`**.
6. Check `https://api.lnpak.com/api/health` shows `"status":"ok"`.

**Step 3 — Website project (`lnpak-web`)**
1. Add New → Project → import the same repo again.
2. **Root Directory: `client`**. Framework preset: Vite (build `npm run build`, output `dist`).
3. No environment variables are needed. `client/vercel.json` forwards `/api` and `/sitemap.xml` to the API
   project (currently `https://lnpak-sage.vercel.app`). If you attach `api.lnpak.com` later, you may switch
   the address there — it works either way.
4. Deploy, then Settings → Domains → add **`lnpak.com`** and **`www.lnpak.com`** (redirect www → lnpak.com).

**Step 4 — First admin and content (no terminal needed)**
1. On the API project add one more environment variable `SETUP_KEY` = any long secret, then redeploy.
2. Open `https://lnpak.com/admin/setup` (or the website's vercel.app address), enter the setup key, your
   name, email and password. Tick "Add starter content" to get sample pages to edit.
3. The page works only while no Super Admin exists. Afterwards add staff from **Admin → Staff**.

(Terminal alternative: `cd server && npm run create-admin` with the Atlas `MONGODB_URI` in `server/.env`.)

**DNS** — at your domain registrar add the records Vercel shows on each project's Domains page
(`lnpak.com`, `www`, `api`).

**Good to know on Vercel**
- Each push to `main` redeploys both projects; other branches get preview URLs.
- One request can carry at most 4.5 MB, so images are uploaded one by one, max 4 MB each.
- Rate limits are kept per function instance, so they are softer than on a single server. For stronger
  protection turn on the Vercel Firewall rate-limit rules for `/api/leads` and `/api/auth/*`.
- If rate limits ever treat all visitors as one IP, set `TRUST_PROXY=2` on the API project.

### Option B — one server: Render / Railway / a VPS
1. Create a MongoDB Atlas cluster as above.
2. Deploy the whole repo. Build: `cd client && npm install && npm run build && cd ../server && npm install`
   Start: `cd server && npm start`
3. Environment variables as in the table above (`CLIENT_URL=https://lnpak.com`).
4. In production the API also serves the built website, so `lnpak.com` points to this one server.
5. Images are saved on the server disk unless `BLOB_READ_WRITE_TOKEN` is set — use a persistent disk/volume.
6. Run `npm run create-admin` once to make your Super Admin.

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
