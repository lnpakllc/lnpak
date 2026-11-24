import { useI18n } from '../../context/I18nContext';
import { LANGUAGES } from '../../lib/translations';

// Interface language: English, Русский, 中文.
export default function LanguageSwitcher({ className = '' }) {
  const { lang, setLang, t } = useI18n();
  return (
    <label className={`inline-flex items-center ${className}`}>
      <span className="sr-only">{t('Language')}</span>
      <select value={lang} onChange={(e) => setLang(e.target.value)} className="rounded-full border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-navy-900">
        {LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
      </select>
    </label>
  );
}
