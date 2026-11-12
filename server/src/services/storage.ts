import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { DeleteObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { createPresignedPost } from '@aws-sdk/s3-presigned-post';
import jwt from 'jsonwebtoken';
import { MEDIA_LIMITS } from '@cms/shared';
import { env } from '../config/env.js';
import { HttpError } from '../utils/http.js';

const s3 = env.useS3
  ? new S3Client({
      region: env.AWS_REGION,
      endpoint: env.S3_ENDPOINT || undefined,
      forcePathStyle: Boolean(env.S3_ENDPOINT),
    })
  : null;

export type UploadKind = 'image' | 'video';

export function classify(contentType: string, size: number): UploadKind {
  for (const kind of ['image', 'video'] as const) {
    const rule = MEDIA_LIMITS[kind];
    if ((rule.mime as readonly string[]).includes(contentType)) {
      if (size > rule.maxBytes) {
        throw new HttpError(413, `${kind === 'image' ? 'Images' : 'Videos'} must be ${rule.maxBytes / 1024 / 1024} MB or smaller`);
      }
      return kind;
    }
  }
  throw new HttpError(415, 'Upload a JPG, PNG or WebP image, or an MP4 video');
}

function extFor(contentType: string) {
  return { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'video/mp4': 'mp4' }[contentType] ?? 'bin';
}

export function publicUrl(key: string) {
  if (!env.useS3) return `/uploads/${key}`; // served by the API behind auth
  if (env.CLOUDFRONT_URL) return `${env.CLOUDFRONT_URL.replace(/\/$/, '')}/${key}`;
  if (env.S3_ENDPOINT) return `${env.S3_ENDPOINT.replace(/\/$/, '')}/${env.AWS_S3_BUCKET}/${key}`;
  return `https://${env.AWS_S3_BUCKET}.s3.${env.AWS_REGION}.amazonaws.com/${key}`;
}

export interface PresignResult {
  /** Where the browser POSTs the multipart form. */
  url: string;
  fields: Record<string, string>;
  key: string;
  publicUrl: string;
  kind: UploadKind;
}

/**
 * Create a pre-signed POST so the browser uploads straight to S3. A POST policy (unlike a
 * pre-signed PUT) lets S3 itself enforce the content type and the size limit.
 */
export async function presignUpload(fileName: string, contentType: string, size: number): Promise<PresignResult> {
  const kind = classify(contentType, size);
  const date = new Date().toISOString().slice(0, 7);
  const safe = fileName.toLowerCase().replace(/\.[^.]+$/, '').replace(/[^a-z0-9]+/g, '-').slice(0, 50) || 'file';
  const key = `media/${date}/${crypto.randomUUID()}-${safe}.${extFor(contentType)}`;
  const max = MEDIA_LIMITS[kind].maxBytes;

  if (s3) {
    const { url, fields } = await createPresignedPost(s3, {
      Bucket: env.AWS_S3_BUCKET,
      Key: key,
      Conditions: [['content-length-range', 1, max], ['eq', '$Content-Type', contentType]],
      Fields: { 'Content-Type': contentType },
      Expires: 900,
    });
    return { url, fields, key, publicUrl: publicUrl(key), kind };
  }

  // Local-disk fallback for development: a short-lived signed token authorises one upload.
  const token = jwt.sign({ key, contentType, max }, env.JWT_SECRET, { expiresIn: '15m' });
  return { url: '/api/media/local-upload', fields: { token }, key, publicUrl: publicUrl(key), kind };
}

export function verifyLocalUploadToken(token: string) {
  try {
    return jwt.verify(token, env.JWT_SECRET) as { key: string; contentType: string; max: number };
  } catch {
    throw new HttpError(403, 'Upload link expired. Start the upload again.');
  }
}

export function localPath(key: string) {
  const root = path.resolve(env.LOCAL_UPLOAD_DIR);
  const full = path.resolve(root, key);
  if (!full.startsWith(root + path.sep)) throw new HttpError(400, 'Invalid key');
  return full;
}

export async function deleteObject(key: string | null | undefined) {
  if (!key) return;
  try {
    if (s3) await s3.send(new DeleteObjectCommand({ Bucket: env.AWS_S3_BUCKET, Key: key }));
    else await fs.rm(localPath(key), { force: true });
  } catch (err) {
    console.warn('Failed to delete stored object', key, err);
  }
}
