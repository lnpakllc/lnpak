// Website content models managed from the admin panel (CMS).
import mongoose from 'mongoose';
import { slugify } from '../utils/http.js';
import { ALL_CURRENCY_CODES, FEE_MODES, SCHOLARSHIP_TYPES, FUNDING_SOURCES, TEACHING_LANGUAGES, TRANSPORT_TYPES, FAQ_PAGES } from '../config/options.js';

const { Schema } = mongoose;

const seo = {
  metaTitle: { type: String, maxlength: 70 },
  metaDescription: { type: String, maxlength: 170 },
  ogImage: String,
};

const faqItem = new Schema({ question: String, answer: String }, { _id: false });

// Adds slug, published flag, sort order, SEO fields and auto-slug from title/name.
function withCommon(def, titleField = 'title') {
  const schema = new Schema(
    {
      ...def,
      slug: { type: String, unique: true, index: true, lowercase: true, trim: true },
      isPublished: { type: Boolean, default: true, index: true },
      isFeatured: { type: Boolean, default: false },
      sortOrder: { type: Number, default: 0 },
      seo,
    },
    { timestamps: true },
  );
  schema.pre('validate', function setSlug() {
    if (!this.slug && this[titleField]) this.slug = slugify(this[titleField]);
    else if (this.slug) this.slug = slugify(this.slug);
  });
  return schema;
}

export const Service = mongoose.model(
  'Service',
  withCommon({
    title: { type: String, required: true, trim: true, maxlength: 120 },
    serviceType: { type: String, required: true }, // maps to Lead.service for the "Apply" form
    icon: { type: String, default: 'FileText' }, // lucide icon name
    image: String,
    shortDescription: { type: String, maxlength: 300 },
    description: String, // long text, paragraphs separated by blank lines
    features: [String],
    process: [String],
    documents: [String],
    faqs: [faqItem],
  }),
);

const visaInfo = new Schema(
  {
    type: { type: String, enum: ['study_visa', 'visit_visa', 'work_permit', 'business_visa', 'immigration'], required: true },
    title: String,
    overview: String,
    eligibility: [String],
    documents: [String],
    process: [String],
    processingNote: String,
  },
  { _id: false },
);

export const Country = mongoose.model(
  'Country',
  withCommon(
    {
      name: { type: String, required: true, trim: true, maxlength: 80 },
      isoCode: { type: String, uppercase: true, maxlength: 2 },
      region: String,
      image: String,
      overview: String,
      visas: [visaInfo],
      faqs: [faqItem],
      lastReviewedAt: Date, // shown on the page so visitors know how fresh the info is
      showInFooter: { type: Boolean, default: false }, // footer "Popular Destinations"
    },
    'name',
  ),
);

// A package can list any number of hotels (or none). People per room is a single value (peopleMin only) or a range.
const tourHotel = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 160 },
    city: { type: String, trim: true, maxlength: 100 },
    stars: { type: Number, min: 1, max: 5 },
    peopleMin: { type: Number, required: [true, 'People per room is required for each hotel'], min: 1, max: 20, validate: { validator: Number.isInteger, message: 'People per room must be a whole number' } },
    peopleMax: {
      type: Number, min: 1, max: 20,
      validate: [
        { validator: (v) => v == null || Number.isInteger(v), message: 'People per room must be a whole number' },
        { validator(v) { return v == null || this.peopleMin == null || v >= this.peopleMin; }, message: 'The highest people-per-room value cannot be lower than the lowest' },
      ],
    },
    notes: { type: String, trim: true, maxlength: 255 },
  },
  { _id: false },
);

export const TourPackage = mongoose.model(
  'TourPackage',
  withCommon({
    title: { type: String, required: true, trim: true, maxlength: 140 },
    category: { type: String, index: true }, // family, honeymoon, group, private, luxury, budget, medical, religious, umrah, hajj, business, mice
    destination: String,
    images: [String],
    durationDays: Number,
    durationNights: Number,
    departureDates: [Date],
    price: Number,
    currency: { type: String, enum: ALL_CURRENCY_CODES, default: 'USD' },
    priceNote: String, // e.g. "per person, twin sharing"
    hotel: String, // older single-hotel text; new packages use `hotels`
    hotels: { type: [tourHotel], default: [] }, // none, one or many
    transport: String, // older free text; new packages use `transports`
    transports: [{ type: String, enum: TRANSPORT_TYPES }],
    summary: { type: String, maxlength: 400 },
    included: [String],
    excluded: [String],
    itinerary: [new Schema({ day: Number, title: String, description: String }, { _id: false })],
    availability: { type: String, enum: ['available', 'on_request', 'limited', 'sold_out'], default: 'available' },
  }),
);

const program = new Schema(
  {
    name: String,
    degree: String, // MBBS, MD, BDS, BSc ...
    durationYears: Number,
    tuitionPerYear: Number,
    currency: { type: String, default: 'USD' },
    language: String,
    intake: String,
  },
  { _id: false },
);

