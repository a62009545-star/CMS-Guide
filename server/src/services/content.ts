import { Types } from 'mongoose';
import type { ModuleInput, SubTaskInput } from '@cms/shared';
import { Media, Module, SubTask, User } from '../models/index.js';
import { htmlToText, sanitizeRich } from './sanitize.js';

/* ───────── Snapshots: the editable shape of an entity, stored in versions & pending drafts ───────── */

export type ModuleSnapshot = Omit<ModuleInput, 'changeNote'>;
export type SubTaskSnapshot = Omit<SubTaskInput, 'changeNote'>;

const idStr = (v: unknown) => (v == null ? null : String(v));

export function moduleToSnapshot(m: Record<string, any>): ModuleSnapshot {
  return {
    title: m.title,
    slug: m.slug,
    section: m.section ?? 'lifecycle',
    icon: m.icon,
    summary: m.summary,
    e2eContent: { html: m.e2eContent?.html ?? '', json: m.e2eContent?.json ?? null },
    flowSteps: (m.flowSteps ?? []).map((s: any) => ({ title: s.title, description: s.description ?? '' })),
    heroMedia: idStr(m.heroMedia?._id ?? m.heroMedia),
    guidelines: (m.guidelines ?? []).map((g: any) => ({ type: g.type, text: g.text })),
    faqs: (m.faqs ?? []).map((f: any) => ({ q: f.q, a: f.a })),
  };
}

export function subTaskToSnapshot(s: Record<string, any>): SubTaskSnapshot {
  return {
    moduleId: String(s.moduleId?._id ?? s.moduleId),
    title: s.title,
    slug: s.slug,
    summary: s.summary,
    prerequisites: [...(s.prerequisites ?? [])],
    expectedOutcome: s.expectedOutcome ?? '',
    steps: (s.steps ?? []).map((st: any) => ({
      title: st.title,
      content: { html: st.content?.html ?? '', json: st.content?.json ?? null },
      media: (st.media ?? []).map((m: any) => String(m?._id ?? m)),
      callout: st.callout?.type ? { type: st.callout.type, text: st.callout.text ?? '' } : null,
    })),
    relatedSubTaskIds: (s.relatedSubTaskIds ?? []).map((r: any) => String(r?._id ?? r)),
  };
}

/* ───────── Normalisation: sanitize rich text and compute search text before saving ───────── */

export function normalizeModule(input: ModuleInput): ModuleSnapshot {
  const { changeNote: _n, ...rest } = input;
  return { ...rest, heroMedia: rest.heroMedia ?? null, e2eContent: { html: sanitizeRich(rest.e2eContent.html), json: rest.e2eContent.json ?? null } };
}

export function normalizeSubTask(input: SubTaskInput): SubTaskSnapshot {
  const { changeNote: _n, ...rest } = input;
  return {
    ...rest,
    steps: rest.steps.map((s) => ({
      title: s.title,
      content: { html: sanitizeRich(s.content.html), json: s.content.json ?? null },
      media: s.media,
      callout: s.callout && s.callout.text ? s.callout : null,
    })),
  };
}

export function moduleSearchText(m: ModuleSnapshot) {
  return [
    htmlToText(m.e2eContent.html),
    ...m.flowSteps.map((f) => `${f.title} ${f.description}`),
    ...m.guidelines.map((g) => g.text),
    ...m.faqs.map((f) => `${f.q} ${f.a}`),
  ].join(' \n ');
}

export function subTaskSearchText(s: SubTaskSnapshot) {
  return [
    ...s.prerequisites,
    s.expectedOutcome,
    ...s.steps.map((st) => `${st.title} ${htmlToText(st.content.html)} ${st.callout?.text ?? ''}`),
  ].join(' \n ');
}

/** Convert a snapshot into the fields written to the Mongo document. */
export function moduleDocFields(s: ModuleSnapshot) {
  return { ...s, heroMedia: s.heroMedia ? new Types.ObjectId(s.heroMedia) : null, searchText: moduleSearchText(s) };
}

export function subTaskDocFields(s: SubTaskSnapshot) {
  return {
    ...s,
    moduleId: new Types.ObjectId(s.moduleId),
    steps: s.steps.map((st, i) => ({ ...st, order: i + 1, media: st.media.map((m) => new Types.ObjectId(m)) })),
    relatedSubTaskIds: s.relatedSubTaskIds.map((r) => new Types.ObjectId(r)),
    searchText: subTaskSearchText(s),
  };
}

/* ───────── Hydration: resolve media & users for API responses ───────── */

export async function mediaMap(ids: unknown[]) {
  const unique = [...new Set(ids.filter(Boolean).map(String))].filter((id) => Types.ObjectId.isValid(id));
  if (!unique.length) return new Map<string, any>();
  const docs = await Media.find({ _id: { $in: unique } }).lean();
  return new Map(docs.map((d) => [String(d._id), d]));
}

