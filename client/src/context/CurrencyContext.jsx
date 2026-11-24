import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getData } from '../lib/api';
import { CURRENCIES, CURRENCY_SYMBOLS } from '../lib/constants';
import { useSettings } from '../hooks/useSettings';

// Price display for the public website. Amounts are stored in the currency the admin entered; visitors can switch
// to any currency the admin has enabled (Site Settings → Currency) and amounts are converted with live rates.
const KEY = 'lnpak-currency';
const CurrencyContext = createContext(null);

const readSaved = () => { try { return localStorage.getItem(KEY); } catch { return null; } };

export function CurrencyProvider({ children }) {
  const settings = useSettings();
  const cfg = settings.currency || {};
  const enabled = (cfg.enabled?.length ? cfg.enabled : CURRENCIES);
  const fallbackDefault = enabled.includes(cfg.default) ? cfg.default : enabled[0];
  const [saved, setSaved] = useState(readSaved);
  const current = enabled.includes(saved) ? saved : fallbackDefault;
  const format = ['symbol', 'text', 'both'].includes(cfg.format) ? cfg.format : 'both';
  // Rates are only needed when visitors can choose between several currencies.
  const { data } = useQuery({ queryKey: ['currency-rates'], queryFn: () => getData('/currency/rates'), staleTime: 60 * 60 * 1000, enabled: enabled.length > 1 });
  const rates = data?.rates;

  const select = useCallback((code) => { setSaved(code); try { localStorage.setItem(KEY, code); } catch { /* private mode */ } }, []);

  const value = useMemo(() => {
    const convert = (amount, from = 'USD') => {
      if (amount == null || amount === '') return null;
      if (!rates || from === current || !rates[from] || !rates[current]) return { amount: Number(amount), code: !rates || !rates[from] || !rates[current] ? from : current };
      return { amount: (Number(amount) / rates[from]) * rates[current], code: current };
    };
    const write = (amount, code) => {
      const n = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(Math.round(amount));
      const sym = CURRENCY_SYMBOLS[code] || code;
      if (format === 'symbol') return sym === code ? `${code} ${n}` : `${sym}${n}`;
      if (format === 'text') return `${code} ${n}`;
      return sym === code ? `${code} ${n}` : `${sym}${n} ${code}`;
    };
    return { enabled, current, select, format, canSwitch: enabled.length > 1 && !!rates, convert, write, fmt: (amount, from) => { const c = convert(amount, from); return c ? write(c.amount, c.code) : ''; } };
  }, [enabled, current, select, format, rates]);

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export const useCurrency = () => useContext(CurrencyContext) || { enabled: [], current: 'USD', canSwitch: false, select() {}, fmt: (a, c) => (a == null ? '' : `${c || 'USD'} ${a}`) };
