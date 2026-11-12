// Generic CMS controller: one implementation serves services, countries, tours, universities,
// scholarships, testimonials and FAQs. Public routes only ever see published records.
import mongoose from 'mongoose';
import { Service, Country, TourPackage, University, Scholarship, Testimonial, Faq, Video } from '../models/content.js';
import { audit } from '../middleware/common.js';
import { ApiError, asyncHandler, ok, created, getPaging, pageMeta, escapeRegex } from '../utils/http.js';

const rx = (v) => new RegExp(escapeRegex(v), 'i');
const exact = (v) => new RegExp(`^${escapeRegex(v)}$`, 'i');

export const CONTENT_TYPES = {
  services: {
    Model: Service,
    sort: { sortOrder: 1, title: 1 },
    search: ['title', 'shortDescription'],
  },
  countries: {
    Model: Country,
    sort: { sortOrder: 1, name: 1 },
    search: ['name', 'region'],
    filters: (q) => ({
      ...(q.region && { region: exact(q.region) }),
      ...(q.visa && { 'visas.type': String(q.visa) }),
      ...(q.footer === 'true' && { showInFooter: true }),
    }),
    listSelect: '-visas.documents -visas.process -faqs',
  },
  tours: {
    Model: TourPackage,
    sort: { sortOrder: 1, createdAt: -1 },
    search: ['title', 'destination', 'category'],
    filters: (q) => ({
      ...(q.category && { category: String(q.category).toLowerCase() }),
      ...(q.destination && { destination: exact(String(q.destination)) }),
    }),
    adminSort: { destination: 1, sortOrder: 1, title: 1 }, // admin list is grouped destination by destination
    listSelect: '-itinerary -included -excluded',
  },
  universities: {
    Model: University,
    sort: { isFeatured: -1, sortOrder: 1, name: 1 },
    search: ['name', 'city', 'country'],
    filters: (q) => {
      const f = {};
      if (q.country) f.country = exact(q.country);
      if (q.medical === 'true') f.isMedical = true;
      if (q.degree) f['programs.degree'] = exact(q.degree);
      if (q.program) f['programs.name'] = rx(q.program);
      if (q.language) f.languages = exact(q.language);
      if (q.admissionOpen === 'true') f.admissionOpen = true;
      if (q.maxFee && !Number.isNaN(Number(q.maxFee))) f.tuitionMin = { $lte: Number(q.maxFee) };
      if (q.requirement) f.admissionRequirements = rx(q.requirement);
      return f;
    },
    listSelect: 'name slug logo image country city isMedical tuitionMin languages admissionOpen programs.degree programs.name programs.tuitionPerYear programs.currency isFeatured',
  },
  scholarships: {
    Model: Scholarship,
    sort: { deadline: 1 },
    search: ['title', 'provider', 'country', 'fields'],
    filters: (q) => {
      const f = {};
      if (q.country) f.country = exact(q.country);
      if (q.degreeLevel) f.degreeLevels = exact(q.degreeLevel);
      if (q.field) f.fields = rx(q.field);
      if (q.fundingType) f.fundingType = String(q.fundingType);
      if (q.scholarshipType) f.scholarshipType = exact(q.scholarshipType);
      if (q.eligibility) f.eligibility = rx(q.eligibility);
      if (q.deadline === 'upcoming') f.deadline = { $gte: new Date() };
      if (q.deadline === 'next90') f.deadline = { $gte: new Date(), $lte: new Date(Date.now() + 90 * 864e5) };
      return f;
    },
    listSelect: '-procedure -documents',
  },
  videos: {
    Model: Video,
    sort: { sortOrder: 1, createdAt: -1 },
    search: ['title', 'description'],
    filters: (q) => ({ ...(['video', 'reel'].includes(q.kind) && { kind: q.kind }) }),
    listSelect: 'title youtubeId kind description isFeatured sortOrder createdAt',
  },
  testimonials: { Model: Testimonial, sort: { sortOrder: 1, createdAt: -1 }, search: ['name', 'quote'] },
  faqs: {
    Model: Faq,
    sort: { category: 1, sortOrder: 1 },
    search: ['title', 'answer'],
    filters: (q) => ({ ...(q.category && { category: exact(q.category) }) }),
  },
};

function typeConfig(req) {
  const cfg = CONTENT_TYPES[req.params.type];
  if (!cfg) throw ApiError.notFound('Unknown content type');
  return cfg;
}

