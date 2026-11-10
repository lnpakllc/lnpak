// Remembers campaign parameters from the landing URL for the whole visit, so a lead submitted
// three pages later is still attributed to the Facebook / Google campaign that brought the visitor.
const KEY = 'lnpak_utm';
const FIELDS = ['source', 'medium', 'campaign', 'term', 'content'];

export function captureUtm() {
  try {
    const params = new URLSearchParams(window.location.search);
    const utm = {};
    FIELDS.forEach((f) => { const v = params.get(`utm_${f}`); if (v) utm[f] = v.slice(0, 150); });
    if (!utm.source && params.get('fbclid')) utm.source = 'facebook';
    if (!utm.source && params.get('gclid')) utm.source = 'google';
    if (Object.keys(utm).length) sessionStorage.setItem(KEY, JSON.stringify(utm));
  } catch { /* storage unavailable */ }
}

export function getUtm() {
  try { return JSON.parse(sessionStorage.getItem(KEY) || 'null') || undefined; } catch { return undefined; }
}
