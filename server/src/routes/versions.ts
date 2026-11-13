import { Router } from 'express';
import { Types } from 'mongoose';
import { modulePath } from '@cms/shared';
import { requireRole } from '../middleware/auth.js';
import { Module, SubTask, Version } from '../models/index.js';
import { record } from '../services/audit.js';
import { moduleDocFields, subTaskDocFields, type ModuleSnapshot, type SubTaskSnapshot } from '../services/content.js';
import { saveVersion } from '../services/versioning.js';
import { ah, HttpError, notFound } from '../utils/http.js';

export const versionsRouter = Router();

/** Recent versions across all content (Version history page). */
versionsRouter.get(
  '/',
  requireRole('editor'),
  ah(async (req, res) => {
    const limit = Math.min(100, Number(req.query.limit) || 50);
    const items = await Version.find().sort({ changedAt: -1 }).limit(limit).select('-snapshot').lean();
    const [mods, subs] = await Promise.all([
      Module.find({ _id: { $in: items.filter((i) => i.entityType === 'module').map((i) => i.entityId) } }).select('title').lean(),
      SubTask.find({ _id: { $in: items.filter((i) => i.entityType === 'subtask').map((i) => i.entityId) } }).select('title').lean(),
    ]);
    const titles = new Map([...mods, ...subs].map((d) => [String(d._id), d.title]));
    res.json({ items: items.map((i) => ({ ...i, entityTitle: titles.get(String(i.entityId)) ?? '(deleted)' })) });
  }),
);

versionsRouter.get(
  '/:entityType/:entityId',
  requireRole('editor'),
  ah(async (req, res) => {
    const { entityType, entityId } = req.params;
    if (!['module', 'subtask'].includes(entityType) || !Types.ObjectId.isValid(entityId)) throw new HttpError(400, 'Invalid entity');
    const items = await Version.find({ entityType, entityId }).sort({ versionNumber: -1 }).limit(200).lean();
    res.json({ items });
  }),
);

versionsRouter.post(
  '/:id/restore',
  requireRole('admin'),
  ah(async (req, res) => {
    const v = await Version.findById(req.params.id).lean();
    if (!v) throw notFound('Version');
    const user = req.user!;
    const note = `Restored version ${v.versionNumber}`;

    if (v.entityType === 'module') {
      const doc = await Module.findById(v.entityId);
      if (!doc) throw notFound('Module');
      const snap = v.snapshot as ModuleSnapshot;
      doc.set({ ...moduleDocFields(snap), updatedBy: user.id, pendingDraft: null, pendingDraftBy: null, pendingDraftAt: null });
      await doc.save();
      await saveVersion({ entityType: 'module', entityId: doc._id, snapshot: snap, user, changeNote: note });
      await record({ user, action: 'restore', entityType: 'module', entityId: doc._id, entityTitle: doc.title, slug: doc.slug, path: modulePath(doc.section, doc.slug), visibleToViewers: doc.status === 'published', meta: { versionNumber: v.versionNumber } });
    } else if (v.entityType === 'subtask') {
      const doc = await SubTask.findById(v.entityId);
      if (!doc) throw notFound('Sub-task');
      const snap = v.snapshot as SubTaskSnapshot;
      if (!(await Module.exists({ _id: snap.moduleId }))) throw new HttpError(409, 'The parent module of this version no longer exists');
      doc.set({ ...subTaskDocFields(snap), updatedBy: user.id, pendingDraft: null, pendingDraftBy: null, pendingDraftAt: null });
      await doc.save();
      const mod = await Module.findById(doc.moduleId).select('slug status section').lean();
      await saveVersion({ entityType: 'subtask', entityId: doc._id, snapshot: snap, user, changeNote: note });
      await record({ user, action: 'restore', entityType: 'subtask', entityId: doc._id, entityTitle: doc.title, slug: doc.slug, moduleSlug: mod?.slug, path: modulePath(mod?.section, mod?.slug ?? '', doc.slug), visibleToViewers: doc.status === 'published' && mod?.status === 'published', meta: { versionNumber: v.versionNumber } });
    } else {
      throw new HttpError(400, 'This version cannot be restored');
    }
    res.json({ ok: true });
  }),
);
