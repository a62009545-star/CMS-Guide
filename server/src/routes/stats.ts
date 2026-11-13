import { Router } from 'express';
import { modulePath } from '@cms/shared';
import { requireRole } from '../middleware/auth.js';
import { AuditLog, Media, Module, SubTask, User } from '../models/index.js';
import { ah } from '../utils/http.js';

export const statsRouter = Router();

statsRouter.get(
  '/dashboard',
  requireRole('editor'),
  ah(async (_req, res) => {
    const [modules, subTasks, media, users, recent, draftMods, draftSubs] = await Promise.all([
      Module.aggregate([{ $group: { _id: '$status', n: { $sum: 1 } } }]),
      SubTask.aggregate([{ $group: { _id: '$status', n: { $sum: 1 } }, }]),
      Media.aggregate([{ $group: { _id: '$type', n: { $sum: 1 } } }]),
      User.aggregate([{ $group: { _id: '$role', n: { $sum: 1 } } }]),
      AuditLog.find({ entityType: { $in: ['module', 'subtask', 'media'] } }).sort({ timestamp: -1 }).limit(12).lean(),
      Module.find({ $or: [{ status: 'draft' }, { pendingDraft: { $ne: null } }] }).select('title slug section status pendingDraftAt updatedAt').lean(),
      SubTask.find({ $or: [{ status: 'draft' }, { pendingDraft: { $ne: null } }] }).select('title slug moduleId status pendingDraftAt updatedAt').lean(),
    ]);
    const parent = await Module.find({ _id: { $in: draftSubs.map((s) => s.moduleId) } }).select('title slug section').lean();
    const pm = new Map(parent.map((p) => [String(p._id), p]));
    const toMap = (rows: { _id: string; n: number }[]) => Object.fromEntries(rows.map((r) => [r._id, r.n]));
    res.json({
      counts: { modules: toMap(modules), subTasks: toMap(subTasks), media: toMap(media), users: toMap(users) },
      recent,
      pending: [
        ...draftMods.map((m) => ({ type: 'module', _id: m._id, title: m.title, status: m.status, pendingReview: Boolean(m.pendingDraftAt), updatedAt: m.pendingDraftAt ?? m.updatedAt, path: modulePath(m.section, m.slug) })),
        ...draftSubs.map((s) => {
          const p = pm.get(String(s.moduleId));
          return { type: 'subtask', _id: s._id, title: s.title, moduleTitle: p?.title, status: s.status, pendingReview: Boolean(s.pendingDraftAt), updatedAt: s.pendingDraftAt ?? s.updatedAt, path: modulePath(p?.section, p?.slug ?? '', s.slug) };
        }),
      ].sort((a, b) => +new Date(b.updatedAt as Date) - +new Date(a.updatedAt as Date)),
    });
  }),
);
