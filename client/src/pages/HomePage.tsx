import { useQuery } from '@tanstack/react-query';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { modulePath } from '@cms/shared';
import { get } from '@/api/client';
import { qk, useActivity, useModuleSections } from '@/api/queries';
import { AirtelMark } from '@/components/brand/AirtelMark';
import { NetworkBackdrop, RouteEdge } from '@/components/brand/NetworkBackdrop';
import { HeroSearch } from '@/components/content/HeroSearch';
import { Skeleton } from '@/components/ui/Skeleton';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useAuth } from '@/lib/auth';
import { actionLabel, cn, timeAgo } from '@/lib/utils';

export function HomePage() {
  useDocumentTitle();
  const { isStaff } = useAuth();
  const modules = useModuleSections();
  const activity = useActivity(6);
  const bookmarks = useQuery({
    queryKey: qk.bookmarks,
    queryFn: () => get<{ items: { _id: string; title: string; path: string; moduleTitle?: string; type: string }[] }>('/auth/me/bookmarks'),
  });

  return (
    <div>
      {/* Hero: one job, find the answer */}
      <section className="relative border-b border-line bg-surface">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <NetworkBackdrop className="absolute inset-0 h-full w-full" />
        </div>
        <div className="relative mx-auto max-w-4xl px-4 pb-14 pt-14 text-center sm:px-8 sm:pb-16 sm:pt-20">
          <AirtelMark className="mx-auto h-12 w-12 text-brand" title="Airtel" />
          <h1 className="mx-auto mt-6 max-w-3xl [text-wrap:balance] text-[2.125rem] font-bold leading-[1.1] tracking-[-0.03em] sm:text-[3.25rem]">How the CRQ journey works in CMS</h1>
          <p className="mx-auto mt-4 max-w-xl text-ink-muted sm:text-lg">Follow a change request from plan to closure, step by step, or search for the task you need.</p>
          <div className="mt-9">
            <HeroSearch />
          </div>
        </div>
        <RouteEdge className="relative -mb-3 px-6 sm:px-12" />
      </section>

      <div className="mx-auto max-w-6xl px-4 pb-12 sm:px-8">
        {/* What changed, and what you saved */}
        <div className="mt-14 grid gap-10 md:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr]">
          <section aria-labelledby="recent-h" data-guide="recent">
            <h2 id="recent-h" className="text-lg font-semibold">
              Recently updated
            </h2>
            <ul className="mt-3 divide-y divide-line border-y border-line">
              {activity.isLoading &&
                Array.from({ length: 3 }, (_, i) => (
                  <li key={i} className="py-4">
                    <Skeleton className="h-4 w-2/3" />
                  </li>
                ))}
              {activity.data?.items.length === 0 && <li className="py-6 text-sm text-ink-muted">Nothing has changed yet.</li>}
              {activity.data?.items.map((a) =>
                a.path && a.action !== 'delete' ? (
                  <li key={a._id}>
                    <Link to={a.path} className="group flex items-baseline justify-between gap-4 py-3.5">
                      <span className="min-w-0">
                        <span className="font-medium group-hover:text-brand-fg">{a.entityTitle}</span>
                        <span className="ml-2 text-sm text-ink-muted">
                          {actionLabel[a.action] ?? a.action} by {a.userName}
                        </span>
                      </span>
                      <span className="shrink-0 text-xs text-ink-muted">{timeAgo(a.timestamp)}</span>
                    </Link>
                  </li>
                ) : null,
              )}
            </ul>
          </section>

          <section aria-labelledby="bm-h" data-guide="bookmarked">
            <h2 id="bm-h" className="text-lg font-semibold">
              Your bookmarks
            </h2>
            {bookmarks.data?.items.length ? (
              <ul className="mt-3 space-y-1">
                {bookmarks.data.items.slice(0, 6).map((b) => (
                  <li key={b._id}>
                    <Link to={b.path} className="group block rounded-lg py-2">
                      <span className="block font-medium group-hover:text-brand-fg">{b.title}</span>
                      {b.moduleTitle && <span className="block text-xs text-ink-muted">{b.moduleTitle}</span>}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className={cn('mt-3 text-sm text-ink-muted')}>Bookmark a stage, topic or walkthrough and it appears here.</p>
            )}
          </section>

          <section aria-labelledby="quick-h" data-guide="quick-links">
            <h2 id="quick-h" className="text-lg font-semibold">
              Quick links
            </h2>
            <ul className="mt-3 space-y-1">
              {[
                modules.lifecycle[0] && { to: modulePath('lifecycle', modules.lifecycle[0].slug), label: `Stage 1: ${modules.lifecycle[0].title}` },
                { to: '/lifecycle', label: 'All seven lifecycle stages' },
                modules.configuration[0] && { to: modulePath('configuration', modules.configuration[0].slug), label: modules.configuration[0].title },
                { to: '/configuration', label: 'Configuration & management' },
                { to: '/search', label: 'Search the whole guide' },
                { to: '/bookmarks', label: 'All your bookmarks' },
                isStaff && { to: '/admin', label: 'Admin dashboard' },
              ]
                .filter((l): l is { to: string; label: string } => Boolean(l))
                .map((l) => (
                  <li key={l.to}>
                    <Link to={l.to} className="group flex items-center justify-between gap-3 rounded-lg py-2">
                      <span className="font-medium group-hover:text-brand-fg">{l.label}</span>
                      <ArrowRight className="h-4 w-4 shrink-0 text-ink-subtle group-hover:text-brand-fg" aria-hidden />
                    </Link>
                  </li>
                ))}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
