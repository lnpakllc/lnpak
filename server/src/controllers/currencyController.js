// Exchange rates for the price switcher on the public website. Rates are units of each currency per 1 USD.
// They come from a free public feed and are cached for six hours; if the feed is unreachable the last good
// rates (or the built-in approximate ones) are used, so prices never disappear.
import { asyncHandler, ok } from '../utils/http.js';
import { ALL_CURRENCY_CODES } from '../config/options.js';

const FEED = process.env.EXCHANGE_RATES_URL || 'https://open.er-api.com/v6/latest/USD';
const SIX_HOURS = 6 * 60 * 60 * 1000;

// Approximate values, used only until the first successful refresh.
export const FALLBACK_RATES = { USD: 1, EUR: 0.92, CNY: 7.2, PKR: 280, INR: 83, RUB: 92, TRY: 32, GBP: 0.79, SAR: 3.75, AED: 3.67 };

let cache = { rates: FALLBACK_RATES, fetchedAt: 0, source: 'fallback' };

export async function currentRates() {
  if (Date.now() - cache.fetchedAt < SIX_HOURS) return cache;
  try {
    const res = await fetch(FEED, { signal: AbortSignal.timeout(4000) });
    const data = await res.json();
    if (!res.ok || !data?.rates) throw new Error('bad response');
    const rates = {};
    for (const c of ALL_CURRENCY_CODES) rates[c] = Number(data.rates[c]) > 0 ? Number(data.rates[c]) : FALLBACK_RATES[c];
    cache = { rates, fetchedAt: Date.now(), source: 'live' };
  } catch {
    cache = { ...cache, fetchedAt: Date.now() - SIX_HOURS + 10 * 60 * 1000 }; // retry in 10 minutes
  }
  return cache;
}

export const rates = asyncHandler(async (_req, res) => {
  const c = await currentRates();
  res.set('Cache-Control', 'public, max-age=3600');
  ok(res, { base: 'USD', rates: c.rates, source: c.source, updatedAt: c.fetchedAt ? new Date(c.fetchedAt).toISOString() : null });
});
