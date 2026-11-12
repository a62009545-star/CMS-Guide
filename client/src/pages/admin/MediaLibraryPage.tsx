import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { del, errorMessage, get, put } from '@/api/client';
import type { Media } from '@/api/types';
import { MediaView } from '@/components/content/Media';
import { EmbedForm, MediaThumb, useMediaLibrary } from '@/components/editor/MediaPicker';
import { Uploader } from '@/components/editor/Uploader';
import { Button } from '@/components/ui/Button';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { Field, Input, Select } from '@/components/ui/Field';
import { Modal } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Skeleton';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useAuth } from '@/lib/auth';
import { replaceFile } from '@/lib/upload';
import { formatBytes, formatDate } from '@/lib/utils';

function MediaDetail({ media, onClose }: { media: Media; onClose: () => void }) {
  const qc = useQueryClient();
  const { isAdmin } = useAuth();
  const confirm = useConfirm();
  const [caption, setCaption] = useState(media.caption);
  const [altText, setAlt] = useState(media.altText);
  const [current, setCurrent] = useState(media);
  const [pct, setPct] = useState<number | null>(null);
  const file = useRef<HTMLInputElement>(null);
  const usage = useQuery({
    queryKey: ['admin', 'media-usage', media._id],
    queryFn: () => get<{ modules: { _id: string; title: string; slug: string }[]; subTasks: { _id: string; title: string }[] }>(`/media/${media._id}/usage`),
  });
  const refresh = () => qc.invalidateQueries({ queryKey: ['admin', 'media'] });
  const save = useMutation({
    mutationFn: () => put<Media>(`/media/${media._id}`, { caption, altText }),
    onSuccess: (m) => {
      setCurrent(m);
      toast.success('Media details saved');
      refresh();
    },
    onError: (e) => toast.error(errorMessage(e)),
  });
  const remove = useMutation({
    mutationFn: () => del(`/media/${media._id}`),
    onSuccess: () => {
      toast.success('Media deleted');
      refresh();
      qc.invalidateQueries({ queryKey: ['module'] });
      qc.invalidateQueries({ queryKey: ['subtask'] });
      onClose();
    },
    onError: (e) => toast.error(errorMessage(e)),
  });
  const used = (usage.data?.modules.length ?? 0) + (usage.data?.subTasks.length ?? 0);

  return (
    <Modal
      open
      onClose={onClose}
      title="Media details"
      size="lg"
      footer={
        <>
          {isAdmin && (
            <Button
              variant="danger"
              className="mr-auto"
              loading={remove.isPending}
              onClick={async () => {
                const ok = await confirm({
                  title: 'Delete this media item?',
                  body: used ? `It is used on ${used} page${used > 1 ? 's' : ''} and will be removed from them.` : 'It is not used on any page.',
                  confirmLabel: 'Delete media',
                  danger: true,
                });
                if (ok) remove.mutate();
              }}
            >
              Delete
            </Button>
          )}
          <Button onClick={onClose}>Close</Button>
          <Button variant="primary" loading={save.isPending} onClick={() => save.mutate()} disabled={caption === current.caption && altText === current.altText}>
            Save details
          </Button>
        </>
      }
    >
      <div className="grid gap-6 md:grid-cols-[1fr_260px]">
        <div>
          <MediaView media={current} />
          {current.type !== 'embed' && (
            <div className="mt-3">
              <Button size="sm" onClick={() => file.current?.click()} loading={pct !== null}>
                Replace file
              </Button>
              <input
                ref={file}
                type="file"
                className="sr-only"
                accept={current.type === 'image' ? 'image/jpeg,image/png,image/webp' : 'video/mp4'}
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  setPct(0);
                  try {
                    const m = await replaceFile(current, f, setPct);
                    setCurrent(m);
                    toast.success('File replaced on every page that uses it');
                    refresh();
                    qc.invalidateQueries({ queryKey: ['module'] });
                    qc.invalidateQueries({ queryKey: ['subtask'] });
                  } catch (err) {
                    toast.error(errorMessage(err));
                  } finally {
                    setPct(null);
                    e.target.value = '';
                  }
                }}
              />
              {pct !== null && (
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-line" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
                  <div className="h-full bg-brand transition-[width]" style={{ width: `${pct}%` }} />
                </div>
              )}
            </div>
          )}
        </div>
        <div className="space-y-4">
          <Field label="Alt text" htmlFor="md-alt" hint="Required for images. Describe what the image shows.">
            <Input id="md-alt" value={altText} onChange={(e) => setAlt(e.target.value)} />
          </Field>
          <Field label="Caption" htmlFor="md-cap">
            <Input id="md-cap" value={caption} onChange={(e) => setCaption(e.target.value)} />
          </Field>
          <dl className="space-y-1 text-sm">
            <div className="flex justify-between gap-2">
              <dt className="text-ink-muted">Type</dt>
              <dd>{current.type === 'embed' ? 'Video link' : current.mimeType}</dd>
            </div>
            {current.size ? (
              <div className="flex justify-between gap-2">
                <dt className="text-ink-muted">Size</dt>
                <dd>{formatBytes(current.size)}</dd>
              </div>
            ) : null}
            <div className="flex justify-between gap-2">
              <dt className="text-ink-muted">Added</dt>
              <dd>{formatDate(current.createdAt)}</dd>
            </div>
          </dl>
          <div>
            <p className="text-sm font-medium">Used on</p>
            {usage.isLoading ? (
              <Skeleton className="mt-2 h-10" />
            ) : used === 0 ? (
              <p className="mt-1 text-sm text-ink-muted">Not used on any page.</p>
            ) : (
              <ul className="mt-1 space-y-1 text-sm">
                {usage.data?.modules.map((m) => (
                  <li key={m._id}>
                    <Link to={`/admin/modules/${m._id}`} className="text-brand-fg hover:underline">{m.title}</Link> (hero)
                  </li>
                ))}
                {usage.data?.subTasks.map((s) => (
                  <li key={s._id}>
                    <Link to={`/admin/subtasks/${s._id}`} className="text-brand-fg hover:underline">{s.title}</Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}

export function MediaLibraryPage() {
  useDocumentTitle('Media library');
  const [type, setType] = useState('');
  const [q, setQ] = useState('');
  const [debounced, setDebounced] = useState('');
  const [adding, setAdding] = useState<'upload' | 'embed' | null>(null);
  const [selected, setSelected] = useState<Media | null>(null);
  const qc = useQueryClient();
  useEffect(() => {
    const t = setTimeout(() => setDebounced(q), 250);
    return () => clearTimeout(t);
  }, [q]);
  const lib = useMediaLibrary(type, debounced);
  const items = lib.data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Media library</h1>
          <p className="mt-1 text-sm text-ink-muted">Images up to 10 MB and MP4 videos up to 500 MB, stored on S3.</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setAdding('embed')}>Add video link</Button>
          <Button variant="primary" onClick={() => setAdding('upload')}>
            <Plus className="h-4 w-4" /> Upload
          </Button>
        </div>
      </div>
      <div className="mb-4 grid gap-2 sm:grid-cols-[1fr_200px]">
        <Input placeholder="Search captions and alt text" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search media" />
        <Select value={type} onChange={(e) => setType(e.target.value)} aria-label="Media type">
          <option value="">All types</option>
          <option value="image">Images</option>
          <option value="video">Videos</option>
          <option value="embed">Video links</option>
        </Select>
      </div>
      {lib.isLoading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
          {Array.from({ length: 10 }, (_, i) => (
            <Skeleton key={i} className="aspect-square" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState title="No media found" action={<Button variant="primary" onClick={() => setAdding('upload')}>Upload files</Button>}>
          Upload screenshots and videos to use them in walkthrough steps.
        </EmptyState>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
          {items.map((m) => (
            <li key={m._id}>
              <button onClick={() => setSelected(m)} className="card block w-full overflow-hidden text-left hover:border-ink-subtle">
                <div className="aspect-square">
                  <MediaThumb m={m} />
                </div>
                <div className="px-3 py-2">
                  <p className="truncate text-sm font-medium">{m.caption || m.altText || 'Untitled'}</p>
                  <p className="text-xs text-ink-muted">{m.type === 'embed' ? 'Video link' : m.type === 'video' ? `Video ${formatBytes(m.size)}` : `Image ${formatBytes(m.size)}`}</p>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
      {lib.hasNextPage && (
        <div className="mt-6 text-center">
          <Button onClick={() => lib.fetchNextPage()} loading={lib.isFetchingNextPage}>
            Load more
          </Button>
        </div>
      )}
      <Modal open={adding === 'upload'} onClose={() => setAdding(null)} title="Upload media" size="lg">
        <Uploader onUploaded={() => qc.invalidateQueries({ queryKey: ['admin', 'media'] })} />
      </Modal>
      <Modal open={adding === 'embed'} onClose={() => setAdding(null)} title="Add video link">
        <EmbedForm
          onCreated={() => {
            qc.invalidateQueries({ queryKey: ['admin', 'media'] });
            setAdding(null);
          }}
        />
      </Modal>
      {selected && <MediaDetail media={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
