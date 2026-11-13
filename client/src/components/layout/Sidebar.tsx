import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { SECTION_LABEL } from '@cms/shared';
import { useModuleSections } from '@/api/queries';
import { ModuleIcon } from '@/components/ui/Icon';
import { Skeleton } from '@/components/ui/Skeleton';
import { cn } from '@/lib/utils';

/**
 * Navigation in two groups.
 * - CMS lifecycle: drawn as a route (one line through numbered stations). Stations up to the
 *   module you are reading are filled red, so it also shows where you are in the flow.
 * - Configuration & management: a plain list with icons, because these topics are not a sequence.
 */
export function Sidebar({ collapsed, onToggle, onNavigate }: { collapsed: boolean; onToggle?: () => void; onNavigate?: () => void }) {
  const { lifecycle, configuration, isLoading } = useModuleSections();
  const { pathname } = useLocation();
  const currentSlug = pathname.startsWith('/modules/') ? pathname.split('/')[2] : null;
  const currentIdx = lifecycle.findIndex((m) => m.slug === currentSlug);

  const heading = (text: string, first = false) =>
    collapsed ? (
      !first && <div className="mx-auto my-3 h-px w-8 bg-line" aria-hidden />
    ) : (
      <p className={cn('px-2 pb-2 text-xs font-semibold text-ink-muted', !first && 'mt-6')}>{text}</p>
    );

  return (
    <div className="flex h-full flex-col">
      <div className={cn('flex items-center px-4 pb-1 pt-4', collapsed ? 'justify-center px-2' : 'justify-end')}>
        {onToggle && (
          <button
            onClick={onToggle}
            className="hidden rounded-md p-1.5 text-ink-muted hover:bg-surface-sunken hover:text-ink lg:block"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <PanelLeftOpen className="h-[18px] w-[18px]" /> : <PanelLeftClose className="h-[18px] w-[18px]" />}
          </button>
        )}
      </div>
      <nav aria-label="Guide sections" className="min-h-0 flex-1 overflow-y-auto px-3 pb-6">
        {isLoading && (
          <div className="space-y-4 px-2 pt-2">
            {Array.from({ length: 9 }, (_, i) => (
              <Skeleton key={i} className="h-5" />
            ))}
          </div>
        )}

        {lifecycle.length > 0 && (
          <section aria-label={SECTION_LABEL.lifecycle}>
            {heading(SECTION_LABEL.lifecycle, true)}
            <ol className="relative">
              {lifecycle.map((m, i) => {
                const done = currentIdx >= 0 && i <= currentIdx;
                const isLast = i === lifecycle.length - 1;
                const active = currentSlug === m.slug;
                return (
                  <li key={m._id} className="relative">
                    {!isLast && (
                      <span
                        aria-hidden
                        className={cn('absolute top-[26px] h-[calc(100%-8px)] w-0.5', collapsed ? 'left-[calc(50%-1px)]' : 'left-[19px]', done && i < currentIdx ? 'bg-brand' : 'bg-line')}
                      />
                    )}
                    <NavLink
                      to={`/modules/${m.slug}`}
                      onClick={onNavigate}
                      title={collapsed ? m.title : undefined}
                      aria-current={active ? 'page' : undefined}
                      className={cn(
                        'group relative flex items-start gap-3 rounded-lg py-2 text-sm transition-colors',
                        collapsed ? 'justify-center px-0' : 'px-2',
                        active ? 'font-semibold text-ink' : 'text-ink-muted hover:text-ink',
                      )}
                    >
                      <span
                        className={cn(
                          'tabular relative z-10 mt-px grid h-[22px] w-[22px] shrink-0 place-items-center rounded-full border-2 text-[11px] font-semibold',
                          active ? 'border-brand bg-brand text-white' : done ? 'border-brand bg-surface text-brand-fg' : 'border-line bg-surface text-ink-muted group-hover:border-ink-subtle',
                        )}
                      >
                        {i + 1}
                      </span>
                      {!collapsed && (
                        <span className="min-w-0 leading-snug">
                          {m.title}
                          {m.status === 'draft' && <span className="ml-1.5 text-xs font-normal text-ink-subtle">(draft)</span>}
                        </span>
                      )}
                    </NavLink>
                  </li>
                );
              })}
            </ol>
          </section>
        )}

        {configuration.length > 0 && (
          <section aria-label={SECTION_LABEL.configuration} data-guide="config-nav">
            {heading(SECTION_LABEL.configuration)}
            <ul className="space-y-0.5">
              {configuration.map((m) => {
                const active = currentSlug === m.slug;
                return (
                  <li key={m._id}>
                    <NavLink
                      to={`/modules/${m.slug}`}
                      onClick={onNavigate}
                      title={collapsed ? m.title : undefined}
                      aria-current={active ? 'page' : undefined}
                      className={cn(
                        'flex items-start gap-3 rounded-lg py-2 text-sm transition-colors',
                        collapsed ? 'justify-center px-0' : 'px-2',
                        active ? 'bg-brand-soft font-semibold text-ink' : 'text-ink-muted hover:bg-surface-sunken hover:text-ink',
                      )}
                    >
                      <ModuleIcon name={m.icon} className={cn('mt-px h-[18px] w-[18px] shrink-0', active ? 'text-brand-fg' : 'text-ink-subtle')} />
                      {!collapsed && (
                        <span className="min-w-0 leading-snug">
                          {m.title}
                          {m.status === 'draft' && <span className="ml-1.5 text-xs font-normal text-ink-subtle">(draft)</span>}
                        </span>
                      )}
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </section>
        )}
      </nav>
    </div>
  );
}
