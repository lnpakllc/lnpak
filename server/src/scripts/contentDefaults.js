// Content confirmed by LN PAK LLC (Nov 2026). Shared by the starter content (seedData.js)
// and the one-time update for the live database (migrations.js), so both stay identical.

export const CONTACT_EMAIL = 'officelnpak@gmail.com';
export const OFFICE_HOURS = 'Working hours (05:00 AM – 12:00 PM UTC)';

export const ABOUT = {
  title: 'About LN PAK LLC',
  body: [
    'LN PAK LLC is an international education and consultancy company established in 2019.',
    'The company specialises in international student recruitment, university admissions, institutional partnerships, tourism, international business facilitation and advisory services.',
    'LN PAK LLC works with universities and international partners in Russia, Uzbekistan, Kyrgyzstan and Tajikistan, with expanding business interests in other countries.',
  ].join('\n\n'),
  mission: 'To connect people, institutions and businesses with international educational, professional, tourism and commercial opportunities.',
  vision: 'To become a trusted international platform facilitating education, travel, business cooperation and cross-border opportunities.',
  values: ['Transparency', 'Professionalism', 'International collaboration', 'Customer satisfaction', 'Reliability', 'Long-term partnerships'],
};

// Replaces the former "Immigration Services" card.
export const BUSINESS_SETUP_SERVICE = {
  title: 'Business Setup & Relocation',
  slug: 'business-setup-and-relocation',
  serviceType: 'business_setup',
  icon: 'Building2',
  shortDescription: 'Support for setting up a business abroad and relocating with confidence.',
  description: 'Support for setting up a business abroad and relocating with confidence.\n\nOur team explains the options honestly, helps you prepare the required documents and connects you with our international partners. We keep you updated at every step through your client portal.',
  features: ['Business setup guidance', 'Partner and market introductions', 'Relocation planning', 'Document preparation'],
};

// Destination pages added at LN PAK's request. Visa details are templates to be completed in the admin panel.
export const NEW_COUNTRIES = [
  ['Russia', 'RU', 'Europe & Asia'],
  ['Uzbekistan', 'UZ', 'Central Asia'],
  ['Kyrgyzstan', 'KG', 'Central Asia'],
  ['Tajikistan', 'TJ', 'Central Asia'],
];

// Order of countries on the website (lower = first).
export const COUNTRY_ORDER = [
  'United Kingdom', 'United States', 'Russia', 'Uzbekistan', 'Germany', 'Kyrgyzstan', 'France', 'Italy', 'Turkey',
  'Tajikistan', 'Canada', 'Australia', 'United Arab Emirates', 'Saudi Arabia', 'Malaysia', 'China',
];
// Homepage "Visa Destination Explorer" (Canada → Russia, Australia → Uzbekistan, Germany → Kyrgyzstan).
export const HOMEPAGE_COUNTRIES = ['United Kingdom', 'United States', 'Russia', 'Uzbekistan', 'Kyrgyzstan', 'France', 'Italy', 'Turkey'];
// Footer "Popular Destinations" (Canada → Russia, Australia → Uzbekistan, France → Kyrgyzstan).
export const FOOTER_COUNTRIES = ['United Kingdom', 'United States', 'Russia', 'Uzbekistan', 'Germany', 'Kyrgyzstan'];