const universitySchema = withCommon(
    {
      name: { type: String, required: true, trim: true, maxlength: 160 },
      logo: String,
      image: String,
      country: { type: String, index: true },
      city: String,
      isMedical: { type: Boolean, default: false, index: true },
      description: String,
      programs: [program],
      // Tuition fee shown on the university: a single amount, a range, plain text, or nothing.
      // When feeMode is not set (older records) the fees of the programs below are used instead.
      feeMode: { type: String, enum: FEE_MODES },
      tuitionFee: { type: Number, min: 0 },
      tuitionFeeMax: {
        type: Number, min: 0,
        validate: { validator(v) { return v == null || this.tuitionFee == null || v >= this.tuitionFee; }, message: 'The highest fee cannot be lower than the lowest' },
      },
      feeCurrency: { type: String, enum: ALL_CURRENCY_CODES, default: 'USD' },
      feeText: { type: String, maxlength: 255, trim: true },
      scholarshipType: { type: String, enum: [...SCHOLARSHIP_TYPES, ''] }, // empty = no scholarship option
      scholarshipSource: { type: String, enum: [...FUNDING_SOURCES, ''] },
      teachingLanguages: [{ type: String, enum: TEACHING_LANGUAGES }], // English, Russian, Chinese
      tuitionMin: Number, // computed from programs for filtering
      languages: [String],
      admissionOpen: { type: Boolean, default: true },
      admissionRequirements: [String],
      languageRequirements: String,
      requiredDocuments: [String],
      deadlines: String,
      website: String,
      dataNote: String, // e.g. "Fees verified with university website on ..."
    },
    'name',
  );

universitySchema.pre('validate', function checkFeeMode() {
  if (this.feeMode === 'single' && this.tuitionFee == null) this.invalidate('tuitionFee', 'Enter the tuition fee amount');
  if (this.feeMode === 'range' && (this.tuitionFee == null || this.tuitionFeeMax == null)) this.invalidate('tuitionFee', 'Enter both the lowest and the highest fee');
  if (this.feeMode === 'text' && !this.feeText?.trim()) this.invalidate('feeText', 'Enter the fee text');
  if (this.scholarshipType && !this.scholarshipSource) this.invalidate('scholarshipSource', 'Choose the scholarship funding source (government or institution)');
});

universitySchema.pre('save', function computeTuition() {
  const fees = (this.programs || []).map((p) => p.tuitionPerYear).filter((n) => typeof n === 'number');
  this.tuitionMin = fees.length ? Math.min(...fees) : undefined;
  if (['single', 'range'].includes(this.feeMode) && this.tuitionFee != null) this.tuitionMin = this.tuitionFee;
  this.languages = [...new Set((this.programs || []).map((p) => p.language).filter(Boolean))];
});

export const University = mongoose.model('University', universitySchema);

export const Scholarship = mongoose.model(
  'Scholarship',
  withCommon({
    title: { type: String, required: true, trim: true, maxlength: 180 },
    country: { type: String, index: true },
    provider: String, // university or organisation
    degreeLevels: [String], // bachelor, master, phd ...
    fields: [String],
    fundingType: { type: String, enum: [...SCHOLARSHIP_TYPES, 'tuition_waiver'], index: true }, // fully funded / partially funded / institutional ('tuition_waiver' = older records)
    fundingSource: { type: String, enum: [...FUNDING_SOURCES, ''], index: true }, // government-based or institution-based
    languages: [{ type: String, enum: TEACHING_LANGUAGES }], // English, Russian, Chinese
    scholarshipType: String, // older free-text label (government, university, private)
    fundingDetails: String, // typed text: line breaks and "- " bullets are kept on the public page
    eligibility: [String],
    documents: [String],
    deadline: { type: Date, index: true },
    procedure: [String],
    officialUrl: String,
    image: String,
  }),
);

export const Testimonial = mongoose.model(
  'Testimonial',
  withCommon(
    {
      name: { type: String, required: true, maxlength: 80 },
      service: String,
      quote: { type: String, required: true, maxlength: 600 },
      rating: { type: Number, min: 1, max: 5, default: 5 },
      photo: String,
    },
    'name',
  ),
);

export const Faq = mongoose.model(
  'Faq',
  withCommon({
    title: { type: String, required: true, maxlength: 300 }, // the question
    answer: { type: String, required: true },
    category: { type: String, default: 'General', index: true },
    pages: [{ type: String, enum: FAQ_PAGES, index: true }], // pages this question is shown on
  }),
);

// FAQ sections/categories managed by staff; questions pick one of these by name.
export const FaqCategory = mongoose.model(
  'FaqCategory',
  withCommon({ name: { type: String, required: true, trim: true, maxlength: 80 } }, 'name'),
);

// YouTube videos and reels shown on the website's Videos page. Staff paste a normal YouTube link.
export function parseYouTube(input) {
  const v = String(input || '').trim();
  if (/^[\w-]{11}$/.test(v)) return { id: v, short: false };
  try {
    const u = new URL(/^https?:\/\//i.test(v) ? v : `https://${v}`);
    const host = u.hostname.replace(/^(www|m|music)\./, '');
    let id = null;
    let short = false;
    if (host === 'youtu.be') id = u.pathname.split('/')[1];
    else if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
      const [, kind, second] = u.pathname.split('/');
      if (kind === 'watch') id = u.searchParams.get('v');
      else if (['shorts', 'embed', 'live', 'v'].includes(kind)) { id = second; short = kind === 'shorts'; }
    }
    return /^[\w-]{11}$/.test(id || '') ? { id, short } : null;
  } catch { return null; }
}

export const Video = mongoose.model(
  'Video',
  withCommon(
    {
      title: { type: String, required: true, trim: true, maxlength: 160 },
      url: {
        type: String, required: [true, 'Paste a YouTube video or Shorts link'], trim: true, maxlength: 300,
        set(value) {
          const p = parseYouTube(value);
          this.youtubeId = p?.id;
          if (p?.short) this.kind = 'reel';
          return value;
        },
        validate: { validator() { return !!this.youtubeId; }, message: 'This is not a valid YouTube link' },
      },
      youtubeId: { type: String, index: true },
      kind: { type: String, enum: ['video', 'reel'], default: 'video', index: true },
      description: { type: String, maxlength: 400 },
    },
    'youtubeId', // slug comes from the video id, so two videos can share a title
  ),
);
