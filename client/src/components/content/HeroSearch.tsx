import { CornerDownLeft, Search } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SearchResultBody } from '@/components/layout/SearchResult';
import { useSearch } from '@/hooks/useSearch';
import { cn } from '@/lib/utils';

const SUGGESTIONS = ['Fetch plan data', 'Bulk upload', 'Golden set roster', 'Rollback plan'];

/** The landing page's search: instant, typo-tolerant results grouped by type, right under the box. */
export function HeroSearch() {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const navigate = useNavigate();
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { groups, isLoading } = useSearch(q);
  const flat = useMemo(() => groups.flatMap((g) => g.hits.slice(0, 4)), [groups]);
  const showPanel = open && q.trim().length >= 2;

  useEffect(() => setActive(0), [q]);
  useEffect(() => {
    const onDown = (e: MouseEvent) => !wrapRef.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  const seeAll = () => navigate(`/search?q=${encodeURIComponent(q.trim())}`);
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
      setActive((a) => Math.min(a + 1, flat.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (flat[active]) navigate(flat[active].doc.path);
      else if (q.trim()) seeAll();
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  let idx = -1;
  return (
    <div ref={wrapRef} className="relative mx-auto w-full max-w-2xl" data-guide="hero-search">
      <div
        className={cn(
          'flex h-14 items-center gap-3 rounded-2xl border bg-surface px-5 shadow-raised transition-colors sm:h-16',
          showPanel ? 'border-brand/50' : 'border-line focus-within:border-brand/50',
        )}
      >
        <Search className="h-5 w-5 shrink-0 text-ink-muted" aria-hidden />
        <input
          ref={inputRef}
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="Search walkthroughs, steps, guidelines and FAQs"
          className="h-full min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-ink-subtle focus-visible:ring-0 focus-visible:ring-offset-0 sm:text-lg"
          role="combobox"
          aria-label="Search the guide"
          aria-expanded={showPanel}
          aria-controls="hero-results"
          aria-activedescendant={showPanel && flat[active] ? `hero-opt-${active}` : undefined}
          autoComplete="off"
        />
        <kbd className="hidden shrink-0 rounded-md border border-line px-1.5 py-0.5 text-xs text-ink-muted sm:block">Enter</kbd>
      </div>

      {showPanel && (
        <div id="hero-results" role="listbox" className="absolute inset-x-0 top-full z-20 mt-2 max-h-[min(60vh,520px)] animate-pop-in overflow-y-auto rounded-2xl border border-line bg-surface p-2 text-left shadow-raised">
          {isLoading ? (
            <p className="px-4 py-6 text-center text-sm text-ink-muted">Loading the index…</p>
          ) : flat.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-ink-muted">No matches for “{q}”. Try a shorter phrase.</p>
          ) : (
            groups.map((g) => (
              <div key={g.type} role="group" aria-label={g.label}>
                <p className="px-3 pb-1 pt-3 text-xs font-semibold text-ink-muted">{g.label}</p>
                {g.hits.slice(0, 4).map((h) => {
                  idx += 1;
                  const i = idx;
                  return (
                    <button
                      key={h.doc.id}
                      id={`hero-opt-${i}`}
                      role="option"
                      aria-selected={i === active}
                      onMouseMove={() => setActive(i)}
                      onClick={() => navigate(h.doc.path)}
                      className={cn('block w-full rounded-xl px-3 py-2.5 text-left', i === active && 'bg-surface-sunken')}
                    >
                      <SearchResultBody hit={h} compact />
                    </button>
                  );
                })}
              </div>
            ))
          )}
          <button onClick={seeAll} className="mt-1 flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium text-brand-fg hover:bg-surface-sunken">
            See all results for “{q.trim()}”
            <CornerDownLeft className="h-4 w-4" aria-hidden />
          </button>
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-sm">
        <span className="text-ink-muted">Try</span>
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            onClick={() => {
              setQ(s);
              setOpen(true);
              inputRef.current?.focus();
            }}
            className="rounded-full border border-line bg-surface px-3 py-1 text-ink-muted transition-colors hover:border-ink-subtle hover:text-ink"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
