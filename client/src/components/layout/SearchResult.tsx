import { BookOpen, CircleHelp, FileText, ListChecks, Scale } from 'lucide-react';
import type { SearchDocType } from '@/api/types';
import { Highlight } from '@/components/ui/Highlight';
import type { SearchHit } from '@/hooks/useSearch';

const icons: Record<SearchDocType, typeof BookOpen> = {
  module: BookOpen,
  subtask: ListChecks,
  step: FileText,
  guideline: Scale,
  faq: CircleHelp,
};

export function SearchResultBody({ hit, compact }: { hit: SearchHit; compact?: boolean }) {
  const I = icons[hit.doc.type];
  return (
    <span className="flex min-w-0 gap-3">
      <I className="mt-0.5 h-[18px] w-[18px] shrink-0 text-ink-subtle" aria-hidden />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-xs text-ink-muted">{hit.doc.breadcrumb.join(' › ')}</span>
        <span className="block font-medium leading-snug">
          <Highlight text={hit.doc.title} ranges={hit.titleRanges} />
        </span>
        {hit.snippet.text && (
          <span className={compact ? 'mt-0.5 line-clamp-1 block text-sm text-ink-muted' : 'mt-1 line-clamp-2 block text-sm text-ink-muted'}>
            <Highlight text={hit.snippet.text} ranges={hit.snippet.ranges} />
          </span>
        )}
      </span>
      {hit.doc.status === 'draft' && <span className="self-start rounded border border-line px-1.5 text-xs text-ink-muted">Draft</span>}
    </span>
  );
}
