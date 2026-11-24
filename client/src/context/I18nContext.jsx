import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { DICTIONARIES, LANGUAGES } from '../lib/translations';

const KEY = 'lnpak-lang';
const I18nContext = createContext({ lang: 'en', setLang: () => {}, t: (s) => s });

const read = () => {
  try {
    const saved = localStorage.getItem(KEY);
    if (LANGUAGES.some((l) => l.code === saved)) return saved;
  } catch { /* storage unavailable */ }
  return 'en';
};

// Site language. `t('English text')` returns the translation, or the English text when none exists.
export function I18nProvider({ children }) {
  const [lang, setLangState] = useState(read);
  useEffect(() => { document.documentElement.lang = lang; }, [lang]);
  const setLang = useCallback((code) => {
    setLangState(code);
    try { localStorage.setItem(KEY, code); } catch { /* ignore */ }
  }, []);
  const t = useCallback((s) => (lang === 'en' ? s : DICTIONARIES[lang]?.[s] ?? s), [lang]);
  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export const useI18n = () => useContext(I18nContext);
