import { Router } from 'express';
import { moduleInputSchema, reorderSchema, statusSchema, type ModuleInput } from '@cms/shared';
import { isAdmin, isStaff, requireRole } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { Module, SubTask, Version } from '../models/index.js';
import { record } from '../services/audit.js';
import {
  hydrateModule,
  mediaMap,
  moduleDocFields,
  moduleToSnapshot,
  normalizeModule,
  userNames,
} from '../services/content.js';
import { saveVersion } from '../services/versioning.js';
import { ah, forbidden, HttpError, notFound } from '../utils/http.js';

export const modulesRouter = Router();

const pathFor = (slug: string) => `/modules/${slug}`;

/** List modules in lifecycle order. Viewers get published modules only. */
modulesRouter.get(
  '/',
  ah(async (req, res) => {
    const staff = isStaff(req.user);
    const filter = staff ? {} : { status: 'published' };
    const mods = await Module.find(filter)
      .sort({ order: 1 })
      .select('title slug icon summary order status updatedAt updatedBy pendingDraftAt flowSteps.title')
      .lean();
    const counts = await SubTask.aggregate<{ _id: unknown; n: number }>([
      { $match: staff ? {} : { status: 'published' } },
      { $group: { _id: '$moduleId', n: { $sum: 1 } } },
    ]);
    const countMap = new Map(counts.map((c) => [String(c._id), c.n]));
    const names = await userNames(mods.map((m) => m.updatedBy));
    res.json({
      items: mods.map((m) => ({
        ...m,
        subTaskCount: countMap.get(String(m._id)) ?? 0,
        updatedByName: names.get(String(m.updatedBy)) ?? null,
        hasPendingDraft: Boolean(m.pendingDraftAt),
      })),
    });
  }),
);

modulesRouter.post(
  '/reorder',
  requireRole('admin'),
  validateBody(reorderSchema),
  ah(async (req, res) => {
    const { ids } = req.body as { ids: string[] };
    await Module.bulkWrite(ids.map((id, i) => ({ updateOne: { filter: { _id: id }, update: { $set: { order: i + 1 } } } })));
    await record({ user: req.user!, action: 'reorder', entityType: 'module', entityTitle: 'Module order', visibleToViewers: true, path: '/' });
    res.json({ ok: true });
  }),
);

/** Editable payload for the admin editor (pending draft overlaid when present). */
modulesRouter.get(
  '/id/:id/edit',
  requireRole('editor'),
  ah(async (req, res) => {
    const doc = await Module.findById(req.params.id).lean();
    if (!doc) throw notFound('Module');
    const snapshot = doc.pendingDraft ?? moduleToSnapshot(doc);
    const [media, names] = await Promise.all([mediaMap([snapshot.heroMedia]), userNames([doc.updatedBy, doc.pendingDraftBy])]);
    res.json({
      _id: doc._id,
      status: doc.status,
      order: doc.order,
      updatedAt: doc.updatedAt,
      updatedByName: names.get(String(doc.updatedBy)) ?? null,
      hasPendingDraft: Boolean(doc.pendingDraft),
      pendingDraftByName: names.get(String(doc.pendingDraftBy)) ?? null,
      pendingDraftAt: doc.pendingDraftAt,
      snapshot,
      heroMediaDoc: snapshot.heroMedia ? media.get(String(snapshot.heroMedia)) ?? null : null,
    });
  }),
);

modulesRouter.get(
  '/:slug',
  ah(async (req, res) => {
    const staff = isStaff(req.user);
    const doc = await Module.findOne({ slug: req.params.slug }).lean();
    if (!doc || (!staff && doc.status !== 'published')) throw notFound('Module');
    res.json(await hydrateModule(doc, { preview: staff && req.query.preview === '1', staff }));
  }),
);

modulesRouter.post(
  '/',
  requireRole('editor'),
  validateBody(moduleInputSchema),
  ah(async (req, res) => {
    const snap = normalizeModule(req.body as ModuleInput);
    const last = await Module.findOne().sort({ order: -1 }).select('order').lean();
    const doc = await Module.create({ ...moduleDocFields(snap), order: (last?.order ?? 0) + 1, status: 'draft', updatedBy: req.user!.id });
    await saveVersion({ entityType: 'module', entityId: doc._id, snapshot: snap, user: req.user!, changeNote: (req.body as ModuleInput).changeNote || 'Created' });
    await record({ user: req.user!, action: 'create', entityType: 'module', entityId: doc._id, entityTitle: doc.title, slug: doc.slug, path: pathFor(doc.slug) });
    res.status(201).json({ _id: doc._id, slug: doc.slug });
  }),
);

