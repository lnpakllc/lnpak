export const SERVICES = [
  { value: 'study_visa', label: 'Study Visa' },
  { value: 'visit_visa', label: 'Visit Visa' },
  { value: 'business_visa', label: 'Business Visa' },
  { value: 'work_permit', label: 'Work Permit' },
  { value: 'business_setup', label: 'Business Setup & Relocation' },
  { value: 'hajj_umrah', label: 'Hajj & Umrah' },
  { value: 'religious_tour', label: 'Religious & Spiritual Tour' },
  { value: 'tour_booking', label: 'Tour Package' },
  { value: 'university_admission', label: 'University Admission' },
  { value: 'medical_university', label: 'Medical University' },
  { value: 'scholarship', label: 'Scholarship Assistance' },
  { value: 'documentation', label: 'Documentation Services' },
  { value: 'research_support', label: 'Academic Research & Professional Support' },
  { value: 'general', label: 'General Inquiry' },
];
const LEGACY_SERVICES = { immigration: 'Immigration' }; // older leads
export const serviceLabel = (v) => SERVICES.find((s) => s.value === v)?.label || LEGACY_SERVICES[v] || v || '—';

export const LEAD_STATUSES = [
  { value: 'new', label: 'New', color: 'bg-sky-100 text-sky-800', dot: 'bg-sky-500' },
  { value: 'contacted', label: 'Contacted', color: 'bg-indigo-100 text-indigo-800', dot: 'bg-indigo-500' },
  { value: 'interested', label: 'Interested', color: 'bg-violet-100 text-violet-800', dot: 'bg-violet-500' },
  { value: 'consultation_scheduled', label: 'Consultation Scheduled', color: 'bg-cyan-100 text-cyan-800', dot: 'bg-cyan-500' },
  { value: 'follow_up_required', label: 'Follow-up Required', color: 'bg-amber-100 text-amber-800', dot: 'bg-amber-500' },
  { value: 'documents_requested', label: 'Documents Requested', color: 'bg-orange-100 text-orange-800', dot: 'bg-orange-500' },
  { value: 'converted', label: 'Converted to Client', color: 'bg-emerald-100 text-emerald-800', dot: 'bg-emerald-500' },
  { value: 'not_interested', label: 'Not Interested', color: 'bg-slate-200 text-slate-700', dot: 'bg-slate-400' },
  { value: 'lost', label: 'Lost', color: 'bg-rose-100 text-rose-800', dot: 'bg-rose-500' },
];
export const statusMeta = (v) => LEAD_STATUSES.find((s) => s.value === v) || { label: v, color: 'bg-slate-100 text-slate-700', dot: 'bg-slate-400' };

export const PRIORITIES = [
  { value: 'low', label: 'Low', color: 'text-slate-500' },
  { value: 'medium', label: 'Medium', color: 'text-amber-600' },
  { value: 'high', label: 'High', color: 'text-rose-600' },
];

export const DESTINATIONS = ['United Kingdom', 'United States', 'Russia', 'Uzbekistan', 'Kyrgyzstan', 'Tajikistan', 'Germany', 'France', 'Italy', 'Turkey', 'Canada', 'Australia', 'United Arab Emirates', 'Saudi Arabia', 'Malaysia', 'China', 'Other'];

// All office locations (head office first). Falls back to the single legacy address.
export const getOffices = (contact) => {
  const list = (contact?.offices || []).filter((o) => o?.address || o?.name);
  if (list.length) return list;
  return contact?.address ? [{ name: 'Head Office', address: contact.address, mapUrl: contact.mapUrl }] : [];
};

export const TOUR_CATEGORIES = [
  ['family', 'Family Holiday Packages'], ['honeymoon', 'Honeymoon Packages'], ['group', 'Group Tour Packages'],
  ['private', 'Individual / Private Tours'], ['luxury', 'Luxury Holiday Packages'], ['budget', 'Budget Tour Packages'],
  ['medical', 'Medical Tourism'], ['religious', 'Religious & Spiritual Tourism'], ['umrah', 'Umrah Packages'],
  ['hajj', 'Hajj Packages'], ['business', 'Business & Corporate Travel'],
  ['mice', 'MICE Tourism (Meetings, Incentives, Conferences & Exhibitions)'],
];
// Older categories still resolve to a readable label if any package keeps one.
const LEGACY_TOUR_CATEGORIES = { turkey: 'Turkey Tours', dubai: 'Dubai Tours', malaysia: 'Malaysia Tours', saudi: 'Saudi Arabia Tours', europe: 'Europe Tours', spiritual: 'Spiritual Tours' };
export const tourCategoryLabel = (v) => TOUR_CATEGORIES.find(([k]) => k === v)?.[1] || LEGACY_TOUR_CATEGORIES[v] || v;