export async function userNames(ids: unknown[]) {
  const unique = [...new Set(ids.filter(Boolean).map(String))];
  if (!unique.length) return new Map<string, string>();
  const docs = await User.find({ _id: { $in: unique } }).select('name').lean();
  return new Map(docs.map((d) => [String(d._id), d.name]));
}

/** Viewer-facing module payload. With preview, an editor's pending draft is overlaid. */
export async function hydrateModule(doc: Record<string, any>, opts: { preview: boolean; staff: boolean }) {
  const base = opts.preview && doc.pendingDraft ? { ...doc, ...doc.pendingDraft } : doc;
  const [media, names] = await Promise.all([
    mediaMap([base.heroMedia]),
    userNames([doc.updatedBy, doc.pendingDraftBy]),
  ]);
  const subFilter: Record<string, unknown> = { moduleId: doc._id };
  if (!opts.staff) subFilter.status = 'published';
  const subTasks = await SubTask.find(subFilter)
    .sort({ order: 1 })
    .select('title slug summary order status steps.title updatedAt pendingDraftAt')
    .lean();
  // Previous/next stay within the module's own section (lifecycle or configuration).
  const siblingFilter = { section: doc.section ?? 'lifecycle', ...(opts.staff ? {} : { status: 'published' }) };
  const [prev, next] = await Promise.all([
    Module.findOne({ ...siblingFilter, order: { $lt: doc.order } }).sort({ order: -1 }).select('title slug order').lean(),
    Module.findOne({ ...siblingFilter, order: { $gt: doc.order } }).sort({ order: 1 }).select('title slug order').lean(),
  ]);
  const { searchText: _s, pendingDraft, ...rest } = base;
  return {
    ...rest,
    _id: doc._id,
    status: doc.status,
    order: doc.order,
    heroMedia: base.heroMedia ? media.get(String(base.heroMedia)) ?? null : null,
    updatedByName: names.get(String(doc.updatedBy)) ?? null,
    hasPendingDraft: Boolean(doc.pendingDraft),
    pendingDraftByName: doc.pendingDraftBy ? names.get(String(doc.pendingDraftBy)) ?? null : null,
    isPreview: Boolean(opts.preview && doc.pendingDraft),
    subTasks: subTasks.map((s) => ({
      _id: s._id,
      title: s.title,
      slug: s.slug,
      summary: s.summary,
      order: s.order,
      status: s.status,
      stepCount: s.steps?.length ?? 0,
      updatedAt: s.updatedAt,
      hasPendingDraft: Boolean(s.pendingDraftAt),
    })),
    prev,
    next,
  };
}

export async function hydrateSubTask(doc: Record<string, any>, opts: { preview: boolean; staff: boolean }) {
  const base = opts.preview && doc.pendingDraft ? { ...doc, ...doc.pendingDraft } : doc;
  const allMediaIds = (base.steps ?? []).flatMap((s: any) => s.media ?? []);
  const relatedFilter: Record<string, unknown> = { _id: { $in: base.relatedSubTaskIds ?? [] } };
  if (!opts.staff) relatedFilter.status = 'published';
  const siblingFilter: Record<string, unknown> = { moduleId: doc.moduleId };
  if (!opts.staff) siblingFilter.status = 'published';

  const [media, names, module, related, prev, next] = await Promise.all([
    mediaMap(allMediaIds),
    userNames([doc.updatedBy, doc.pendingDraftBy]),
    Module.findById(doc.moduleId).select('title slug order icon status section').lean(),
    SubTask.find(relatedFilter).select('title slug summary moduleId').lean(),
    SubTask.findOne({ ...siblingFilter, order: { $lt: doc.order } }).sort({ order: -1 }).select('title slug').lean(),
    SubTask.findOne({ ...siblingFilter, order: { $gt: doc.order } }).sort({ order: 1 }).select('title slug').lean(),
  ]);
  const relatedModules = await Module.find({ _id: { $in: related.map((r) => r.moduleId) } }).select('slug title').lean();
  const modSlug = new Map(relatedModules.map((m) => [String(m._id), m]));

  const { searchText: _s, pendingDraft, ...rest } = base;
  return {
    ...rest,
    _id: doc._id,
    status: doc.status,
    order: doc.order,
    module,
    steps: (base.steps ?? []).map((s: any, i: number) => ({
      ...s,
      _id: s._id ?? `step-${i}`,
      order: i + 1,
      media: (s.media ?? []).map((m: unknown) => media.get(String(m))).filter(Boolean),
    })),
    related: related.map((r) => ({
      _id: r._id,
      title: r.title,
      slug: r.slug,
      summary: r.summary,
      moduleSlug: modSlug.get(String(r.moduleId))?.slug,
      moduleTitle: modSlug.get(String(r.moduleId))?.title,
    })),
    prev,
    next,
    updatedByName: names.get(String(doc.updatedBy)) ?? null,
    hasPendingDraft: Boolean(doc.pendingDraft),
    pendingDraftByName: doc.pendingDraftBy ? names.get(String(doc.pendingDraftBy)) ?? null : null,
    isPreview: Boolean(opts.preview && doc.pendingDraft),
  };
}