modulesRouter.put(
  '/:id',
  requireRole('editor'),
  validateBody(moduleInputSchema),
  ah(async (req, res) => {
    const input = req.body as ModuleInput;
    const doc = await Module.findById(req.params.id);
    if (!doc) throw notFound('Module');
    const snap = normalizeModule(input);
    const user = req.user!;

    // Editors cannot change live content: their edits to published modules wait for an Admin.
    if (!isAdmin(user) && doc.status === 'published') {
      if (snap.slug !== doc.slug) throw forbidden('Only an Admin can change the address of a published module');
      doc.pendingDraft = snap;
      doc.pendingDraftBy = user.id as never;
      doc.pendingDraftAt = new Date();
      await doc.save();
      await saveVersion({ entityType: 'module', entityId: doc._id, snapshot: snap, user, changeNote: input.changeNote || 'Submitted for review' });
      await record({ user, action: 'submit', entityType: 'module', entityId: doc._id, entityTitle: snap.title, slug: doc.slug, path: pathFor(doc.slug) });
      return res.json({ ok: true, pending: true });
    }

    doc.set({ ...moduleDocFields(snap), updatedBy: user.id });
    if (isAdmin(user)) doc.set({ pendingDraft: null, pendingDraftBy: null, pendingDraftAt: null });
    await doc.save();
    await saveVersion({ entityType: 'module', entityId: doc._id, snapshot: snap, user, changeNote: input.changeNote });
    await record({
      user,
      action: 'update',
      entityType: 'module',
      entityId: doc._id,
      entityTitle: doc.title,
      slug: doc.slug,
      path: pathFor(doc.slug),
      visibleToViewers: doc.status === 'published',
    });
    res.json({ ok: true, pending: false, slug: doc.slug });
  }),
);

modulesRouter.patch(
  '/:id/status',
  requireRole('admin'),
  validateBody(statusSchema),
  ah(async (req, res) => {
    const { status } = req.body as { status: 'draft' | 'published' };
    const doc = await Module.findById(req.params.id);
    if (!doc) throw notFound('Module');
    if (status === 'published' && doc.pendingDraft) {
      doc.set({ ...moduleDocFields(doc.pendingDraft), updatedBy: doc.pendingDraftBy ?? req.user!.id });
    }
    doc.set({ status, pendingDraft: null, pendingDraftBy: null, pendingDraftAt: null });
    if (status === 'published') doc.publishedAt = new Date();
    await doc.save();
    await record({
      user: req.user!,
      action: status === 'published' ? 'publish' : 'unpublish',
      entityType: 'module',
      entityId: doc._id,
      entityTitle: doc.title,
      slug: doc.slug,
      path: pathFor(doc.slug),
      visibleToViewers: true,
    });
    res.json({ ok: true, status });
  }),
);

modulesRouter.post(
  '/:id/discard-draft',
  requireRole('editor'),
  ah(async (req, res) => {
    const doc = await Module.findById(req.params.id);
    if (!doc) throw notFound('Module');
    if (!doc.pendingDraft) throw new HttpError(400, 'There are no pending changes to discard');
    if (!isAdmin(req.user) && String(doc.pendingDraftBy) !== req.user!.id) throw forbidden();
    doc.set({ pendingDraft: null, pendingDraftBy: null, pendingDraftAt: null });
    await doc.save();
    await record({ user: req.user!, action: 'update', entityType: 'module', entityId: doc._id, entityTitle: doc.title, path: pathFor(doc.slug), meta: { discardedDraft: true } });
    res.json({ ok: true });
  }),
);

modulesRouter.delete(
  '/:id',
  requireRole('admin'),
  ah(async (req, res) => {
    const doc = await Module.findById(req.params.id);
    if (!doc) throw notFound('Module');
    const subs = await SubTask.find({ moduleId: doc._id }).select('_id').lean();
    await SubTask.deleteMany({ moduleId: doc._id });
    await SubTask.updateMany({}, { $pull: { relatedSubTaskIds: { $in: subs.map((s) => s._id) } } });
    await doc.deleteOne();
    await Version.deleteMany({ entityId: { $in: [doc._id, ...subs.map((s) => s._id)] } });
    await record({ user: req.user!, action: 'delete', entityType: 'module', entityId: doc._id, entityTitle: doc.title, visibleToViewers: doc.status === 'published', slug: doc.slug });
    res.json({ ok: true });
  }),
);
