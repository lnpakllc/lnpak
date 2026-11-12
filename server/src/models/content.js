// Website content models managed from the admin panel (CMS).
import mongoose from 'mongoose';
import { slugify } from '../utils/http.js';

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
    currency: { type: String, default: 'USD' },
    priceNote: String, // e.g. "per person, twin sharing"
    hotel: String,
    transport: String,
    summary: { type: String, maxlength: 400 },
    included: [String],
    excluded: [String],
    itinerary: [new Schema({ day: Number, title: String, description: String }, { _id: false })],
    availability: { type: String, enum: ['available', 'limited', 'sold_out'], default: 'available' },
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

universitySchema.pre('save', function computeTuition() {
  const fees = (this.programs || []).map((p) => p.tuitionPerYear).filter((n) => typeof n === 'number');
  this.tuitionMin = fees.length ? Math.min(...fees) : undefined;
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
    fundingType: { type: String, enum: ['fully_funded', 'partially_funded', 'tuition_waiver'], index: true },
    scholarshipType: String, // government, university, private
    fundingDetails: String,
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
  }),
);
