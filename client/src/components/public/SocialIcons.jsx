// Small brand marks (simple paths, so no extra icon package is needed).
const paths = {
  facebook: 'M14 8h3V4h-3c-2.8 0-4 1.7-4 4.3V10H7v4h3v8h4v-8h3l1-4h-4V8.6c0-.4.3-.6.7-.6z',
  instagram: 'M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4zm5 5a4 4 0 1 0 0 8 4 4 0 0 0 0-8zm5.5-.8a1 1 0 1 0 0 2 1 1 0 0 0 0-2z',
  linkedin: 'M4 9h4v12H4zM6 3a2 2 0 1 1 0 4 2 2 0 0 1 0-4zm4 6h3.8v1.7c.6-1 1.9-2 3.9-2 4 0 4.3 2.6 4.3 6V21h-4v-5.6c0-1.5 0-3.3-2-3.3s-2.1 1.5-2.1 3.2V21H10z',
  youtube: 'M22 8.2a3 3 0 0 0-2.1-2.1C18 5.6 12 5.6 12 5.6s-6 0-7.9.5A3 3 0 0 0 2 8.2 31 31 0 0 0 1.6 12 31 31 0 0 0 2 15.8a3 3 0 0 0 2.1 2.1c1.9.5 7.9.5 7.9.5s6 0 7.9-.5a3 3 0 0 0 2.1-2.1 31 31 0 0 0 .4-3.8 31 31 0 0 0-.4-3.8zM10 15V9l5.2 3z',
  tiktok: 'M16.5 3c.4 2.2 1.8 3.6 4 3.8v3.4a7.4 7.4 0 0 1-4-1.3v6.3a5.8 5.8 0 1 1-5.8-5.8c.3 0 .6 0 .9.1v3.5a2.4 2.4 0 1 0 1.5 2.2V3z',
};

export default function SocialIcons({ social = {}, className = 'h-4 w-4', linkClass = '' }) {
  const entries = Object.entries(paths).filter(([k]) => social[k]);
  if (!entries.length) return null;
  return (
    <div className="flex items-center gap-3">
      {entries.map(([k, d]) => (
        <a key={k} href={social[k]} target="_blank" rel="noreferrer" aria-label={k} className={`transition hover:opacity-80 ${linkClass}`}>
          <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true"><path d={d} /></svg>
        </a>
      ))}
    </div>
  );
}