export const FUNDING = [
  { value: 'fully_funded', label: 'Fully Funded' },
  { value: 'partially_funded', label: 'Partially Funded' },
  { value: 'institutional', label: 'Institutional' },
];
// Older scholarships may still use this value; it displays fine but is no longer offered for new ones.
const LEGACY_FUNDING = { tuition_waiver: 'Tuition Waiver' };
export const FUNDING_SOURCES = [
  { value: 'government', label: 'Government-based' },
  { value: 'institution', label: 'Institution-based' },
];
export const fundingSourceLabel = (v) => FUNDING_SOURCES.find((f) => f.value === v)?.label || '';
export const TEACHING_LANGUAGES = [
  { value: 'en', label: 'English' }, { value: 'ru', label: 'Russian' }, { value: 'zh', label: 'Chinese' },
];
export const languageLabel = (v) => TEACHING_LANGUAGES.find((l) => l.value === v)?.label || v;
export const TRANSPORT_TYPES = [
  { value: 'plane', label: 'Plane', icon: 'Plane' }, { value: 'train', label: 'Train', icon: 'TrainFront' },
  { value: 'car', label: 'Car', icon: 'Car' }, { value: 'bus', label: 'Bus', icon: 'Bus' }, { value: 'boat', label: 'Boat', icon: 'Ship' },
];
export const transportLabel = (v) => TRANSPORT_TYPES.find((t) => t.value === v)?.label || v;
export const FAQ_PAGES = [
  ['home', 'Home'], ['about', 'About Us'], ['services', 'Services'], ['education-scholarships', 'Education & Scholarships'],
  ['tours', 'Tour Packages'], ['research-support', 'Academic Research & Professional Support'], ['contact', 'Contact'],
];
// Currencies prices can be shown in. SAR and AED remain only for older tour packages.
export const CURRENCIES = ['USD', 'EUR', 'CNY', 'PKR', 'INR', 'RUB', 'TRY', 'GBP'];
export const CURRENCY_SYMBOLS = { USD: '$', EUR: '€', CNY: '¥', PKR: '₨', INR: '₹', RUB: '₽', TRY: '₺', GBP: '£', SAR: 'SAR', AED: 'AED' };
export const CURRENCY_NAMES = { USD: 'US Dollar', EUR: 'Euro', CNY: 'Chinese Yuan', PKR: 'Pakistani Rupee', INR: 'Indian Rupee', RUB: 'Russian Ruble', TRY: 'Turkish Lira', GBP: 'British Pound' };
export const CURRENCY_FORMATS = [['symbol', 'Symbol only ($1,200)'], ['text', 'Code only (USD 1,200)'], ['both', 'Symbol and code ($1,200 USD)']];
export const fundingLabel = (v) => FUNDING.find((f) => f.value === v)?.label || LEGACY_FUNDING[v] || v;

export const VISA_TYPES = [
  { value: 'study_visa', label: 'Study Visa' },
  { value: 'visit_visa', label: 'Visit Visa' },
  { value: 'work_permit', label: 'Work Permit' },
  { value: 'business_visa', label: 'Business Visa' },
  { value: 'immigration', label: 'Immigration' },
];

export const ROLE_LABELS = {
  super_admin: 'Super Admin', admin: 'Admin', manager: 'Manager', visa_consultant: 'Visa Consultant',
  education_consultant: 'Education Consultant', travel_consultant: 'Travel Consultant', sales_agent: 'Sales Agent',
  documentation_officer: 'Documentation Officer', support_staff: 'Support Staff', client: 'Client',
};
export const roleLabel = (k) => ROLE_LABELS[k] || (k || '').replace(/_/g, ' ');

export const money = (amount, currency = 'USD') =>
  amount == null ? '' : new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount);

export const fmtDate = (d, opts = { day: 'numeric', month: 'short', year: 'numeric' }) => (d ? new Date(d).toLocaleDateString('en-GB', opts) : '—');
export const fmtDateTime = (d) => (d ? new Date(d).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—');
export const timeAgo = (d) => {
  const s = Math.floor((Date.now() - new Date(d)) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 604800) return `${Math.floor(s / 86400)}d ago`;
  return fmtDate(d);
};

export const paragraphs = (text) => (text || '').split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
export const whatsappLink = (number, text = 'Hello LN PAK LLC, I would like some information.') =>
  `https://wa.me/${(number || '').replace(/\D/g, '')}?text=${encodeURIComponent(text)}`;
