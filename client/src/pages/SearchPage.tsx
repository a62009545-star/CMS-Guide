import { Search } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { SearchResultBody } from '@/components/layout/SearchResult';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input, Select } from '@/components/ui/Field';
import { Skeleton } from '@/components/ui/Skeleton';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { GROUP_LABEL, GROUP_ORDER, useSearch } from '@/hooks/useSearch';
import type { SearchDocType } from '@/api/types';
import { cn } from '@/lib/utils';

export function SearchPage() {
  const [params, setParams] = useSearchParams();
  const q = params.get('q') ?? '';
  const moduleId = params.get('module') ?? '';
  const type = (params.get('type') ?? '') as SearchDocType | '';
  useDocumentTitle(q ? `Search: ${q}` : 'Search');
  const { groups, hits, modules, isLoading } = useSearch(q, moduleId || undefined);

  const set = (k: string, v: string) => {
    const next = new URLSearchParams(params);
    if (v) next.set(k, v);
    else next.delete(k);
    setParams(next, { replace: true });
  };
  const shown = type ? groups.filter((g) => g.type === type) : groups;
  const counts = Object.fromEntries(groups.map((g) => [g.type, g.hits.length]));

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-8">
      <h1 className="text-2xl font-bold">Search</h1>
      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" aria-hidden />
          <Input value={q} onChange={(e) => set('q', e.target.value)} placeholder="Search modules, steps, guidelines, FAQs" className="h-11 pl-9 text-base" aria-label="Search" autoFocus />
        </div>
        <Select value={moduleId} onChange={(e) => set('module', e.target.value)} className="h-11 sm:w-60" aria-label="Filter by module">
          <option value="">All modules</option>
          {modules.map((m) => (
            <option key={m._id} value={m._id}>
              {m.title}
            </option>
          ))}
        </Select>
      </div>

      {q.trim().length >= 2 && (
        <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Filter by result type">
          <button onClick={() => set('type', '')} className={cn('rounded-full border px-3 py-1 text-sm', !type ? 'border-ink bg-ink text-canvas' : 'border-line bg-surface hover:border-ink-subtle')} aria-pressed={!type}>
            All <span className="tabular opacity-70">{hits.length}</span>
          </button>
          {GROUP_ORDER.filter((t) => counts[t]).map((t) => (
            <button key={t} onClick={() => set('type', t)} className={cn('rounded-full border px-3 py-1 text-sm', type === t ? 'border-ink bg-ink text-canvas' : 'border-line bg-surface hover:border-ink-subtle')} aria-pressed={type === t}>
              {GROUP_LABEL[t]} <span className="tabular opacity-70">{counts[t]}</span>
            </button>
          ))}
        </div>
      )}

      <div className="mt-8 space-y-8" aria-live="polite">
        {q.trim().length < 2 ? (
          <EmptyState icon={<Search className="h-8 w-8" />} title="Search the whole guide">
            Results cover module overviews, walkthrough steps, guidelines and FAQs. Spelling mistakes are fine.
          </EmptyState>
        ) : isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="h-20" />
            ))}
          </div>
        ) : shown.length === 0 ? (
          <EmptyState title={`No results for “${q}”`}>Try fewer words, or clear the module filter.</EmptyState>
        ) : (
          shown.map((g) => (
            <section key={g.type} aria-labelledby={`g-${g.type}`}>
              <h2 id={`g-${g.type}`} className="mb-3 text-sm font-semibold text-ink-muted">
                {g.label} <span className="tabular font-normal">({g.hits.length})</span>
              </h2>
              <ul className="card divide-y divide-line">
                {g.hits.map((h) => (
                  <li key={h.doc.id}>
                    <Link to={h.doc.path} className="block px-4 py-3.5 hover:bg-surface-sunken">
                      <SearchResultBody hit={h} />
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))
        )}
      </div>
    </div>
  );
}
