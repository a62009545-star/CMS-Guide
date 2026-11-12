import { Link } from 'react-router-dom';
import type { ModuleListItem } from '@/api/types';
import { ModuleIcon } from '@/components/ui/Icon';
import { cn } from '@/lib/utils';

/**
 * The CMS lifecycle as a route map: seven stations joined by one line. The red line draws once on
 * load — the only ambient motion in the product. Horizontal on large screens, vertical below.
 */
export function LifecycleRoute({ modules, animate = true }: { modules: ModuleListItem[]; animate?: boolean }) {
  const n = modules.length;
  return (
    <nav aria-label="CMS lifecycle">
      {/* Horizontal (lg+) */}
      <ol className="relative hidden lg:grid" style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}>
        <span aria-hidden className="absolute top-[19px] h-0.5 bg-line" style={{ left: `${50 / n}%`, right: `${50 / n}%` }} />
        <span
          aria-hidden
          className={cn('absolute top-[19px] h-0.5 origin-left bg-brand', animate && 'animate-route-draw')}
          style={{ left: `${50 / n}%`, right: `${50 / n}%` }}
        />
        {modules.map((m, i) => (
          <li key={m._id} className="group relative flex flex-col items-center px-1.5">
            <Link to={`/modules/${m.slug}`} className="flex w-full flex-1 flex-col items-center rounded-card focus-visible:ring-offset-4">
              <span
                className={cn(
                  'tabular relative z-10 grid h-10 w-10 place-items-center rounded-full border-2 border-brand bg-surface text-sm font-semibold text-brand-fg transition-colors group-hover:bg-brand group-hover:text-white',
                  animate && 'animate-fade-in',
                )}
                style={animate ? { animationDelay: `${150 + (i * 1000) / n}ms` } : undefined}
              >
                {i + 1}
              </span>
              <span className="mt-3 flex w-full flex-1 flex-col rounded-card border border-line bg-surface p-3.5 text-left shadow-card transition-[border-color,box-shadow] group-hover:border-brand/40 group-hover:shadow-raised">
                <ModuleIcon name={m.icon} className="h-5 w-5 text-ink-muted" />
                <span className="mt-2.5 text-[0.9375rem] font-semibold leading-snug">{m.title}</span>
                <span className="mt-auto pt-3 text-xs text-ink-muted">
                  {m.subTaskCount} {m.subTaskCount === 1 ? 'walkthrough' : 'walkthroughs'}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ol>

      {/* Vertical (< lg) */}
      <ol className="relative space-y-3 lg:hidden">
        <span aria-hidden className="absolute bottom-6 left-[19px] top-6 w-0.5 bg-line" />
        <span aria-hidden className={cn('absolute bottom-6 left-[19px] top-6 w-0.5 origin-top bg-brand', animate && 'animate-route-draw-y')} />
        {modules.map((m, i) => (
          <li key={m._id} className="group relative">
            <Link to={`/modules/${m.slug}`} className="flex items-center gap-4 rounded-card">
              <span className="tabular relative z-10 grid h-10 w-10 shrink-0 place-items-center rounded-full border-2 border-brand bg-surface text-sm font-semibold text-brand-fg">
                {i + 1}
              </span>
              <span className="flex min-w-0 flex-1 items-center gap-3 rounded-card border border-line bg-surface p-3.5 shadow-card group-hover:border-brand/40">
                <ModuleIcon name={m.icon} className="h-5 w-5 shrink-0 text-ink-muted" />
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold leading-snug">{m.title}</span>
                  <span className="block truncate text-sm text-ink-muted">{m.summary}</span>
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </nav>
  );
}
