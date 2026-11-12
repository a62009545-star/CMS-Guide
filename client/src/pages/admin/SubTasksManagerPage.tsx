import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ExternalLink, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { del, errorMessage, get, patch, post } from '@/api/client';
import { useModules } from '@/api/queries';
import type { Page } from '@/api/types';
import { SortableList } from '@/components/editor/SortableList';
import { StatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input, Select } from '@/components/ui/Field';
import { Skeleton } from '@/components/ui/Skeleton';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useAuth } from '@/lib/auth';
import { formatDate } from '@/lib/utils';

interface Row {
  _id: string;
  title: string;
  slug: string;
  status: 'draft' | 'published';
  order: number;
  stepCount: number;
  updatedAt: string;
  updatedByName: string | null;
  hasPendingDraft: boolean;
  module: { _id: string; title: string; slug: string } | null;
}

export function SubTasksManagerPage() {
  useDocumentTitle('Sub-tasks');
  const [params, setParams] = useSearchParams();
  const moduleId = params.get('module') ?? '';
  const status = params.get('status') ?? '';
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const modules = useModules();
  const { isAdmin } = useAuth();
  const qc = useQueryClient();
  const confirm = useConfirm();
  const setParam = (k: string, v: string) => {
    const n = new URLSearchParams(params);
    if (v) n.set(k, v);
    else n.delete(k);
    setParams(n, { replace: true });
    setPage(1);
  };

  const list = useQuery({
    queryKey: ['admin', 'subtasks', moduleId, status, q, page],
    queryFn: () => get<Page<Row>>('/subtasks', { moduleId, status, q, page, limit: moduleId ? 100 : 20 }),
    placeholderData: keepPreviousData,
  });
  const [rows, setRows] = useState<(Row & { id: string })[]>([]);
  useEffect(() => setRows((list.data?.items ?? []).map((r) => ({ ...r, id: r._id }))), [list.data]);

  const reorder = useMutation({
    mutationFn: (ids: string[]) => post('/subtasks/reorder', { moduleId, ids }),
    onSuccess: () => toast.success('Order saved'),
    onError: (e) => toast.error(errorMessage(e)),
    onSettled: () => qc.invalidateQueries({ queryKey: ['admin', 'subtasks'] }),
  });
  const setStatus = useMutation({
    mutationFn: ({ id, s }: { id: string; s: string }) => patch(`/subtasks/${id}/status`, { status: s }),
    onSuccess: (_d, v) => {
      toast.success(v.s === 'published' ? 'Published' : 'Unpublished');
      qc.invalidateQueries();
    },
    onError: (e) => toast.error(errorMessage(e)),
  });
  const remove = useMutation({
    mutationFn: (id: string) => del(`/subtasks/${id}`),
    onSuccess: () => {
      toast.success('Sub-task deleted');
      qc.invalidateQueries();
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  const canDrag = isAdmin && !!moduleId && !status && !q;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Sub-tasks</h1>
          <p className="mt-1 text-sm text-ink-muted">{isAdmin ? 'Choose a module to drag its walkthroughs into order.' : 'Step-by-step walkthroughs for each module.'}</p>
        </div>
        <Link
          to={`/admin/subtasks/new${moduleId ? `?module=${moduleId}` : ''}`}
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-brand px-4 text-sm font-medium text-white hover:bg-brand-strong"
        >
          <Plus className="h-4 w-4" /> New sub-task
        </Link>
      </div>
      <div className="mb-4 grid gap-2 sm:grid-cols-[1fr_220px_200px]">
        <Input placeholder="Filter by title" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} aria-label="Filter by title" />
        <Select value={moduleId} onChange={(e) => setParam('module', e.target.value)} aria-label="Module">
          <option value="">All modules</option>
          {modules.data?.map((m) => (
            <option key={m._id} value={m._id}>
              {m.order}. {m.title}
            </option>
          ))}
        </Select>
        <Select value={status} onChange={(e) => setParam('status', e.target.value)} aria-label="Status">
          <option value="">Any status</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
          <option value="pending">Awaiting review</option>
        </Select>
      </div>

      {list.isLoading ? (
        <Skeleton className="h-72" />
      ) : rows.length === 0 ? (
        <EmptyState title="No sub-tasks match">Change the filters or create a new sub-task.</EmptyState>
      ) : (
        <SortableList
          items={rows}
          className="space-y-2"
          onReorder={(next) => {
            if (!canDrag) return toast.error(isAdmin ? 'Pick one module and clear other filters to reorder' : 'Only Admins can change the order');
            setRows(next);
            reorder.mutate(next.map((n) => n._id));
          }}
          render={(r, i, handle) => (
            <div className="card flex flex-wrap items-center gap-3 p-3 pr-4">
              {canDrag ? handle : <span className="w-1" />}
              {moduleId && <span className="tabular w-6 text-center text-sm font-semibold text-ink-muted">{i + 1}</span>}
              <div className="min-w-0 flex-1">
                <Link to={`/admin/subtasks/${r._id}`} className="font-medium hover:text-brand-fg">
                  {r.title}
                </Link>
                <p className="text-xs text-ink-muted">
                  {!moduleId && r.module ? `${r.module.title}, ` : ''}
                  {r.stepCount} steps, updated {formatDate(r.updatedAt)}
                  {r.updatedByName ? ` by ${r.updatedByName}` : ''}
                </p>
              </div>
              <StatusBadge status={r.status} pending={r.hasPendingDraft} />
              <div className="flex gap-1">
                {r.module && (
                  <Link to={`/modules/${r.module.slug}/${r.slug}`} className="grid h-8 w-8 place-items-center rounded-md text-ink-muted hover:bg-surface-sunken" aria-label={`View ${r.title}`}>
                    <ExternalLink className="h-4 w-4" />
                  </Link>
                )}
                <Link to={`/admin/subtasks/${r._id}`} className="inline-flex h-8 items-center rounded-md px-2.5 text-sm font-medium hover:bg-surface-sunken">
                  Edit
                </Link>
                {isAdmin && (
                  <Button size="sm" variant="ghost" onClick={() => setStatus.mutate({ id: r._id, s: r.status === 'published' && !r.hasPendingDraft ? 'draft' : 'published' })}>
                    {r.status === 'published' && !r.hasPendingDraft ? 'Unpublish' : 'Publish'}
                  </Button>
                )}
                {isAdmin && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-brand-fg"
                    onClick={async () => {
                      if (await confirm({ title: `Delete “${r.title}”?`, body: 'This removes the walkthrough for everyone. It cannot be undone.', confirmLabel: 'Delete sub-task', danger: true }))
                        remove.mutate(r._id);
                    }}
                  >
                    Delete
                  </Button>
                )}
              </div>
            </div>
          )}
        />
      )}
      {list.data && list.data.pages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm">
          <Button size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Previous
          </Button>
          <span className="tabular text-ink-muted">
            Page {list.data.page} of {list.data.pages}
          </span>
          <Button size="sm" disabled={page >= list.data.pages} onClick={() => setPage((p) => p + 1)}>
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
