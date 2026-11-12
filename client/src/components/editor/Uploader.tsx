import { CheckCircle2, CircleX, UploadCloud } from 'lucide-react';
import { useRef, useState } from 'react';
import type { Media } from '@/api/types';
import { Field, Input } from '@/components/ui/Field';
import { uploadFile, validateFile } from '@/lib/upload';
import { cn } from '@/lib/utils';

interface Item {
  key: string;
  name: string;
  pct: number;
  error?: string;
  done?: boolean;
}

/** Drop zone that uploads straight to S3 with a progress bar per file. */
export function Uploader({ onUploaded, accept = ['image', 'video'] }: { onUploaded: (m: Media) => void; accept?: ('image' | 'video')[] }) {
  const [items, setItems] = useState<Item[]>([]);
  const [drag, setDrag] = useState(false);
  const [altText, setAlt] = useState('');
  const [caption, setCaption] = useState('');
  const input = useRef<HTMLInputElement>(null);
  const mime = [...(accept.includes('image') ? ['image/jpeg', 'image/png', 'image/webp'] : []), ...(accept.includes('video') ? ['video/mp4'] : [])];

  const update = (key: string, patch: Partial<Item>) => setItems((xs) => xs.map((x) => (x.key === key ? { ...x, ...patch } : x)));

  const start = (files: FileList | File[]) => {
    for (const file of Array.from(files)) {
      const key = `${file.name}-${file.size}-${Math.random()}`;
      const err = validateFile(file) ?? (mime.includes(file.type) ? null : `${file.name} is not an accepted file type here`);
      setItems((xs) => [...xs, { key, name: file.name, pct: 0, error: err ?? undefined }]);
      if (err) continue;
      uploadFile(file, { altText: altText || file.name.replace(/\.[^.]+$/, ''), caption }, (pct) => update(key, { pct }))
        .then((m) => {
          update(key, { done: true, pct: 100 });
          onUploaded(m);
        })
        .catch((e: Error) => update(key, { error: e.message }));
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Alt text" hint="Describe the image for screen-reader users." htmlFor="up-alt">
          <Input id="up-alt" value={altText} onChange={(e) => setAlt(e.target.value)} placeholder="e.g. New CR form with change type selected" />
        </Field>
        <Field label="Caption (optional)" htmlFor="up-cap">
          <Input id="up-cap" value={caption} onChange={(e) => setCaption(e.target.value)} />
        </Field>
      </div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          start(e.dataTransfer.files);
        }}
        className={cn('flex flex-col items-center rounded-card border-2 border-dashed px-6 py-10 text-center transition-colors', drag ? 'border-brand bg-brand-soft' : 'border-line')}
      >
        <UploadCloud className="h-8 w-8 text-ink-subtle" aria-hidden />
        <p className="mt-3 text-sm font-medium">Drop files here or</p>
        <button type="button" onClick={() => input.current?.click()} className="mt-2 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-strong">
          Choose files
        </button>
        <p className="mt-3 text-xs text-ink-muted">
          {accept.includes('image') && 'JPG, PNG or WebP up to 10 MB'}
          {accept.length === 2 && '. '}
          {accept.includes('video') && 'MP4 up to 500 MB'}
        </p>
        <input ref={input} type="file" multiple accept={mime.join(',')} className="sr-only" onChange={(e) => e.target.files && start(e.target.files)} />
      </div>
      {items.length > 0 && (
        <ul className="space-y-2" aria-live="polite">
          {items.map((i) => (
            <li key={i.key} className="rounded-lg border border-line px-3 py-2">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="truncate">{i.name}</span>
                {i.error ? (
                  <span className="flex shrink-0 items-center gap-1 text-brand-fg">
                    <CircleX className="h-4 w-4" /> Failed
                  </span>
                ) : i.done ? (
                  <span className="flex shrink-0 items-center gap-1 text-success">
                    <CheckCircle2 className="h-4 w-4" /> Uploaded
                  </span>
                ) : (
                  <span className="tabular shrink-0 text-ink-muted">{i.pct}%</span>
                )}
              </div>
              {i.error ? (
                <p className="mt-1 text-xs text-brand-fg">{i.error}</p>
              ) : (
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-line" role="progressbar" aria-valuenow={i.pct} aria-valuemin={0} aria-valuemax={100} aria-label={`Uploading ${i.name}`}>
                  <div className={cn('h-full rounded-full transition-[width]', i.done ? 'bg-success' : 'bg-brand')} style={{ width: `${i.pct}%` }} />
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
