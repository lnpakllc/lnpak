// Fixed lists shared by models, validation and the public API. The client keeps the same lists in client/src/lib/constants.js.
export const CURRENCIES = ['USD', 'EUR', 'CNY', 'PKR', 'INR', 'RUB', 'TRY', 'GBP'];
// Packages created before the currency list was fixed may still use these; they display fine but are not offered for new items.
export const LEGACY_CURRENCIES = ['SAR', 'AED'];
export const ALL_CURRENCY_CODES = [...CURRENCIES, ...LEGACY_CURRENCIES];
export const CURRENCY_FORMATS = ['symbol', 'text', 'both'];

export const FEE_MODES = ['single', 'range', 'text', 'none']; // an unset feeMode means "use the program fees" (older records)
export const SCHOLARSHIP_TYPES = ['fully_funded', 'partially_funded', 'institutional'];
export const FUNDING_SOURCES = ['government', 'institution'];
export const TEACHING_LANGUAGES = ['en', 'ru', 'zh']; // English, Russian, Chinese
export const TRANSPORT_TYPES = ['plane', 'train', 'car', 'bus', 'boat'];

// Pages an FAQ can be placed on.
export const FAQ_PAGES = ['home', 'about', 'services', 'education-scholarships', 'tours', 'research-support', 'contact'];
