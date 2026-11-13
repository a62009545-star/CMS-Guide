import { Router } from 'express';
import { Types } from 'mongoose';
import { z } from 'zod';
import { modulePath, paginationSchema, reorderSchema, statusSchema, subTaskInputSchema, type SubTaskInput } from '@cms/shared';
import { isAdmin, isStaff, requireRole } from '../middleware/auth.js';
import { parseQuery, validateBody } from '../middleware/validate.js';
import { Module, SubTask, Version } from '../models/index.js';
import { record } from '../services/audit.js';
import { hydrateSubTask, mediaMap, normalizeSubTask, subTaskDocFields, subTaskToSnapshot, userNames } from '../services/content.js';
import { saveVersion } from '../services/versioning.js';
import { ah, escapeRegex, forbidden, HttpError, notFound, pageResult, paginate } from '../utils/http.js';

export const subTasksRouter = Router();

async function moduleSlug(moduleId: unknown) {
  const m = await Module.findById(moduleId).select('slug status title section').lean();
  if (!m) throw new HttpError(422, 'Parent module does not exist');
  return m;
}

const listQuery = paginationSchema.extend({
  moduleId: z.string().regex(/^[a-f\d]{24}$/i).optional(),
  status: z.enum(['draft', 'published', 'pending']).optional(),
  q: z.string().trim().max(100).optional(),
});

