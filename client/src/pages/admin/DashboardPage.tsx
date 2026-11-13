import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { withPreview } from '@cms/shared';
import { get } from '@/api/client';
import type { AuditEntry } from '@/api/types';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { actionLabel, timeAgo } from '@/lib/utils';

interface Stats {
  counts: Record<'modules' | 'subTasks' | 'media' | 'users', Record<string, number>>;
  recent: AuditEntry[];
  pending: { type: string; _id: string; title: string; moduleTitle?: string; status: string; pendingReview: boolean; updatedAt: string; path: string }[];
}

const sum = (o: Record<string, number> = {}) => Object.values(o).reduce((a, b) => a + b, 0);

export function DashboardPage() {
  useDocumentTitle('Admin');
  const { data, isLoading } = useQuery({ queryKey: ['admin', 'stats'], queryFn: () => get<Stats>('/stats/dashboard') });

  const tiles = data
    ? [
        { label: 'Modules', value: sum(data.counts.modules), sub: `${data.counts.modules.draft ?? 0} in draft`, to: '/admin/modules' },
        { label: 'Sub-tasks', value: sum(data.counts.subTasks), sub: `${data.counts.subTasks.draft ?? 0} in draft`, to: '/admin/subtasks' },
        { label: 'Media items', value: sum(data.counts.media), sub: `${data.counts.media.video ?? 0} videos, ${data.counts.media.embed ?? 0} links`, to: '/admin/media' },
        { label: 'People', value: sum(data.counts.users), sub: `${data.counts.users.admin ?? 0} admins, ${data.counts.users.editor ?? 0} editors`, to: '/admin/users' },
      ]
    : [];

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {isLoading
          ? Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-28" />)
          : tiles.map((t) => (
              <Link key={t.label} to={t.to} className="card p-5 hover:border-ink-subtle">
                <p className="text-sm text-ink-muted">{t.label}</p>
                <p className="tabular mt-1 text-3xl font-semibold">{t.value}</p>
                <p className="mt-1 text-xs text-ink-muted">{t.sub}</p>
              </Link>
            ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card" aria-labelledby="pending-h">
          <h2 id="pending-h" className="border-b border-line px-5 py-4 font-semibold">
            Waiting to be published
          </h2>
          {isLoading ? (
            <div className="space-y-3 p-5">
              <Skeleton className="h-10" />
              <Skeleton className="h-10" />
            </div>
          ) : !data?.pending.length ? (
            <div className="p-5">
              <EmptyState title="Everything is published">Drafts and changes awaiting review will appear here.</EmptyState>
            </div>
          ) : (
            <ul className="divide-y divide-line">
              {data.pending.map((p) => (
                <li key={p._id}>
                  <Link to={withPreview(p.path, p.pendingReview)} className="flex items-start justify-between gap-3 px-5 py-3.5 hover:bg-surface-sunken">
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{p.title}</span>
                      <span className="block text-xs text-ink-muted">
                        {p.type === 'module' ? 'Module' : p.moduleTitle} — {timeAgo(p.updatedAt)}
                      </span>
                    </span>
                    {p.pendingReview ? <Badge tone="warning">Review</Badge> : <Badge>Draft</Badge>}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card" aria-labelledby="edits-h">
          <h2 id="edits-h" className="border-b border-line px-5 py-4 font-semibold">
            Recent edits
          </h2>
          <ul className="divide-y divide-line">
            {data?.recent.map((r) => (
              <li key={r._id} className="flex items-start justify-between gap-3 px-5 py-3 text-sm">
                <span>
                  <span className="font-medium">{r.userName}</span> {actionLabel[r.action]}{' '}
                  {r.path && r.action !== 'delete' ? (
                    <Link to={r.path} className="font-medium text-brand-fg hover:underline">
                      {r.entityTitle}
                    </Link>
                  ) : (
                    <span className="font-medium">{r.entityTitle}</span>
                  )}
                </span>
                <span className="shrink-0 text-xs text-ink-muted">{timeAgo(r.timestamp)}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
