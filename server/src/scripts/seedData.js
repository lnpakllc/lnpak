// Starter content for the website. Visa notes, fees, dates and university data are placeholders,
// clearly labelled "Sample", and must be replaced or verified in the admin panel before going live.
// Used by `npm run seed` and by the first-run setup page (/admin/setup).
import { Service, Country, TourPackage, University, Scholarship, Testimonial, Faq } from '../models/content.js';
import { Setting } from '../models/system.js';
import {
  CONTACT_EMAIL, OFFICE_HOURS, ABOUT, BUSINESS_SETUP_SERVICE, NEW_COUNTRIES, COUNTRY_ORDER, HOMEPAGE_COUNTRIES, FOOTER_COUNTRIES,
} from './contentDefaults.js';

const VERIFY = 'Requirements change often. Please confirm the latest rules with our consultant and the official embassy or immigration website before applying.';

const services = [
  { title: 'Study Visa', serviceType: 'study_visa', icon: 'GraduationCap', image: '/images/education-students.jpg', shortDescription: 'Study abroad at top universities with guidance from course selection to visa.', features: ['Course and university selection', 'Admission application support', 'Visa file preparation', 'Interview preparation', 'Pre-departure briefing'] },
  { title: 'Visit Visa', serviceType: 'visit_visa', icon: 'Plane', shortDescription: 'Explore the world with ease — tourist and family visit visa assistance.', features: ['Eligibility check', 'Document checklist', 'Travel itinerary and hotel bookings', 'Application form filling'] },
  { title: 'Business Visa', serviceType: 'business_visa', icon: 'Briefcase', shortDescription: 'Grow your business globally with business and conference visa support.', features: ['Invitation letter guidance', 'Company document checklist', 'Application preparation'] },
  { title: 'Work Permit', serviceType: 'work_permit', icon: 'HardHat', shortDescription: 'Build your career abroad with lawful work permit guidance.', features: ['Profile assessment', 'Employer documentation guidance', 'Work visa application support'] },
  { title: BUSINESS_SETUP_SERVICE.title, serviceType: BUSINESS_SETUP_SERVICE.serviceType, icon: BUSINESS_SETUP_SERVICE.icon, shortDescription: BUSINESS_SETUP_SERVICE.shortDescription, features: BUSINESS_SETUP_SERVICE.features },
  { title: 'Religious & Spiritual Tours', serviceType: 'religious_tour', icon: 'Landmark', shortDescription: 'Ziyarat and spiritual journeys planned with care.', features: ['Group and family tours', 'Hotels near holy sites', 'Guided ziyarat'] },
  { title: 'Hajj & Umrah', serviceType: 'hajj_umrah', icon: 'Moon', image: '/images/tour-3.jpg', shortDescription: 'Complete Hajj and Umrah packages — visa, flights, hotels and transport.', features: ['Umrah visa processing', 'Flights and hotels', 'Ground transport', 'Ziyarat tours'] },
  { title: 'Documentation Services', serviceType: 'documentation', icon: 'FileText', shortDescription: 'Complete assistance with attestation, translation and application documents.', features: ['Document checklists', 'Attestation guidance', 'Translation coordination', 'Form filling'] },
].map((s, i) => ({
  ...s,
  sortOrder: i,
  isFeatured: true,
  description: `${s.shortDescription}\n\nOur team reviews your profile, explains the options honestly and prepares a complete, well-organised file. We keep you updated at every step through your client portal.`,
  process: ['Submit your inquiry', 'Free initial assessment', 'Consultation with our team', 'Documentation & application', 'Application tracking', 'Final updates'],
  faqs: [{ question: 'Do you guarantee a visa?', answer: 'No consultant can guarantee a visa. The decision is made only by the embassy or immigration authority. We make sure your application is complete and well prepared.' }],
}));