/** Admin list (paginated, filterable). */
subTasksRouter.get(
  '/',
  requireRole('editor'),
  ah(async (req, res) => {
    const { page, limit, moduleId, status, q } = parseQuery(listQuery, req.query);
    const filter: Record<string, unknown> = {};
    if (moduleId) filter.moduleId = new Types.ObjectId(moduleId);
    if (status === 'pending') filter.pendingDraft = { $ne: null };
    else if (status) filter.status = status;
    if (q) filter.title = { $regex: escapeRegex(q), $options: 'i' };
    const { skip } = paginate(page, limit);
    const [items, total] = await Promise.all([
      SubTask.find(filter)
        .sort(moduleId ? { order: 1 } : { updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('moduleId title slug summary order status updatedAt updatedBy pendingDraftAt steps._id')
        .lean(),
      SubTask.countDocuments(filter),
    ]);
    const [mods, names] = await Promise.all([
      Module.find({ _id: { $in: items.map((i) => i.moduleId) } }).select('title slug order section').lean(),
      userNames(items.map((i) => i.updatedBy)),
    ]);
    const mm = new Map(mods.map((m) => [String(m._id), m]));
    res.json(
      pageResult(
        items.map((i) => ({
          ...i,
          stepCount: i.steps?.length ?? 0,
          steps: undefined,
          module: mm.get(String(i.moduleId)) ?? null,
          updatedByName: names.get(String(i.updatedBy)) ?? null,
          hasPendingDraft: Boolean(i.pendingDraftAt),
        })),
        total,
        page,
        limit,
      ),
    );
  }),
);

/** Lightweight list of every sub-task, used by "related sub-tasks" pickers. */
subTasksRouter.get(
  '/options',
  requireRole('editor'),
  ah(async (_req, res) => {
    const items = await SubTask.find().select('title moduleId').sort({ moduleId: 1, order: 1 }).lean();
    const mods = await Module.find().select('title order').lean();
    const mm = new Map(mods.map((m) => [String(m._id), m]));
    res.json({
      items: items
        .map((i) => ({ _id: i._id, title: i.title, moduleTitle: mm.get(String(i.moduleId))?.title, moduleOrder: mm.get(String(i.moduleId))?.order ?? 0 }))
        .sort((a, b) => a.moduleOrder - b.moduleOrder),
    });
  }),
);

subTasksRouter.get(
  '/by-slug/:moduleSlug/:slug',
  ah(async (req, res) => {
    const staff = isStaff(req.user);
    const mod = await Module.findOne({ slug: req.params.moduleSlug }).select('_id status').lean();
    if (!mod || (!staff && mod.status !== 'published')) throw notFound('Sub-task');
    const doc = await SubTask.findOne({ moduleId: mod._id, slug: req.params.slug }).lean();
    if (!doc || (!staff && doc.status !== 'published')) throw notFound('Sub-task');
    res.json(await hydrateSubTask(doc, { preview: staff && req.query.preview === '1', staff }));
  }),
);

subTasksRouter.get(
  '/id/:id/edit',
  requireRole('editor'),
  ah(async (req, res) => {
    const doc = await SubTask.findById(req.params.id).lean();
    if (!doc) throw notFound('Sub-task');
    const snapshot = (doc.pendingDraft as ReturnType<typeof subTaskToSnapshot>) ?? subTaskToSnapshot(doc);
    const [media, names, module] = await Promise.all([
      mediaMap(snapshot.steps.flatMap((s) => s.media)),
      userNames([doc.updatedBy, doc.pendingDraftBy]),
      Module.findById(doc.moduleId).select('title slug section').lean(),
    ]);
    res.json({
      _id: doc._id,
      status: doc.status,
      order: doc.order,
      module,
      updatedAt: doc.updatedAt,
      updatedByName: names.get(String(doc.updatedBy)) ?? null,
      hasPendingDraft: Boolean(doc.pendingDraft),
      pendingDraftByName: names.get(String(doc.pendingDraftBy)) ?? null,
      pendingDraftAt: doc.pendingDraftAt,
      snapshot,
      mediaDocs: Object.fromEntries(media),
    });
  }),
);

subTasksRouter.post(
  '/reorder',
  requireRole('admin'),
  validateBody(reorderSchema.extend({ moduleId: z.string().regex(/^[a-f\d]{24}$/i) })),
  ah(async (req, res) => {
    const { ids, moduleId } = req.body as { ids: string[]; moduleId: string };
    const mod = await moduleSlug(moduleId);
    await SubTask.bulkWrite(ids.map((id, i) => ({ updateOne: { filter: { _id: id, moduleId }, update: { $set: { order: i + 1 } } } })));
    await record({ user: req.user!, action: 'reorder', entityType: 'subtask', entityTitle: `Sub-tasks in ${mod.title}`, moduleSlug: mod.slug, path: modulePath(mod.section, mod.slug), visibleToViewers: mod.status === 'published' });
    res.json({ ok: true });
  }),
);

subTasksRouter.post(
  '/',
  requireRole('editor'),
  validateBody(subTaskInputSchema),
  ah(async (req, res) => {
    const input = req.body as SubTaskInput;
    const snap = normalizeSubTask(input);
    const mod = await moduleSlug(snap.moduleId);
    const last = await SubTask.findOne({ moduleId: snap.moduleId }).sort({ order: -1 }).select('order').lean();
    const doc = await SubTask.create({ ...subTaskDocFields(snap), order: (last?.order ?? 0) + 1, status: 'draft', updatedBy: req.user!.id });
    await saveVersion({ entityType: 'subtask', entityId: doc._id, snapshot: snap, user: req.user!, changeNote: input.changeNote || 'Created' });
    await record({ user: req.user!, action: 'create', entityType: 'subtask', entityId: doc._id, entityTitle: doc.title, slug: doc.slug, moduleSlug: mod.slug, path: modulePath(mod.section, mod.slug, doc.slug) });
    res.status(201).json({ _id: doc._id, slug: doc.slug, moduleSlug: mod.slug });
  }),
);

subTasksRouter.put(
  '/:id',
  requireRole('editor'),
  validateBody(subTaskInputSchema),
  ah(async (req, res) => {
    const input = req.body as SubTaskInput;
    const doc = await SubTask.findById(req.params.id);
    if (!doc) throw notFound('Sub-task');
    const snap = normalizeSubTask(input);
    if (snap.relatedSubTaskIds.includes(String(doc._id))) throw new HttpError(422, 'A sub-task cannot be related to itself');
    const user = req.user!;
    const mod = await moduleSlug(snap.moduleId);
    const path = modulePath(mod.section, mod.slug, snap.slug);

    if (!isAdmin(user) && doc.status === 'published') {
      if (snap.slug !== doc.slug || snap.moduleId !== String(doc.moduleId)) {
        throw forbidden('Only an Admin can move or rename the address of a published sub-task');
      }
      doc.set({ pendingDraft: snap, pendingDraftBy: user.id, pendingDraftAt: new Date() });
      await doc.save();
      await saveVersion({ entityType: 'subtask', entityId: doc._id, snapshot: snap, user, changeNote: input.changeNote || 'Submitted for review' });
      await record({ user, action: 'submit', entityType: 'subtask', entityId: doc._id, entityTitle: snap.title, slug: doc.slug, moduleSlug: mod.slug, path });
      return res.json({ ok: true, pending: true });
    }

    doc.set({ ...subTaskDocFields(snap), updatedBy: user.id });
    if (isAdmin(user)) doc.set({ pendingDraft: null, pendingDraftBy: null, pendingDraftAt: null });
    await doc.save();
    await saveVersion({ entityType: 'subtask', entityId: doc._id, snapshot: snap, user, changeNote: input.changeNote });
    await record({
      user,
      action: 'update',
      entityType: 'subtask',
      entityId: doc._id,
      entityTitle: doc.title,
      slug: doc.slug,
      moduleSlug: mod.slug,
      path,
      visibleToViewers: doc.status === 'published' && mod.status === 'published',
    });
    res.json({ ok: true, pending: false, slug: doc.slug, moduleSlug: mod.slug });
  }),
);

subTasksRouter.patch(
  '/:id/status',
  requireRole('admin'),
  validateBody(statusSchema),
  ah(async (req, res) => {
    const { status } = req.body as { status: 'draft' | 'published' };
    const doc = await SubTask.findById(req.params.id);
    if (!doc) throw notFound('Sub-task');
    if (status === 'published' && doc.pendingDraft) {
      doc.set({ ...subTaskDocFields(doc.pendingDraft), updatedBy: doc.pendingDraftBy ?? req.user!.id });
    }
    doc.set({ status, pendingDraft: null, pendingDraftBy: null, pendingDraftAt: null });
    if (status === 'published') doc.publishedAt = new Date();
    await doc.save();
    const mod = await moduleSlug(doc.moduleId);
    await record({
      user: req.user!,
      action: status === 'published' ? 'publish' : 'unpublish',
      entityType: 'subtask',
      entityId: doc._id,
      entityTitle: doc.title,
      slug: doc.slug,
      moduleSlug: mod.slug,
      path: modulePath(mod.section, mod.slug, doc.slug),
      visibleToViewers: mod.status === 'published',
    });
    res.json({ ok: true, status });
  }),
);

subTasksRouter.post(
  '/:id/discard-draft',
  requireRole('editor'),
  ah(async (req, res) => {
    const doc = await SubTask.findById(req.params.id);
    if (!doc) throw notFound('Sub-task');
    if (!doc.pendingDraft) throw new HttpError(400, 'There are no pending changes to discard');
    if (!isAdmin(req.user) && String(doc.pendingDraftBy) !== req.user!.id) throw forbidden();
    doc.set({ pendingDraft: null, pendingDraftBy: null, pendingDraftAt: null });
    await doc.save();
    await record({ user: req.user!, action: 'update', entityType: 'subtask', entityId: doc._id, entityTitle: doc.title, meta: { discardedDraft: true } });
    res.json({ ok: true });
  }),
);

subTasksRouter.delete(
  '/:id',
  requireRole('admin'),
  ah(async (req, res) => {
    const doc = await SubTask.findById(req.params.id);
    if (!doc) throw notFound('Sub-task');
    const mod = await Module.findById(doc.moduleId).select('slug status').lean();
    await SubTask.updateMany({}, { $pull: { relatedSubTaskIds: doc._id } });
    await doc.deleteOne();
    await Version.deleteMany({ entityType: 'subtask', entityId: doc._id });
    await record({
      user: req.user!,
      action: 'delete',
      entityType: 'subtask',
      entityId: doc._id,
      entityTitle: doc.title,
      moduleSlug: mod?.slug,
      visibleToViewers: doc.status === 'published' && mod?.status === 'published',
    });
    res.json({ ok: true });
  }),
);
