import fs from 'node:fs';
import path from 'node:path';
import { Router } from 'express';
import multer from 'multer';
import { z } from 'zod';
import {
  MEDIA_LIMITS,
  mediaCreateSchema,
  mediaPresignSchema,
  mediaUpdateSchema,
  paginationSchema,
  toEmbedUrl,
} from '@cms/shared';
import { env } from '../config/env.js';
import { requireRole } from '../middleware/auth.js';
import { parseQuery, validateBody } from '../middleware/validate.js';
import { Media, Module, SubTask } from '../models/index.js';
import { record } from '../services/audit.js';
import { deleteObject, localPath, presignUpload, publicUrl, verifyLocalUploadToken } from '../services/storage.js';
import { ah, escapeRegex, HttpError, notFound, pageResult, paginate } from '../utils/http.js';

export const mediaRouter = Router();

const listQuery = paginationSchema.extend({
  type: z.enum(['image', 'video', 'embed']).optional(),
  q: z.string().trim().max(100).optional(),
});

mediaRouter.get(
  '/',
  requireRole('editor'),
  ah(async (req, res) => {
    const { page, limit, type, q } = parseQuery(listQuery, req.query);
    const filter: Record<string, unknown> = {};
    if (type) filter.type = type;
    if (q) {
      const rx = { $regex: escapeRegex(q), $options: 'i' };
      filter.$or = [{ caption: rx }, { altText: rx }, { s3Key: rx }];
    }
    const { skip } = paginate(page, limit);
    const [items, total] = await Promise.all([
      Media.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Media.countDocuments(filter),
    ]);
    res.json(pageResult(items, total, page, limit));
  }),
);

/** Step 1 of an upload: get a pre-signed S3 POST (or a local-disk equivalent in development). */
mediaRouter.post(
  '/presign',
  requireRole('editor'),
  validateBody(mediaPresignSchema),
  ah(async (req, res) => {
    const { fileName, contentType, size } = req.body as z.infer<typeof mediaPresignSchema>;
    res.json(await presignUpload(fileName, contentType, size));
  }),
);

/* Local-disk upload target used only when S3 is not configured. Mirrors S3's POST policy. */
if (!env.useS3) {
  const upload = multer({
    storage: multer.diskStorage({
      destination: (req, _file, cb) => {
        try {
          const claims = verifyLocalUploadToken(String(req.body?.token ?? ''));
          (req as unknown as { uploadClaims: typeof claims }).uploadClaims = claims;
          const full = localPath(claims.key);
          fs.mkdirSync(path.dirname(full), { recursive: true });
          cb(null, path.dirname(full));
        } catch (e) {
          cb(e as Error, '');
        }
      },
      filename: (req, _file, cb) => {
        const claims = (req as unknown as { uploadClaims: { key: string } }).uploadClaims;
        cb(null, path.basename(claims.key));
      },
    }),
    limits: { fileSize: MEDIA_LIMITS.video.maxBytes, files: 1 },
    fileFilter: (req, file, cb) => {
      const claims = (req as unknown as { uploadClaims?: { contentType: string } }).uploadClaims;
      cb(null, !claims || file.mimetype === claims.contentType);
    },
  });

  mediaRouter.post(
    '/local-upload',
    requireRole('editor'),
    upload.single('file'),
    ah(async (req, res) => {
      const claims = (req as unknown as { uploadClaims?: { key: string; max: number } }).uploadClaims;
      if (!req.file || !claims) throw new HttpError(400, 'No file received');
      if (req.file.size > claims.max) {
        fs.rmSync(req.file.path, { force: true });
        throw new HttpError(413, 'File is larger than the allowed size');
      }
      res.status(204).end();
    }),
  );
}

/** Step 2 of an upload (or the only step for an embed): register the media item. */
mediaRouter.post(
  '/',
  requireRole('editor'),
  validateBody(mediaCreateSchema),
  ah(async (req, res) => {
    const input = req.body as z.infer<typeof mediaCreateSchema>;
    let url: string;
    if (input.type === 'embed') {
      const embed = toEmbedUrl(input.url);
      if (!embed) throw new HttpError(422, 'Paste a YouTube, Vimeo or SharePoint video link');
      url = embed;
    } else {
      if (!input.s3Key || !/^media\/[\w./-]+$/.test(input.s3Key) || input.s3Key.includes('..')) {
        throw new HttpError(422, 'Upload the file before saving it to the library');
      }
      url = publicUrl(input.s3Key);
    }
    const doc = await Media.create({ ...input, url, s3Key: input.type === 'embed' ? null : input.s3Key, uploadedBy: req.user!.id });
    await record({ user: req.user!, action: 'create', entityType: 'media', entityId: doc._id, entityTitle: doc.caption || doc.altText || 'Media item', notify: false });
    res.status(201).json(doc);
  }),
);

mediaRouter.get(
  '/:id/usage',
  requireRole('editor'),
  ah(async (req, res) => {
    const id = req.params.id;
    const [mods, subs] = await Promise.all([
      Module.find({ heroMedia: id }).select('title slug').lean(),
      SubTask.find({ 'steps.media': id }).select('title slug moduleId').lean(),
    ]);
    res.json({ modules: mods, subTasks: subs });
  }),
);

/** Update metadata, or replace the underlying file (new s3Key) while keeping every reference. */
mediaRouter.put(
  '/:id',
  requireRole('editor'),
  validateBody(mediaUpdateSchema),
  ah(async (req, res) => {
    const input = req.body as z.infer<typeof mediaUpdateSchema>;
    const doc = await Media.findById(req.params.id);
    if (!doc) throw notFound('Media');
    if (input.caption !== undefined) doc.caption = input.caption;
    if (input.altText !== undefined) doc.altText = input.altText;
    let oldKey: string | null = null;
    if (input.s3Key && input.s3Key !== doc.s3Key) {
      if (doc.type === 'embed' || !/^media\/[\w./-]+$/.test(input.s3Key) || input.s3Key.includes('..')) {
        throw new HttpError(422, 'Invalid replacement file');
      }
      oldKey = doc.s3Key ?? null;
      doc.s3Key = input.s3Key;
      doc.url = publicUrl(input.s3Key);
      if (input.mimeType) doc.mimeType = input.mimeType;
      if (input.size) doc.size = input.size;
    } else if (input.url && doc.type === 'embed') {
      const embed = toEmbedUrl(input.url);
      if (!embed) throw new HttpError(422, 'Paste a YouTube, Vimeo or SharePoint video link');
      doc.url = embed;
    }
    await doc.save();
    if (oldKey) await deleteObject(oldKey);
    await record({ user: req.user!, action: 'update', entityType: 'media', entityId: doc._id, entityTitle: doc.caption || 'Media item', notify: false });
    res.json(doc);
  }),
);

mediaRouter.delete(
  '/:id',
  requireRole('admin'),
  ah(async (req, res) => {
    const doc = await Media.findById(req.params.id);
    if (!doc) throw notFound('Media');
    await Promise.all([
      Module.updateMany({ heroMedia: doc._id }, { $set: { heroMedia: null } }),
      SubTask.updateMany({ 'steps.media': doc._id }, { $pull: { 'steps.$[].media': doc._id } }),
    ]);
    await doc.deleteOne();
    await deleteObject(doc.s3Key);
    await record({ user: req.user!, action: 'delete', entityType: 'media', entityId: doc._id, entityTitle: doc.caption || 'Media item', notify: false });
    res.json({ ok: true });
  }),
);