const countryList = [
  ['United Kingdom', 'GB', 'Europe'], ['United States', 'US', 'North America'], ['Canada', 'CA', 'North America'], ['Australia', 'AU', 'Oceania'],
  ['Germany', 'DE', 'Europe'], ['France', 'FR', 'Europe'], ['Italy', 'IT', 'Europe'], ['Turkey', 'TR', 'Europe & Asia'],
  ['United Arab Emirates', 'AE', 'Middle East'], ['Saudi Arabia', 'SA', 'Middle East'], ['Malaysia', 'MY', 'Asia'], ['China', 'CN', 'Asia'],
  ...NEW_COUNTRIES,
];
const visa = (type, title, country) => ({
  type, title,
  overview: `Sample overview for ${title.toLowerCase()} to ${country}. Replace this text in Admin → Countries with current, verified guidance.`,
  eligibility: ['Valid passport', 'Clear purpose of travel', 'Proof of sufficient funds'],
  documents: ['Passport (valid for the required period)', 'Recent photographs', 'Bank statements', 'Supporting letters relevant to the visa type'],
  process: ['Free assessment with LN PAK', 'Document collection and review', 'Online application / appointment booking', 'Biometrics or interview where required', 'Decision by the embassy'],
  processingNote: VERIFY,
});
export const countryTemplate = (name, isoCode, region) => ({
  name, isoCode, region,
  overview: `Sample destination overview for ${name}. Add a verified overview, popular cities and key facts from the admin panel.`,
  visas: [visa('study_visa', 'Study Visa', name), visa('visit_visa', 'Visit Visa', name), visa('work_permit', 'Work Permit', name), visa('business_visa', 'Business Visa', name)],
  faqs: [{ question: `How long does a ${name} visa take?`, answer: `Processing times vary by visa type and season. ${VERIFY}` }],
});
const countries = countryList.map(([name, isoCode, region]) => ({
  ...countryTemplate(name, isoCode, region),
  sortOrder: COUNTRY_ORDER.indexOf(name),
  isFeatured: HOMEPAGE_COUNTRIES.includes(name),
  showInFooter: FOOTER_COUNTRIES.includes(name),
}));

const days = (n) => new Date(Date.now() + n * 864e5);
// Tour packages are shown without prices (price on request via the booking inquiry).
const tour = (title, category, destination, img, d, n, extra = {}) => ({
  title, category, destination, images: [img], durationDays: d, durationNights: n,
  departureDates: [days(30), days(60)], hotel: '4-star hotel (sample)', transport: 'Airport transfers and private coach',
  summary: `A sample ${d}-day ${destination} package. Edit itinerary and hotels in Admin → Tour Packages.`,
  included: ['Hotel accommodation', 'Daily breakfast', 'Airport transfers', 'Guided city tour'],
  excluded: ['International flights (unless stated)', 'Visa fees', 'Personal expenses'],
  itinerary: Array.from({ length: Math.min(d, 5) }, (_, k) => ({ day: k + 1, title: k === 0 ? 'Arrival' : `Day ${k + 1} sightseeing`, description: 'Sample itinerary text — replace with the real plan.' })),
  isFeatured: true, ...extra,
});
const tours = [
  tour('Turkey Tour', 'family', 'Istanbul & Cappadocia', '/images/tour-0.jpg', 7, 6),
  tour('Dubai Tour', 'family', 'Dubai', '/images/tour-1.jpg', 5, 4),
  tour('Malaysia Tour', 'honeymoon', 'Kuala Lumpur & Langkawi', '/images/tour-2.jpg', 6, 5),
  tour('Saudi Umrah Package', 'umrah', 'Makkah & Madinah', '/images/tour-3.jpg', 14, 13, { hotel: 'Hotels near Haram (sample)' }),
];

