import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { useModules } from '@/api/queries';
import { Skeleton } from '@/components/ui/Skeleton';
import { cn } from '@/lib/utils';

/**
 * Module navigation drawn as the lifecycle route: one line through seven stations. Stations up to
 * the module you are reading are filled red, so the sidebar also shows where you are in the flow.
 */
export function Sidebar({ collapsed, onToggle, onNavigate }: { collapsed: boolean; onToggle?: () => void; onNavigate?: () => void }) {
  const { data: modules, isLoading } = useModules();
  const { pathname } = useLocation();
  const currentSlug = pathname.startsWith('/modules/') ? pathname.split('/')[2] : null;
  const currentIdx = modules?.findIndex((m) => m.slug === currentSlug) ?? -1;

  return (
    <div className="flex h-full flex-col">
      <div className={cn('flex items-center px-4 pb-2 pt-5', collapsed ? 'justify-center px-2' : 'justify-between')}>
        {!collapsed && <p className="text-xs font-semibold text-ink-muted">CMS lifecycle</p>}
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
      <nav aria-label="Modules" className="min-h-0 flex-1 overflow-y-auto px-3 pb-6">
        {isLoading && (
          <div className="space-y-4 px-2 pt-2">
            {Array.from({ length: 7 }, (_, i) => (
              <Skeleton key={i} className="h-5" />
            ))}
          </div>
        )}
        <ol className="relative">
          {modules?.map((m, i) => {
            const done = currentIdx >= 0 && i <= currentIdx;
            const isLast = i === modules.length - 1;
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
                  className={({ isActive }) =>
                    cn(
                      'group relative flex items-start gap-3 rounded-lg py-2 text-sm transition-colors',
                      collapsed ? 'justify-center px-0' : 'px-2',
                      isActive || currentSlug === m.slug ? 'font-semibold text-ink' : 'text-ink-muted hover:text-ink',
                    )
                  }
                >
                  <span
                    className={cn(
                      'tabular relative z-10 mt-px grid h-[22px] w-[22px] shrink-0 place-items-center rounded-full border-2 text-[11px] font-semibold',
                      currentSlug === m.slug
                        ? 'border-brand bg-brand text-white'
                        : done
                          ? 'border-brand bg-surface text-brand-fg'
                          : 'border-line bg-surface text-ink-muted group-hover:border-ink-subtle',
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
      </nav>
    </div>
  );
}
