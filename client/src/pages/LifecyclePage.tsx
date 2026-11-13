import { useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useModuleSections } from '@/api/queries';
import { LifecycleRoute } from '@/components/content/LifecycleRoute';
import { ModuleView } from './ModulePage';
import { ErrorState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

/**
 * The CMS lifecycle: the seven stages as one route. Selecting a stage shows its guide and steps
 * right below, without leaving the page. The selection is kept in the URL (?stage=…).
 */
export function LifecyclePage() {
  useDocumentTitle('CMS lifecycle');
  const { lifecycle, isLoading, error, refetch } = useModuleSections();
  const [params, setParams] = useSearchParams();
  const detailRef = useRef<HTMLDivElement>(null);
  const selected = lifecycle.find((m) => m.slug === params.get('stage'))?.slug ?? lifecycle[0]?.slug ?? null;
  const select = (slug: string) => {
    setParams({ stage: slug }, { replace: true });
    requestAnimationFrame(() =>
      detailRef.current?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' }),
    );
  };
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-8 sm:py-14">
      <h1 className="text-3xl font-bold sm:text-4xl">CMS lifecycle</h1>
      <p className="mt-3 max-w-2xl text-ink-muted">
        Every CRQ goes through these seven stages, in order. Select a stage to see everything about it below: how it works, the process flow, guidelines, walkthroughs and FAQs.
      </p>
      <div className="mt-10">
        {isLoading ? (
          <div className="grid gap-3 lg:grid-cols-7">
            {Array.from({ length: 7 }, (_, i) => (
              <Skeleton key={i} className="h-36" />
            ))}
          </div>
        ) : error ? (
          <ErrorState message="The lifecycle could not be loaded." onRetry={() => refetch()} />
        ) : (
          <LifecycleRoute modules={lifecycle} selected={selected} onSelect={select} />
        )}
      </div>
      {selected && (
        <div ref={detailRef} className="mt-12 scroll-mt-24 border-t border-line pt-10" aria-live="polite">
          <ModuleView key={selected} slug={selected} embedded />
        </div>
      )}
    </div>
  );
}