const uni = (name, country, city, programs, extra = {}) => ({
  name, country, city, isMedical: true, programs, admissionOpen: true,
  description: 'Sample university profile for development. Replace with a real, verified university before going live.',
  admissionRequirements: ['FSc / A-Level (Pre-Medical) or equivalent', 'Minimum marks as required by the university', 'Medical entry test where applicable'],
  languageRequirements: 'English proficiency as required by the university.',
  requiredDocuments: ['Passport', 'Academic transcripts', 'Photographs', 'Medical certificate'],
  deadlines: 'Check with our consultant for the current intake.',
  dataNote: 'SAMPLE DATA — fees, programs and requirements are placeholders, not real university information.',
  ...extra,
});
const universities = [
  uni('Sample Medical University A (Demo)', 'Georgia', 'Tbilisi', [{ name: 'Medicine', degree: 'MD', durationYears: 6, tuitionPerYear: 6000, language: 'English', intake: 'September' }]),
  uni('Sample Medical University B (Demo)', 'Kyrgyzstan', 'Bishkek', [{ name: 'General Medicine', degree: 'MBBS', durationYears: 5, tuitionPerYear: 4000, language: 'English', intake: 'September' }]),
  uni('Sample Medical University C (Demo)', 'China', 'Wuhan', [{ name: 'Clinical Medicine', degree: 'MBBS', durationYears: 6, tuitionPerYear: 5500, language: 'English', intake: 'September' }]),
  uni('Sample University D (Demo)', 'Turkey', 'Istanbul', [{ name: 'Medicine', degree: 'MD', durationYears: 6, tuitionPerYear: 9000, language: 'English', intake: 'September' }, { name: 'Computer Engineering', degree: 'BSc', durationYears: 4, tuitionPerYear: 5000, language: 'English', intake: 'September' }]),
];

// Real, well-known programmes. Funding descriptions are general; deadlines are left empty on purpose
// because they change every year — staff add the current deadline from the official site.
const scholarships = [
  { title: 'Chevening Scholarships', country: 'United Kingdom', provider: 'UK Government (FCDO)', degreeLevels: ['Master'], fields: ['Any'], fundingType: 'fully_funded', scholarshipType: 'Government', officialUrl: 'https://www.chevening.org/' },
  { title: 'Türkiye Scholarships', country: 'Turkey', provider: 'Government of Türkiye', degreeLevels: ['Bachelor', 'Master', 'PhD'], fields: ['Any'], fundingType: 'fully_funded', scholarshipType: 'Government', officialUrl: 'https://www.turkiyeburslari.gov.tr/' },
  { title: 'DAAD Scholarships', country: 'Germany', provider: 'German Academic Exchange Service (DAAD)', degreeLevels: ['Master', 'PhD'], fields: ['Any'], fundingType: 'fully_funded', scholarshipType: 'Government', officialUrl: 'https://www.daad.de/en/' },
  { title: 'Erasmus Mundus Joint Masters', country: 'Europe', provider: 'European Union', degreeLevels: ['Master'], fields: ['Any'], fundingType: 'fully_funded', scholarshipType: 'International', officialUrl: 'https://erasmus-plus.ec.europa.eu/' },
  { title: 'Chinese Government Scholarship', country: 'China', provider: 'China Scholarship Council', degreeLevels: ['Bachelor', 'Master', 'PhD'], fields: ['Any'], fundingType: 'fully_funded', scholarshipType: 'Government', officialUrl: 'https://www.campuschina.org/' },
].map((s) => ({
  ...s,
  fundingDetails: 'Funding typically covers tuition and a living allowance — confirm the exact benefits for the current year on the official website.',
  eligibility: ['Academic record as required by the programme', 'Meets nationality and age rules of the programme', 'English or other language proficiency as required'],
  documents: ['Passport', 'Degree and transcripts', 'CV', 'Statement of purpose', 'Reference letters'],
  procedure: ['Check eligibility with LN PAK', 'Prepare documents and essays', 'Apply on the official portal before the deadline', 'Interview / selection if shortlisted'],
}));

const testimonials = [1, 2, 3].map((n) => ({
  name: `Sample Client ${n}`,
  service: ['Study Visa Client', 'Visit Visa Client', 'Work Permit Client'][n - 1],
  quote: 'Sample review — replace with a real client testimonial (with their permission) before launch.',
  rating: 5,
}));

