import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import type { Media } from '@/api/types';
import { cn } from '@/lib/utils';

/** One media item rendered inline. Videos use preload="metadata" so they stream on play. */
export function MediaView({ media, className, onOpen }: { media: Media; className?: string; onOpen?: () => void }) {
  if (media.type === 'video') {
    return (
      <figure className={className}>
        <video controls preload="metadata" playsInline className="aspect-video w-full rounded-lg border border-line bg-black" aria-label={media.altText || media.caption}>
          <source src={media.url} type={media.mimeType || 'video/mp4'} />
          Your browser cannot play this video. <a href={media.url}>Download it instead</a>.
        </video>
        {media.caption && <figcaption className="mt-2 text-sm text-ink-muted">{media.caption}</figcaption>}
      </figure>
    );
  }
  if (media.type === 'embed') {
    return (
      <figure className={className}>
        <div className="aspect-video w-full overflow-hidden rounded-lg border border-line bg-black">
          <iframe
            src={media.url}
            title={media.caption || 'Embedded video'}
            className="h-full w-full"
            loading="lazy"
            allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
        </div>
        {media.caption && <figcaption className="mt-2 text-sm text-ink-muted">{media.caption}</figcaption>}
      </figure>
    );
  }
  // Tall screenshots (menus, side panels) keep their shape instead of stretching to full width.
  const img = <img src={media.url} alt={media.altText} loading="lazy" decoding="async" className="max-h-[520px] w-auto max-w-full rounded-lg border border-line bg-surface-sunken object-contain" />;
  return (
    <figure className={className}>
      {onOpen ? (
        <button onClick={onOpen} className="block max-w-full cursor-zoom-in rounded-lg" aria-label={`Enlarge image${media.caption ? `: ${media.caption}` : ''}`}>
          {img}
        </button>
      ) : (
        img
      )}
      {media.caption && <figcaption className="mt-2 text-sm text-ink-muted">{media.caption}</figcaption>}
    </figure>
  );
}

/** Images become a thumbnail grid that opens a lightbox; videos play inline. */
export function MediaGallery({ items }: { items: Media[] }) {
  const images = items.filter((m) => m.type === 'image');
  const others = items.filter((m) => m.type !== 'image');
  const [open, setOpen] = useState<number | null>(null);
  if (!items.length) return null;
  return (
    <div className="space-y-4">
      {images.length > 0 && (
        <div className={cn('grid gap-3', images.length === 1 ? 'grid-cols-1' : 'grid-cols-2')}>
          {images.map((m, i) => (
            <MediaView key={m._id} media={m} onOpen={() => setOpen(i)} className={images.length === 1 ? 'max-w-2xl' : ''} />
          ))}
        </div>
      )}
      {others.map((m) => (
        <MediaView key={m._id} media={m} className="max-w-2xl" />
      ))}
      {open !== null && <Lightbox items={images} index={open} onIndex={setOpen} onClose={() => setOpen(null)} />}
    </div>
  );
}

function Lightbox({ items, index, onIndex, onClose }: { items: Media[]; index: number; onIndex: (i: number) => void; onClose: () => void }) {
  const go = useCallback((d: number) => onIndex((index + d + items.length) % items.length), [index, items.length, onIndex]);
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') go(1);
      if (e.key === 'ArrowLeft') go(-1);
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      prev?.focus();
    };
  }, [go, onClose]);
  const m = items[index];
  return createPortal(
    <div className="fixed inset-0 z-[60] flex animate-fade-in flex-col bg-[#000]/90" role="dialog" aria-modal="true" aria-label="Image viewer">
      <div className="flex items-center justify-between p-3 text-white/80">
        <span className="tabular text-sm">
          {index + 1} / {items.length}
        </span>
        <button onClick={onClose} className="rounded-md p-2 hover:bg-white/10" aria-label="Close image viewer" autoFocus>
          <X className="h-6 w-6" />
        </button>
      </div>
      <div className="relative flex min-h-0 flex-1 items-center justify-center px-12" onClick={onClose}>
        <img src={m.url} alt={m.altText} className="max-h-full max-w-full rounded-md object-contain" onClick={(e) => e.stopPropagation()} />
        {items.length > 1 && (
          <>
            <button onClick={(e) => { e.stopPropagation(); go(-1); }} className="absolute left-2 rounded-full p-2 text-white/80 hover:bg-white/10" aria-label="Previous image">
              <ChevronLeft className="h-7 w-7" />
            </button>
            <button onClick={(e) => { e.stopPropagation(); go(1); }} className="absolute right-2 rounded-full p-2 text-white/80 hover:bg-white/10" aria-label="Next image">
              <ChevronRight className="h-7 w-7" />
            </button>
          </>
        )}
      </div>
      <p className="min-h-[3rem] p-3 text-center text-sm text-white/80">{m.caption}</p>
    </div>,
    document.body,
  );
}
