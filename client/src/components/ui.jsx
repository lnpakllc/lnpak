// Small shared UI building blocks used by the website, admin panel and client portal.
import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import {
  Loader2, X, Inbox, ChevronLeft, ChevronRight, ImageIcon, Circle, GraduationCap, Plane, Briefcase, HardHat, Globe2, Landmark,
  Moon, FileText, CheckCircle2, ShieldCheck, Headphones, Zap, Handshake, Stethoscope, BookOpen, Award, Users, MapPin,
  Building2, Hotel, Bus, Clock, CalendarDays, Wallet, Languages, Star, Compass, Heart, Sparkles, XCircle, Info,
} from 'lucide-react';
import { assetUrl } from '../lib/api';

// Curated icon set (keeps the bundle small). Admins pick from these names for services.
export const ICONS = {
  GraduationCap, Plane, Briefcase, HardHat, Globe2, Landmark, Moon, FileText, CheckCircle2, ShieldCheck, Headphones, Zap,
  Handshake, Stethoscope, BookOpen, Award, Users, MapPin, Building2, Hotel, Bus, Clock, CalendarDays, Wallet, Languages,
  Star, Compass, Heart, Sparkles, XCircle, Info, Inbox,
};

export function Icon({ name, ...props }) {
  const Cmp = ICONS[name] || Circle;
  return <Cmp {...props} />;
}

export function Seo({ title, description, image, noindex }) {
  const full = title ? `${title} | LN PAK LLC` : 'LN PAK LLC — Visa, Travel, Education & Immigration Consultancy';
  return (
    <Helmet>
      <title>{full}</title>
      {description && <meta name="description" content={description} />}
      <meta property="og:title" content={full} />
      {description && <meta property="og:description" content={description} />}
      {image && <meta property="og:image" content={assetUrl(image)} />}
      <meta property="og:type" content="website" />
      {noindex && <meta name="robots" content="noindex, nofollow" />}
    </Helmet>
  );
}

// Image with a branded fallback if the source is missing or broken.
export function Img({ src, alt = '', className = '', fallbackIcon = 'Globe2', ...rest }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => { setFailed(false); }, [src]);
  if (!src || failed) {
    return (
      <div className={`flex items-center justify-center bg-gradient-to-br from-navy-800 to-navy-950 text-white/40 ${className}`} role="img" aria-label={alt}>
        <Icon name={fallbackIcon} className="h-10 w-10" />
      </div>
    );
  }
  return <img src={assetUrl(src)} alt={alt} loading="lazy" decoding="async" onError={() => setFailed(true)} className={className} {...rest} />;
}

export function Spinner({ className = 'h-5 w-5' }) {
  return <Loader2 className={`animate-spin text-navy-700 ${className}`} />;
}

export function PageLoader() {
  return <div className="flex min-h-[40vh] items-center justify-center"><Spinner className="h-8 w-8" /></div>;
}

export function Skeleton({ className = '' }) {
  return <div className={`animate-pulse rounded-xl bg-slate-200/70 ${className}`} />;
}

export function EmptyState({ title = 'Nothing here yet', text, action, icon: IconCmp = Inbox }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 px-6 py-14 text-center">
      <IconCmp className="mb-3 h-10 w-10 text-slate-300" />
      <p className="font-semibold text-navy-900">{title}</p>
      {text && <p className="mt-1 max-w-sm text-sm text-slate-500">{text}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorState({ error, onRetry }) {
  return (
    <div className="rounded-2xl border border-rose-100 bg-rose-50 px-6 py-8 text-center text-sm text-rose-700">
      <p className="font-semibold">Could not load this</p>
      <p className="mt-1">{error?.message}</p>
      {onRetry && <button className="btn-outline btn-sm mt-4" onClick={onRetry}>Try again</button>}
    </div>
  );
}

export function SectionHeading({ eyebrow, title, subtitle, align = 'center', light = false }) {
  return (
    <div className={`mb-10 ${align === 'center' ? 'text-center' : ''}`}>
      {eyebrow && <p className={`eyebrow mb-2 ${light ? 'text-gold-500' : ''}`}>{eyebrow}</p>}
      <h2 className={`text-2xl sm:text-3xl lg:text-[2.1rem] ${light ? 'text-white' : ''}`}>
        {align === 'center' && <span className="mr-3 hidden h-px w-14 bg-navy-700/40 align-middle sm:inline-block" />}
        {title}
        {align === 'center' && <span className="ml-3 hidden h-px w-14 bg-navy-700/40 align-middle sm:inline-block" />}
      </h2>
      {subtitle && <p className={`mx-auto mt-2 max-w-2xl ${light ? 'text-white/70' : 'text-slate-500'}`}>{subtitle}</p>}
    </div>
  );
}

export function Modal({ open, onClose, title, children, size = 'max-w-lg' }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center bg-navy-950/60 p-0 backdrop-blur-sm sm:items-center sm:p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-label={title} className={`max-h-[94vh] w-full ${size} overflow-y-auto rounded-t-3xl bg-white shadow-lift sm:rounded-3xl`}>
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-6 py-4">
          <h3 className="text-lg">{title}</h3>
          <button className="rounded-full p-1.5 hover:bg-slate-100" onClick={onClose} aria-label="Close"><X className="h-5 w-5" /></button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

export function ConfirmModal({ open, onClose, onConfirm, title = 'Are you sure?', text, confirmText = 'Confirm', danger, loading }) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="max-w-md">
      {text && <p className="text-sm text-slate-600">{text}</p>}
      <div className="mt-6 flex justify-end gap-2">
        <button className="btn-ghost" onClick={onClose}>Cancel</button>
        <button className={`btn ${danger ? 'bg-rose-600 text-white hover:bg-rose-700' : 'btn-primary'}`} disabled={loading} onClick={onConfirm}>
          {loading && <Spinner className="h-4 w-4 text-white" />} {confirmText}
        </button>
      </div>
    </Modal>
  );
}

export function Pagination({ meta, onPage }) {
  if (!meta || meta.pages <= 1) return null;
  return (
    <div className="mt-6 flex items-center justify-between gap-4 text-sm">
      <p className="text-slate-500">Page {meta.page} of {meta.pages} · {meta.total} total</p>
      <div className="flex gap-2">
        <button className="btn-outline btn-sm" disabled={meta.page <= 1} onClick={() => onPage(meta.page - 1)}><ChevronLeft className="h-4 w-4" /> Prev</button>
        <button className="btn-outline btn-sm" disabled={meta.page >= meta.pages} onClick={() => onPage(meta.page + 1)}>Next <ChevronRight className="h-4 w-4" /></button>
      </div>
    </div>
  );
}

export function Badge({ className = 'bg-slate-100 text-slate-700', children }) {
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap ${className}`}>{children}</span>;
}

export function Field({ label, error, children, hint, className = '' }) {
  return (
    <div className={className}>
      {label && <label className="label">{label}</label>}
      {children}
      {hint && !error && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
      {error && <p className="field-error">{error}</p>}
    </div>
  );
}

export function List({ items, icon = 'CheckCircle2', iconClass = 'text-navy-700' }) {
  if (!items?.length) return null;
  return (
    <ul className="space-y-2.5">
      {items.map((it, i) => (
        <li key={i} className="flex gap-3"><Icon name={icon} className={`mt-0.5 h-5 w-5 shrink-0 ${iconClass}`} /><span>{it}</span></li>
      ))}
    </ul>
  );
}

export const ImagePlaceholder = ImageIcon;
