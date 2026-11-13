import { Router } from 'express';
import { Types } from 'mongoose';
import { z } from 'zod';
import { modulePath } from '@cms/shared';
import { env } from '../config/env.js';
import { isStaff } from '../middleware/auth.js';
import { parseQuery } from '../middleware/validate.js';
import { Module, SubTask } from '../models/index.js';
import { htmlToText } from '../services/sanitize.js';
import { ah } from '../utils/http.js';

export const searchRouter = Router();

export type SearchDocType = 'module' | 'subtask' | 'step' | 'guideline' | 'faq';

export interface SearchDoc {
  id: string;
  type: SearchDocType;
  title: string;
  text: string;
  moduleId: string;
  moduleTitle: string;
  breadcrumb: string[];
  path: string;
  status?: string;
  section?: string;
}

const clip = (s: string, n = 1200) => (s.length > n ? s.slice(0, n) : s);

/** Flatten modules & sub-tasks into small, individually linkable search documents. */
function flatten(mods: any[], subs: any[]): SearchDoc[] {
  const docs: SearchDoc[] = [];
  const modById = new Map(mods.map((m) => [String(m._id), m]));
  for (const m of mods) {
    const base = { moduleId: String(m._id), moduleTitle: m.title, status: m.status, section: m.section ?? 'lifecycle' };
    const mp = modulePath(m.section, m.slug);
    docs.push({ ...base, id: `m-${m._id}`, type: 'module', title: m.title, text: clip(`${m.summary} ${htmlToText(m.e2eContent?.html)}`), breadcrumb: [m.title], path: mp });
    (m.guidelines ?? []).forEach((g: any, i: number) =>
      docs.push({ ...base, id: `g-${m._id}-${i}`, type: 'guideline', title: `${g.type === 'must' ? 'Must' : g.type === 'should' ? 'Should' : 'Note'}`, text: g.text, breadcrumb: [m.title, 'Guidelines'], path: `${mp}#guideline-${i + 1}` }),
    );
    (m.faqs ?? []).forEach((f: any, i: number) =>
      docs.push({ ...base, id: `f-${m._id}-${i}`, type: 'faq', title: f.q, text: f.a, breadcrumb: [m.title, 'FAQs'], path: `${mp}#faq-${i + 1}` }),
    );
  }
  for (const s of subs) {
    const m = modById.get(String(s.moduleId));
    if (!m) continue;
    const base = { moduleId: String(m._id), moduleTitle: m.title, status: s.status, section: m.section ?? 'lifecycle' };
    const sp = modulePath(m.section, m.slug, s.slug);
    docs.push({ ...base, id: `s-${s._id}`, type: 'subtask', title: s.title, text: clip(`${s.summary} ${s.expectedOutcome ?? ''}`), breadcrumb: [m.title, s.title], path: sp });
    (s.steps ?? []).forEach((st: any, i: number) =>
      docs.push({
        ...base,
        id: `st-${s._id}-${i}`,
        type: 'step',
        title: st.title,
        text: clip(`${htmlToText(st.content?.html)} ${st.callout?.text ?? ''}`),
        breadcrumb: [m.title, s.title, `Step ${i + 1}`],
        path: `${sp}#step-${i + 1}`,
      }),
    );
  }
  return docs;
}

const FIELDS = 'title slug section summary status e2eContent.html guidelines faqs moduleId expectedOutcome steps.title steps.content.html steps.callout';

/**
 * Full flattened index for client-side fuzzy search (Fuse.js). The corpus of a process guide is
 * small (hundreds of entries), so shipping it once and searching locally gives instant,
 * typo-tolerant results. Cached by TanStack Query and invalidated over Socket.io.
 */
searchRouter.get(
  '/index',
  ah(async (req, res) => {
    const staff = isStaff(req.user);
    const filter = staff ? {} : { status: 'published' };
    const mods = await Module.find(filter).sort({ order: 1 }).select(FIELDS).lean();
    const subs = await SubTask.find({ ...filter, moduleId: { $in: mods.map((m) => m._id) } }).sort({ order: 1 }).select(FIELDS).lean();
    res.set('Cache-Control', 'private, max-age=60');
    res.json({ items: flatten(mods, subs), modules: mods.map((m) => ({ _id: m._id, title: m.title })) });
  }),
);

const searchQuery = z.object({
  q: z.string().trim().min(1).max(100),
  moduleId: z.string().regex(/^[a-f\d]{24}$/i).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(40),
});

/**
 * Server-side search. Uses MongoDB Atlas Search (fuzzy) when ATLAS_SEARCH_INDEX is configured,
 * otherwise the built-in text index. Matching documents are expanded into step/guideline/FAQ hits.
 */
searchRouter.get(
  '/',
  ah(async (req, res) => {
    const { q, moduleId, limit } = parseQuery(searchQuery, req.query);
    const staff = isStaff(req.user);
    const statusFilter = staff ? {} : { status: 'published' };
    const modFilter: Record<string, unknown> = { ...statusFilter, ...(moduleId && { _id: new Types.ObjectId(moduleId) }) };

    let modIds: unknown[];
    let subIds: unknown[];
    if (env.ATLAS_SEARCH_INDEX) {
      const stage = (path: string[]) => ({
        $search: { index: env.ATLAS_SEARCH_INDEX, text: { query: q, path, fuzzy: { maxEdits: 2, prefixLength: 1 } } },
      });
      const [m, s] = await Promise.all([
        Module.aggregate([stage(['title', 'summary', 'searchText']), { $match: modFilter }, { $limit: 50 }, { $project: { _id: 1 } }]),
        SubTask.aggregate([stage(['title', 'summary', 'searchText']), { $match: { ...statusFilter, ...(moduleId && { moduleId: new Types.ObjectId(moduleId) }) } }, { $limit: 100 }, { $project: { _id: 1 } }]),
      ]);
      modIds = m.map((d) => d._id);
      subIds = s.map((d) => d._id);
    } else {
      const [m, s] = await Promise.all([
        Module.find({ ...modFilter, $text: { $search: q } }).select('_id').limit(50).lean(),
        SubTask.find({ ...statusFilter, ...(moduleId && { moduleId: new Types.ObjectId(moduleId) }), $text: { $search: q } }).select('_id').limit(100).lean(),
      ]);
      modIds = m.map((d) => d._id);
      subIds = s.map((d) => d._id);
    }

    const subs = await SubTask.find({ _id: { $in: subIds } }).select(FIELDS).lean();
    const mods = await Module.find({ ...statusFilter, _id: { $in: [...modIds, ...subs.map((s) => s.moduleId)] } }).select(FIELDS).lean();
    const matchedMods = new Set(modIds.map(String));
    const terms = q.toLowerCase().split(/\s+/).filter((t) => t.length > 1);
    const hit = (d: SearchDoc) => terms.some((t) => `${d.title} ${d.text}`.toLowerCase().includes(t));

    const results = flatten(mods, subs).filter((d) => {
      if (d.type === 'module') return matchedMods.has(d.moduleId);
      if (d.type === 'subtask') return true;
      return hit(d);
    });
    res.json({ items: results.slice(0, limit), engine: env.ATLAS_SEARCH_INDEX ? 'atlas' : 'text' });
  }),
);
