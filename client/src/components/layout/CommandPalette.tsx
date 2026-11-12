import { CornerDownLeft, Search } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal } from '@/components/ui/Modal';
import { useSearch } from '@/hooks/useSearch';
import { cn } from '@/lib/utils';
import { SearchResultBody } from './SearchResult';

export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [q, setQ] = useState('');
  const [moduleId, setModuleId] = useState('');
  const [active, setActive] = useState(0);
  const navigate = useNavigate();
  const { groups, modules, isLoading } = useSearch(q, moduleId || undefined, open);
  const flat = useMemo(() => groups.flatMap((g) => g.hits.slice(0, 6)), [groups]);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => setActive(0), [q, moduleId]);
  useEffect(() => {
    if (!open) {
      setQ('');
      setModuleId('');
    }
  }, [open]);
  useEffect(() => {
    listRef.current?.querySelector(`[data-idx="${active}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  const go = (path: string) => {
    onClose();
    navigate(path);
  };
  const seeAll = () => go(`/search?q=${encodeURIComponent(q)}${moduleId ? `&module=${moduleId}` : ''}`);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, flat.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (flat[active]) go(flat[active].doc.path);
      else if (q.trim()) seeAll();
    }
  };

  let idx = -1;
  return (
    <Modal open={open} onClose={onClose} title="Search the guide" size="lg" top bare>
      <div className="flex items-center gap-3 border-b border-line px-4">
        <Search className="h-5 w-5 shrink-0 text-ink-muted" aria-hidden />
        <input
          data-autofocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Search modules, steps, guidelines, FAQs…"
          className="h-14 min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-ink-subtle focus-visible:ring-0 focus-visible:ring-offset-0"
          role="combobox"
          aria-expanded={flat.length > 0}
          aria-controls="palette-results"
          aria-activedescendant={flat[active] ? `palette-opt-${active}` : undefined}
          aria-label="Search"
        />
        <select
          value={moduleId}
          onChange={(e) => setModuleId(e.target.value)}
          className="hidden h-8 max-w-[180px] rounded-md border border-line bg-surface px-2 text-sm text-ink-muted sm:block"
          aria-label="Filter by module"
        >
          <option value="">All modules</option>
          {modules.map((m) => (
            <option key={m._id} value={m._id}>
              {m.title}
            </option>
          ))}
        </select>
      </div>
      <div ref={listRef} id="palette-results" role="listbox" className="max-h-[55vh] overflow-y-auto p-2">
        {q.trim().length < 2 ? (
          <p className="px-3 py-8 text-center text-sm text-ink-muted">Type at least two characters. Search is typo-tolerant, so “rolback” finds “rollback”.</p>
        ) : isLoading ? (
          <p className="px-3 py-8 text-center text-sm text-ink-muted">Loading the index…</p>
        ) : flat.length === 0 ? (
          <p className="px-3 py-8 text-center text-sm text-ink-muted">No matches for “{q}”. Try a shorter phrase or clear the module filter.</p>
        ) : (
          groups.map((g) => (
            <div key={g.type} role="group" aria-label={g.label} className="mb-1">
              <p className="px-3 pb-1 pt-3 text-xs font-semibold text-ink-muted">{g.label}</p>
              {g.hits.slice(0, 6).map((h) => {
                idx += 1;
                const i = idx;
                return (
                  <button
                    key={h.doc.id}
                    id={`palette-opt-${i}`}
                    data-idx={i}
                    role="option"
                    aria-selected={i === active}
                    onMouseMove={() => setActive(i)}
                    onClick={() => go(h.doc.path)}
                    className={cn('block w-full rounded-lg px-3 py-2.5 text-left', i === active && 'bg-surface-sunken')}
                  >
                    <SearchResultBody hit={h} compact />
                  </button>
                );
              })}
            </div>
          ))
        )}
      </div>
      <div className="flex items-center justify-between gap-3 border-t border-line px-4 py-2.5 text-xs text-ink-muted">
        <span className="hidden items-center gap-3 sm:flex">
          <span><kbd className="rounded border border-line px-1">↑</kbd> <kbd className="rounded border border-line px-1">↓</kbd> to move</span>
          <span className="inline-flex items-center gap-1"><kbd className="rounded border border-line px-1"><CornerDownLeft className="inline h-3 w-3" /></kbd> to open</span>
          <span><kbd className="rounded border border-line px-1">Esc</kbd> to close</span>
        </span>
        {q.trim().length >= 2 && (
          <button onClick={seeAll} className="font-medium text-brand-fg hover:underline">
            See all results
          </button>
        )}
      </div>
    </Modal>
  );
}
