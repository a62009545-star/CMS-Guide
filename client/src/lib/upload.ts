import { MEDIA_LIMITS } from '@cms/shared';
import { post, put } from '@/api/client';
import type { Media } from '@/api/types';

interface Presign {
  url: string;
  fields: Record<string, string>;
  key: string;
  publicUrl: string;
  kind: 'image' | 'video';
}

export function validateFile(file: File): string | null {
  for (const kind of ['image', 'video'] as const) {
    const rule = MEDIA_LIMITS[kind];
    if ((rule.mime as readonly string[]).includes(file.type)) {
      return file.size > rule.maxBytes ? `${file.name} is larger than ${rule.maxBytes / 1024 / 1024} MB` : null;
    }
  }
  return `${file.name} is not a JPG, PNG, WebP image or MP4 video`;
}

/** POST a file straight to S3 (or the local dev endpoint) using a pre-signed policy, reporting progress. */
function sendForm(p: Presign, file: File, onProgress: (pct: number) => void, signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    const form = new FormData();
    for (const [k, v] of Object.entries(p.fields)) form.append(k, v);
    form.append('file', file); // must be last for S3
    const xhr = new XMLHttpRequest();
    xhr.open('POST', p.url);
    if (p.url.startsWith('/')) {
      xhr.withCredentials = true;
      xhr.setRequestHeader('X-Requested-With', 'cms-guide');
    }
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(Math.round((e.loaded / e.total) * 100));
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`Upload failed (${xhr.status})`)));
    xhr.onerror = () => reject(new Error('Upload failed. Check your connection and try again.'));
    xhr.onabort = () => reject(new Error('Upload cancelled'));
    signal?.addEventListener('abort', () => xhr.abort());
    xhr.send(form);
  });
}

export async function uploadFile(
  file: File,
  meta: { caption?: string; altText?: string },
  onProgress: (pct: number) => void,
  signal?: AbortSignal,
): Promise<Media> {
  const err = validateFile(file);
  if (err) throw new Error(err);
  const p = await post<Presign>('/media/presign', { fileName: file.name, contentType: file.type, size: file.size });
  await sendForm(p, file, onProgress, signal);
  return post<Media>('/media', { type: p.kind, url: '', s3Key: p.key, caption: meta.caption ?? '', altText: meta.altText ?? '', mimeType: file.type, size: file.size });
}

/** Replace the file behind an existing media item; every page that uses it picks up the new file. */
export async function replaceFile(media: Media, file: File, onProgress: (pct: number) => void) {
  const err = validateFile(file);
  if (err) throw new Error(err);
  const p = await post<Presign>('/media/presign', { fileName: file.name, contentType: file.type, size: file.size });
  if (p.kind !== media.type) throw new Error(`Replace an ${media.type} with another ${media.type}`);
  await sendForm(p, file, onProgress);
  return put<Media>(`/media/${media._id}`, { s3Key: p.key, mimeType: file.type, size: file.size });
}