const faqs = [
  ['Is the first consultation free?', 'Yes. Your initial assessment is free. We review your profile and explain your options before any paid service starts.', 'General'],
  ['Can you guarantee my visa?', 'No. Visa decisions are made only by the embassy or immigration authority. We make sure your application is complete, accurate and well prepared.', 'Visa'],
  ['How do I track my application?', 'After you become our client you receive a login to the LN PAK client portal, where you can see your application status, upload documents and message your consultant.', 'General'],
  ['Which documents do I need?', 'It depends on the country and visa type. After your assessment your consultant shares a personalised checklist.', 'Visa'],
  ['Do you help with medical university admissions?', 'Yes. We help you compare medical universities, check entry requirements and apply for admission.', 'Education'],
  ['Do you arrange Umrah packages?', 'Yes. We arrange Umrah visas, flights, hotels and transport. Contact us for current packages and dates.', 'Tours'],
].map(([title, answer, category], i) => ({ title, answer, category, sortOrder: i }));

const settings = {
  key: 'site',
  contact: { email: CONTACT_EMAIL, phone: '+7 962 359-59-40', whatsapp: '79623595940', address: 'Izhevsk, Russia', officeHours: OFFICE_HOURS },
  social: { facebook: 'https://facebook.com/', instagram: 'https://instagram.com/', linkedin: 'https://linkedin.com/', youtube: 'https://youtube.com/' },
  hero: {
    eyebrow: 'Dream • Plan • Travel • Study • Settle',
    title: 'Your Global Journey Starts with LN PAK LLC',
    subtitle: 'Expert Visa, Travel, Education and Immigration Consultancy Services for a Better Future Abroad.',
    image: '/images/hero-landmarks.jpg',
  },
  about: ABOUT,
  footerAbout: 'Expert visa, travel, education and immigration consultancy — your global journey partner.',
  pages: {
    privacy: 'This is placeholder privacy policy text. Replace it in Admin → Settings → Pages with your approved policy before launch.',
    terms: 'This is placeholder terms & conditions text. Replace it in Admin → Settings → Pages with your approved terms before launch.',
    refund: 'This is placeholder refund policy text. Replace it in Admin → Settings → Pages with your approved refund policy before launch.',
  },
  seo: { metaTitle: 'LN PAK LLC — Visa, Travel, Education & Immigration Consultancy', metaDescription: 'Study visa, visit visa, work permit, Hajj & Umrah, tour packages, university admissions and scholarships — expert guidance from LN PAK LLC.' },
};


// Adds sample records only to sections that are still empty (never overwrites real content).
export async function seedContent({ fresh = false, log = () => {} } = {}) {
  const sets = [[Service, services], [Country, countries], [TourPackage, tours], [University, universities], [Scholarship, scholarships], [Testimonial, testimonials], [Faq, faqs]];
  const added = {};
  for (const [Model, rows] of sets) {
    if (fresh) await Model.deleteMany({});
    if (await Model.estimatedDocumentCount()) { log(`${Model.modelName}: already has data, skipped`); continue; }
    for (const row of rows) await Model.create(row); // create() so slugs and computed fields run
    added[Model.modelName] = rows.length;
    log(`${Model.modelName}: ${rows.length} sample records`);
  }
  return added;
}

// Creates the website settings (contact details, hero, pages) if they do not exist yet.
// A blank settings record (auto-created when the website was first opened) is filled in too.
export async function seedSettings({ fresh = false } = {}) {
  if (fresh) await Setting.deleteMany({ key: 'site' });
  const doc = await Setting.findOne({ key: 'site' });
  if (!doc) { await Setting.create(settings); return true; }
  let changed = false;
  for (const [section, defaults] of Object.entries(settings)) {
    if (section === 'key') continue;
    const current = doc.get(section);
    const empty = current == null || current === '' || (typeof current === 'object' && !Object.values(current.toObject ? current.toObject() : current).some(Boolean));
    if (empty) { doc.set(section, defaults); changed = true; }
  }
  if (changed) await doc.save();
  return changed;
}
