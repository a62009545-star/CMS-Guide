import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, Film, Link as LinkIcon, Play } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { errorMessage, get, post } from '@/api/client';
import type { Media, Page } from '@/api/types';
import { Button } from '@/components/ui/Button';
import { Field, Input } from '@/components/ui/Field';
import { Modal } from '@/components/ui/Modal';
import { cn } from '@/lib/utils';
import { Uploader } from './Uploader';

type Kind = 'image' | 'video' | 'embed';

export function MediaThumb({ m, className }: { m: Media; className?: string }) {
  if (m.type === 'image') return <img src={m.url} alt={m.altText} loading="lazy" className={cn('h-full w-full object-cover', className)} />;
  return (
    <div className={cn('grid h-full w-full place-items-center bg-ink text-canvas', className)}>
      {m.type === 'video' ? <Film className="h-6 w-6 opacity-80" /> : <Play className="h-6 w-6 opacity-80" />}
    </div>
  );
}

export const useMediaLibrary = (type: string, q: string, enabled = true) =>
  useInfiniteQuery({
    queryKey: ['admin', 'media', type, q],
    queryFn: ({ pageParam }) => get<Page<Media>>('/media', { page: pageParam, limit: 24, type: type || undefined, q: q || undefined }),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.page < last.pages ? last.page + 1 : undefined),
    enabled,
  });

export function EmbedForm({ onCreated }: { onCreated: (m: Media) => void }) {
  const [url, setUrl] = useState('');
  const [caption, setCaption] = useState('');
  const m = useMutation({
    mutationFn: () => post<Media>('/media', { type: 'embed', url, caption, altText: caption }),
    onSuccess: (media) => {
      toast.success('Video link added');
      setUrl('');
      setCaption('');
      onCreated(media);
    },
    onError: (e) => toast.error(errorMessage(e)),
  });
  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        m.mutate();
      }}
    >
      <Field label="Video link" hint="YouTube, Vimeo or SharePoint/Stream link." htmlFor="embed-url">
        <Input id="embed-url" type="url" required value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://www.youtube.com/watch?v=…" />
      </Field>
      <Field label="Caption" htmlFor="embed-cap">
        <Input id="embed-cap" value={caption} onChange={(e) => setCaption(e.target.value)} />
      </Field>
      <Button type="submit" variant="primary" loading={m.isPending} disabled={!url}>
        <LinkIcon className="h-4 w-4" /> Add video link
      </Button>
    </form>
  );
}

/** Pick media from the library, upload new files, or add an external video link. */
export function MediaPicker({
  open,
  onClose,
  onPick,
  accept = ['image', 'video', 'embed'],
  multiple = true,
}: {
  open: boolean;
  onClose: () => void;
  onPick: (items: Media[]) => void;
  accept?: Kind[];
  multiple?: boolean;
}) {
  const [tab, setTab] = useState<'library' | 'upload' | 'embed'>('library');
  const [type, setType] = useState<string>(accept.length === 1 ? accept[0] : '');
  const [q, setQ] = useState('');
  const [sel, setSel] = useState<Media[]>([]);
  const qc = useQueryClient();
  const lib = useMediaLibrary(type, q, open);
  const items = (lib.data?.pages.flatMap((p) => p.items) ?? []).filter((m) => accept.includes(m.type));

  const toggle = (m: Media) =>
    setSel((s) => (s.some((x) => x._id === m._id) ? s.filter((x) => x._id !== m._id) : multiple ? [...s, m] : [m]));
  const added = (m: Media) => {
    qc.invalidateQueries({ queryKey: ['admin', 'media'] });
    setSel((s) => (multiple ? [...s, m] : [m]));
    setTab('library');
  };
  const close = () => {
    setSel([]);
    onClose();
  };

  type Tab = 'library' | 'upload' | 'embed';
  const tabs: { id: Tab; label: string }[] = [
    { id: 'library', label: 'Library' },
    ...(accept.some((a) => a !== 'embed') ? [{ id: 'upload' as const, label: 'Upload' }] : []),
    ...(accept.includes('embed') ? [{ id: 'embed' as const, label: 'Video link' }] : []),
  ];

  return (
    <Modal
      open={open}
      onClose={close}
      title="Add media"
      size="xl"
      footer={
        <>
          <span className="mr-auto self-center text-sm text-ink-muted">{sel.length ? `${sel.length} selected` : ''}</span>
          <Button onClick={close}>Cancel</Button>
          <Button
            variant="primary"
            disabled={!sel.length}
            onClick={() => {
              onPick(sel);
              setSel([]);
            }}
          >
            Insert {sel.length > 1 ? `${sel.length} items` : ''}
          </Button>
        </>
      }
    >
      <div className="mb-4 flex gap-1 border-b border-line" role="tablist">
        {tabs.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={cn('-mb-px border-b-2 px-3 py-2 text-sm font-medium', tab === t.id ? 'border-brand text-ink' : 'border-transparent text-ink-muted hover:text-ink')}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tab === 'library' && (
        <div>
          <div className="mb-4 flex flex-col gap-2 sm:flex-row">
            <Input placeholder="Search captions and alt text" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search media" />
            {accept.length > 1 && (
              <select className="input sm:w-44" value={type} onChange={(e) => setType(e.target.value)} aria-label="Media type">
                <option value="">All types</option>
                {accept.map((a) => (
                  <option key={a} value={a}>
                    {a === 'embed' ? 'Video links' : a === 'image' ? 'Images' : 'Videos'}
                  </option>
                ))}
              </select>
            )}
          </div>
          {lib.isLoading ? (
            <p className="py-10 text-center text-sm text-ink-muted">Loading…</p>
          ) : items.length === 0 ? (
            <p className="py-10 text-center text-sm text-ink-muted">Nothing here yet. Upload a file or add a video link.</p>
          ) : (
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
              {items.map((m) => {
                const on = sel.some((x) => x._id === m._id);
                return (
                  <li key={m._id}>
                    <button
                      onClick={() => toggle(m)}
                      aria-pressed={on}
                      className={cn('relative block aspect-square w-full overflow-hidden rounded-lg border-2', on ? 'border-brand' : 'border-transparent hover:border-line')}
                    >
                      <MediaThumb m={m} />
                      {on && (
                        <span className="absolute right-1.5 top-1.5 grid h-6 w-6 place-items-center rounded-full bg-brand text-white">
                          <Check className="h-4 w-4" />
                        </span>
                      )}
                    </button>
                    <p className="mt-1 truncate text-xs text-ink-muted">{m.caption || m.altText || m.type}</p>
                  </li>
                );
              })}
            </ul>
          )}
          {lib.hasNextPage && (
            <div className="mt-4 text-center">
              <Button size="sm" onClick={() => lib.fetchNextPage()} loading={lib.isFetchingNextPage}>
                Load more
              </Button>
            </div>
          )}
        </div>
      )}
      {tab === 'upload' && <Uploader onUploaded={added} accept={accept.filter((a) => a !== 'embed') as ('image' | 'video')[]} />}
      {tab === 'embed' && <EmbedForm onCreated={added} />}
    </Modal>
  );
}
