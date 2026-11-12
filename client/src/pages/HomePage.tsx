import { ArrowUpRight, Bookmark, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { get } from '@/api/client';
import { qk, useActivity, useModules } from '@/api/queries';
import { LifecycleRoute } from '@/components/content/LifecycleRoute';
import { ErrorState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useAuth } from '@/lib/auth';
import { actionLabel, timeAgo } from '@/lib/utils';

export function HomePage() {
  useDocumentTitle();
  const { user } = useAuth();
  const modules = useModules();
  const activity = useActivity(8);
  const bookmarks = useQuery({
    queryKey: qk.bookmarks,
    queryFn: () => get<{ items: { _id: string; title: string; path: string; moduleTitle?: string; type: string }[] }>('/auth/me/bookmarks'),
  });
  const first = user?.name.split(' ')[0];

  return (
    <div>
      <section className="border-b border-line bg-surface">
        <div className="mx-auto max-w-7xl px-4 pb-10 pt-10 sm:px-8 sm:pt-14">
          <p className="text-sm text-ink-muted">{first ? `Welcome back, ${first}` : 'Welcome'}</p>
          <h1 className="mt-2 max-w-3xl text-3xl font-bold sm:text-4xl">How a change moves through CMS, from plan to closure</h1>
          <p className="mt-3 max-w-2xl text-ink-muted">
            Seven stages, in order. Open any stage to see what it does, who is involved, the rules that apply and step-by-step walkthroughs.
          </p>
          <div className="mt-10">
            {modules.isLoading ? (
              <div className="grid gap-3 lg:grid-cols-7">
                {Array.from({ length: 7 }, (_, i) => (
                  <Skeleton key={i} className="h-36" />
                ))}
              </div>
            ) : modules.error ? (
              <ErrorState message="The lifecycle could not be loaded." onRetry={() => modules.refetch()} />
            ) : (
              <LifecycleRoute modules={modules.data ?? []} />
            )}
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-10 sm:px-8 lg:grid-cols-[1fr_340px]">
        <section className="card" aria-labelledby="recent-h">
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <h2 id="recent-h" className="font-semibold">Recently updated</h2>
          </div>
          <ul className="divide-y divide-line">
            {activity.isLoading &&
              Array.from({ length: 4 }, (_, i) => (
                <li key={i} className="px-5 py-4">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="mt-2 h-3 w-1/3" />
                </li>
              ))}
            {activity.data?.items.length === 0 && <li className="px-5 py-8 text-center text-sm text-ink-muted">Nothing has changed yet.</li>}
            {activity.data?.items.map((a) => (
              <li key={a._id}>
                {a.path && a.action !== 'delete' ? (
                  <Link to={a.path} className="flex items-start justify-between gap-4 px-5 py-3.5 hover:bg-surface-sunken">
                    <span>
                      <span className="block font-medium">{a.entityTitle}</span>
                      <span className="block text-sm text-ink-muted">
                        {a.userName} {actionLabel[a.action] ?? a.action} this {a.entityType === 'subtask' ? 'walkthrough' : 'module'}
                      </span>
                    </span>
                    <span className="shrink-0 pt-0.5 text-xs text-ink-muted">{timeAgo(a.timestamp)}</span>
                  </Link>
                ) : (
                  <div className="px-5 py-3.5 text-sm text-ink-muted">
                    {a.userName} {actionLabel[a.action]} {a.entityTitle}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </section>

        <aside className="space-y-6">
          <section className="card p-5" aria-labelledby="quick-h">
            <h2 id="quick-h" className="font-semibold">Quick links</h2>
            <ul className="mt-3 space-y-1">
              {modules.data?.[0] && (
                <li>
                  <Link to={`/modules/${modules.data[0].slug}`} className="flex items-center justify-between rounded-md px-2 py-2 text-sm hover:bg-surface-sunken">
                    Start with stage 1: {modules.data[0].title}
                    <ArrowUpRight className="h-4 w-4 text-ink-subtle" />
                  </Link>
                </li>
              )}
              <li>
                <Link to="/search" className="flex items-center justify-between rounded-md px-2 py-2 text-sm hover:bg-surface-sunken">
                  Search every step and guideline
                  <Search className="h-4 w-4 text-ink-subtle" />
                </Link>
              </li>
              <li>
                <Link to="/bookmarks" className="flex items-center justify-between rounded-md px-2 py-2 text-sm hover:bg-surface-sunken">
                  Your bookmarks
                  <Bookmark className="h-4 w-4 text-ink-subtle" />
                </Link>
              </li>
            </ul>
          </section>
          <section className="card p-5" aria-labelledby="bm-h">
            <h2 id="bm-h" className="font-semibold">Bookmarked</h2>
            {bookmarks.data?.items.length ? (
              <ul className="mt-3 space-y-1">
                {bookmarks.data.items.slice(0, 5).map((b) => (
                  <li key={b._id}>
                    <Link to={b.path} className="block rounded-md px-2 py-2 hover:bg-surface-sunken">
                      <span className="block text-sm font-medium">{b.title}</span>
                      {b.moduleTitle && <span className="block text-xs text-ink-muted">{b.moduleTitle}</span>}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-ink-muted">Bookmark a module or walkthrough to keep it here.</p>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}