function buildFilter(cfg, q) {
  const f = cfg.filters ? cfg.filters(q) : {};
  if (q.q) f.$or = cfg.search.map((field) => ({ [field]: rx(q.q) }));
  if (q.featured === 'true') f.isFeatured = true;
  return f;
}

// GET /api/content/:type
export const publicList = asyncHandler(async (req, res) => {
  const cfg = typeConfig(req);
  const paging = getPaging(req.query, 12);
  const filter = { ...buildFilter(cfg, req.query), isPublished: true };
  const [items, total] = await Promise.all([
    cfg.Model.find(filter).sort(cfg.sort).skip(paging.skip).limit(paging.limit).select(cfg.listSelect || '').lean(),
    cfg.Model.countDocuments(filter),
  ]);
  res.set('Cache-Control', 'public, max-age=60');
  ok(res, items, pageMeta(total, paging));
});

// GET /api/content/:type/facets — distinct values used to fill search filters
export const publicFacets = asyncHandler(async (req, res) => {
  const cfg = typeConfig(req);
  const fields = {
    universities: ['country', 'programs.degree', 'languages'],
    scholarships: ['country', 'degreeLevels', 'fields', 'scholarshipType'],
    tours: ['category', 'destination'],
    countries: ['region'],
    faqs: ['category'],
  }[req.params.type] || [];
  const out = {};
  for (const f of fields) out[f] = (await cfg.Model.distinct(f, { isPublished: true })).filter(Boolean).sort();
  ok(res, out);
});

// GET /api/content/:type/:slug
export const publicGet = asyncHandler(async (req, res) => {
  const cfg = typeConfig(req);
  const item = await cfg.Model.findOne({ slug: String(req.params.slug).toLowerCase(), isPublished: true }).lean();
  if (!item) throw ApiError.notFound('Page not found');
  ok(res, item);
});

// ---------- admin ----------
const PROTECTED = ['_id', 'createdAt', 'updatedAt', '__v'];
const clean = (body) => Object.fromEntries(Object.entries(body || {}).filter(([k]) => !PROTECTED.includes(k)));

export const adminList = asyncHandler(async (req, res) => {
  const cfg = typeConfig(req);
  const paging = getPaging(req.query);
  const filter = buildFilter(cfg, req.query);
  if (req.query.published === 'true') filter.isPublished = true;
  if (req.query.published === 'false') filter.isPublished = false;
  const [items, total] = await Promise.all([
    cfg.Model.find(filter).sort(cfg.adminSort || { updatedAt: -1 }).skip(paging.skip).limit(paging.limit).lean(),
    cfg.Model.countDocuments(filter),
  ]);
  ok(res, items, pageMeta(total, paging));
});

export const adminGet = asyncHandler(async (req, res) => {
  const cfg = typeConfig(req);
  if (!mongoose.isValidObjectId(req.params.id)) throw ApiError.notFound();
  const item = await cfg.Model.findById(req.params.id);
  if (!item) throw ApiError.notFound();
  ok(res, item);
});

export const adminCreate = asyncHandler(async (req, res) => {
  const cfg = typeConfig(req);
  const item = await cfg.Model.create(clean(req.body));
  await audit(req, `${req.params.type}.create`, cfg.Model.modelName, item._id);
  created(res, item);
});

export const adminUpdate = asyncHandler(async (req, res) => {
  const cfg = typeConfig(req);
  if (!mongoose.isValidObjectId(req.params.id)) throw ApiError.notFound();
  const item = await cfg.Model.findById(req.params.id);
  if (!item) throw ApiError.notFound();
  item.set(clean(req.body));
  await item.save(); // save() runs validators and hooks (slug, computed fees)
  await audit(req, `${req.params.type}.update`, cfg.Model.modelName, item._id);
  ok(res, item);
});

export const adminDelete = asyncHandler(async (req, res) => {
  const cfg = typeConfig(req);
  if (!mongoose.isValidObjectId(req.params.id)) throw ApiError.notFound();
  const item = await cfg.Model.findByIdAndDelete(req.params.id);
  if (!item) throw ApiError.notFound();
  await audit(req, `${req.params.type}.delete`, cfg.Model.modelName, item._id, { title: item.title || item.name });
  ok(res, { deleted: true });
});
