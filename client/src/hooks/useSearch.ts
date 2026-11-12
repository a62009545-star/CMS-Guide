import Fuse, { type FuseResult, type FuseResultMatch } from 'fuse.js';
import { useMemo } from 'react';
import { useSearchIndex } from '@/api/queries';
import type { SearchDoc, SearchDocType } from '@/api/types';

export const GROUP_ORDER: SearchDocType[] = ['module', 'subtask', 'step', 'guideline', 'faq'];
export const GROUP_LABEL: Record<SearchDocType, string> = {
  module: 'Modules',
  subtask: 'Sub-tasks',
  step: 'Steps',
  guideline: 'Guidelines',
  faq: 'FAQs',
};

export interface SearchHit {
  doc: SearchDoc;
  score: number;
  titleRanges: [number, number][];
  snippet: { text: string; ranges: [number, number][] };
}

/** Ranges where whole query terms occur (case-insensitive). Readable, unlike per-character fuzzy hits. */
function termRanges(text: string, terms: string[]): [number, number][] {
  const lower = text.toLowerCase();
  const out: [number, number][] = [];
  for (const t of terms) {
    let i = lower.indexOf(t);
    while (i !== -1) {
      out.push([i, i + t.length - 1]);
      i = lower.indexOf(t, i + t.length);
    }
  }
  return out;
}

/** Fuzzy ranges are only shown when they cover at least 3 characters, so typos don't produce confetti. */
function bestRanges(text: string, terms: string[], fuzzy: readonly (readonly [number, number])[] = []): [number, number][] {
  const exact = termRanges(text, terms);
  return exact.length ? exact : (fuzzy.filter(([a, b]) => b - a >= 2) as [number, number][]);
}

/** Pick a ~160 character window around the first match so the snippet shows why it matched. */
function snippetFor(text: string, terms: string[], match?: FuseResultMatch): SearchHit['snippet'] {
  const max = 160;
  const all = bestRanges(text, terms, match?.indices);
  if (!all.length) return { text: text.slice(0, max) + (text.length > max ? '…' : ''), ranges: [] };
  const best = [...all].sort((a, b) => b[1] - b[0] - (a[1] - a[0]))[0];
  const start = Math.max(0, best[0] - 50);
  const end = Math.min(text.length, start + max);
  const ranges = all
    .filter(([a, b]) => a >= start && b < end)
    .map(([a, b]) => [a - start + (start > 0 ? 1 : 0), b - start + (start > 0 ? 1 : 0)] as [number, number]);
  return { text: (start > 0 ? '…' : '') + text.slice(start, end) + (end < text.length ? '…' : ''), ranges };
}

function toHit(r: FuseResult<SearchDoc>, terms: string[]): SearchHit {
  const t = r.matches?.find((m) => m.key === 'title');
  const x = r.matches?.find((m) => m.key === 'text');
  return {
    doc: r.item,
    score: r.score ?? 1,
    titleRanges: bestRanges(r.item.title, terms, t?.indices),
    snippet: snippetFor(r.item.text, terms, x),
  };
}

/**
 * Fuzzy, typo-tolerant search over the flattened content index (modules, sub-tasks, steps,
 * guidelines, FAQs). Runs entirely in the browser for instant results.
 */
export function useSearch(query: string, moduleId?: string, enabled = true) {
  const index = useSearchIndex(enabled);
  const fuse = useMemo(
    () =>
      index.data
        ? new Fuse(index.data.items, {
            keys: [
              { name: 'title', weight: 3 },
              { name: 'text', weight: 1 },
              { name: 'moduleTitle', weight: 0.3 },
            ],
            includeMatches: true,
            includeScore: true,
            ignoreLocation: true,
            threshold: 0.34,
            minMatchCharLength: 2,
          })
        : null,
    [index.data],
  );

  const hits = useMemo(() => {
    const q = query.trim();
    if (!fuse || q.length < 2) return [];
    const terms = q.toLowerCase().split(/\s+/).filter((w) => w.length >= 2);
    return fuse
      .search(q, { limit: 80 })
      .filter((r) => !moduleId || r.item.moduleId === moduleId)
      .map((r) => toHit(r, terms));
  }, [fuse, query, moduleId]);

  const groups = useMemo(() => {
    const g = new Map<SearchDocType, SearchHit[]>();
    for (const h of hits) g.set(h.doc.type, [...(g.get(h.doc.type) ?? []), h]);
    return GROUP_ORDER.filter((t) => g.has(t)).map((t) => ({ type: t, label: GROUP_LABEL[t], hits: g.get(t)! }));
  }, [hits]);

  return { groups, hits, modules: index.data?.modules ?? [], isLoading: index.isLoading, error: index.error };
}
