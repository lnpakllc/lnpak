import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Play } from 'lucide-react';
import { get } from '../../lib/api';
import { useSettings } from '../../hooks/useSettings';
import { Seo, Skeleton, ErrorState, EmptyState, Pagination } from '../../components/ui';
import { PageHero } from '../../components/public/PublicLayout';
import { VideoCard, VideoModal, useVideoPlayer } from '../../components/public/VideoPlayer';

const TABS = [['', 'All'], ['video', 'Videos'], ['reel', 'Reels']];

export function VideosPage() {
  const s = useSettings();
  const [kind, setKind] = useState('');
  const [page, setPage] = useState(1);
  const player = useVideoPlayer();
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['content', 'videos', kind, page],
    queryFn: () => get('/content/videos', { kind, page, limit: 12 }),
  });
  const channel = s.social?.youtube;
  const reelsGrid = kind === 'reel';
  return (
    <>
      <Seo title="Videos & Reels" description="Watch LN PAK LLC videos and reels: visa guidance, study abroad, travel and tourism updates." />
      <PageHero eyebrow="Watch & Learn" title="Videos & Reels" subtitle="Visa guidance, study abroad tips and travel stories from the LN PAK LLC team." />
      <section className="container-x py-12">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-2" role="tablist">
            {TABS.map(([k, l]) => (
              <button key={k} role="tab" aria-selected={kind === k} onClick={() => { setKind(k); setPage(1); }} className={`rounded-full px-4 py-2 text-sm font-semibold transition ${kind === k ? 'bg-navy-900 text-white' : 'bg-navy-50 text-navy-900 hover:bg-navy-100'}`}>{l}</button>
            ))}
          </div>
          {channel && <a href={channel} target="_blank" rel="noreferrer" className="btn-outline btn-sm"><Play className="h-4 w-4" />Subscribe on YouTube</a>}
        </div>
        {error ? <ErrorState error={error} onRetry={refetch} /> : isLoading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-64" />)}</div>
        ) : data.data.length ? (
          <>
            <div className={`grid gap-5 ${reelsGrid ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4' : 'sm:grid-cols-2 lg:grid-cols-3'}`}>
              {data.data.map((v) => <VideoCard key={v._id} v={v} onPlay={player.play} />)}
            </div>
            <Pagination meta={data.meta} onPage={(p) => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }} />
          </>
        ) : <EmptyState title="No videos yet" text="New videos and reels are added regularly. Please check back soon." />}
      </section>
      <VideoModal video={player.video} onClose={player.close} />
      <div className="pb-24" />
    </>
  );
}
