import { useEffect, useRef, useState } from 'react';
import { Play, X } from 'lucide-react';

export const thumb = (id) => `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;

// Thumbnail card. The YouTube player only loads when someone presses play (fast pages, fewer cookies).
export function VideoCard({ v, onPlay }) {
  const reel = v.kind === 'reel';
  return (
    <button type="button" onClick={() => onPlay(v)} className="group card overflow-hidden text-left transition hover:-translate-y-0.5 hover:shadow-lift" aria-label={`Play ${v.title}`}>
      <div className={`relative overflow-hidden bg-navy-950 ${reel ? 'aspect-[9/14]' : 'aspect-video'}`}>
        <img src={thumb(v.youtubeId)} alt="" loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
        <span className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
        <span className="absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-navy-900 shadow-lift transition group-hover:scale-110"><Play className="ml-0.5 h-6 w-6 fill-current" /></span>
        {reel && <span className="absolute left-3 top-3 rounded-full bg-gold-500 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-navy-950">Reel</span>}
      </div>
      <div className="p-4">
        <h3 className="line-clamp-2 text-base font-bold text-navy-900">{v.title}</h3>
        {v.description && <p className="mt-1 line-clamp-2 text-sm text-slate-500">{v.description}</p>}
      </div>
    </button>
  );
}

// Pop-up player for one video.
export function VideoModal({ video, onClose }) {
  const closeRef = useRef(null);
  useEffect(() => {
    if (!video) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [video, onClose]);
  if (!video) return null;
  const reel = video.kind === 'reel';
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4" role="dialog" aria-modal="true" aria-label={video.title} onClick={onClose}>
      <div className={`relative w-full ${reel ? 'max-w-sm' : 'max-w-4xl'}`} onClick={(e) => e.stopPropagation()}>
        <button ref={closeRef} onClick={onClose} className="absolute -top-11 right-0 flex items-center gap-1 rounded-full bg-white/15 px-3 py-1.5 text-sm font-semibold text-white hover:bg-white/25" aria-label="Close video"><X className="h-4 w-4" />Close</button>
        <div className={`overflow-hidden rounded-2xl bg-black shadow-lift ${reel ? 'aspect-[9/16] max-h-[80vh]' : 'aspect-video'}`}>
          <iframe
            className="h-full w-full"
            src={`https://www.youtube-nocookie.com/embed/${video.youtubeId}?autoplay=1&rel=0&modestbranding=1&playsinline=1`}
            title={video.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
        </div>
        <p className="mt-3 text-center text-sm font-semibold text-white">{video.title}</p>
      </div>
    </div>
  );
}

// Small helper so pages can share the open/close state.
export function useVideoPlayer() {
  const [video, setVideo] = useState(null);
  return { video, play: setVideo, close: () => setVideo(null) };
}
