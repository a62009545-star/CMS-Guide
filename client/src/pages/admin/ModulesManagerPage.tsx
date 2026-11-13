import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ExternalLink, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { SECTION_LABEL, modulePath, type Section } from '@cms/shared';
import { del, errorMessage, patch, post } from '@/api/client';
import { qk, useModules } from '@/api/queries';
import type { ModuleListItem } from '@/api/types';
import { SortableList } from '@/components/editor/SortableList';
import { StatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import { ModuleIcon } from '@/components/ui/Icon';
import { Skeleton } from '@/components/ui/Skeleton';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useAuth } from '@/lib/auth';
import { formatDate } from '@/lib/utils';

export function ModulesManagerPage({ section = 'lifecycle' }: { section?: Section }) {
  const isConfig = section === 'configuration';
  useDocumentTitle(isConfig ? SECTION_LABEL.configuration : 'Modules');
  const { data, isLoading } = useModules();
  const { isAdmin } = useAuth();
  const qc = useQueryClient();
  const confirm = useConfirm();
  const [items, setItems] = useState<(ModuleListItem & { id: string })[]>([]);
  useEffect(() => setItems((data ?? []).map((m) => ({ ...m, id: m._id }))), [data]);

  const reorder = useMutation({
    mutationFn: (ids: string[]) => post('/modules/reorder', { ids }),
    onSuccess: () => toast.success('Module order saved'),
    onError: (e) => {
      toast.error(errorMessage(e));
      qc.invalidateQueries({ queryKey: qk.modules });
    },
    onSettled: () => qc.invalidateQueries({ queryKey: qk.modules }),
  });
  const setStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => patch(`/modules/${id}/status`, { status }),
    onSuccess: (_d, v) => {
      toast.success(v.status === 'published' ? 'Published' : 'Unpublished');
      qc.invalidateQueries();
    },
    onError: (e) => toast.error(errorMessage(e)),
  });
  const remove = useMutation({
    mutationFn: (id: string) => del(`/modules/${id}`),
    onSuccess: () => {
      toast.success('Module deleted');
      qc.invalidateQueries();
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  const renderSection = (section: Section) => {
    const list = items.filter((m) => (m.section ?? 'lifecycle') === section);
    return (
      <section key={section} aria-labelledby={`sec-${section}`} className="mb-10">
        <h2 id={`sec-${section}`} className="sr-only">{SECTION_LABEL[section]}</h2>
        {list.length === 0 ? (
          <p className="text-sm text-ink-muted">Nothing here yet.</p>
        ) : (
            <SortableList
              items={list}
              className="space-y-2"
              onReorder={(next) => {
                if (!isAdmin) return toast.error('Only Admins can change the order');
                setItems((all) => [...all.filter((x) => (x.section ?? 'lifecycle') !== section), ...next]);
                reorder.mutate(next.map((n) => n._id));
              }}
              render={(m, i, handle) => (
                <div className="card flex flex-wrap items-center gap-3 p-3 pr-4">
                  {isAdmin ? handle : <span className="w-6" />}
                  <span className="tabular w-6 text-center text-sm font-semibold text-ink-muted">{i + 1}</span>
                  <ModuleIcon name={m.icon} className="h-5 w-5 text-ink-muted" />
                  <div className="min-w-0 flex-1">
                    <Link to={`/admin/modules/${m._id}`} className="font-medium hover:text-brand-fg">
                      {m.title}
                    </Link>
                    <p className="text-xs text-ink-muted">
                      {m.subTaskCount} sub-tasks, updated {formatDate(m.updatedAt)}
                      {m.updatedByName ? ` by ${m.updatedByName}` : ''}
                    </p>
                  </div>
                  <StatusBadge status={m.status} pending={m.hasPendingDraft} />
                  <div className="flex gap-1">
                    <Link to={modulePath(m.section, m.slug)} className="grid h-8 w-8 place-items-center rounded-md text-ink-muted hover:bg-surface-sunken" aria-label={`View ${m.title}`}>
                      <ExternalLink className="h-4 w-4" />
                    </Link>
                    <Link to={`/admin/modules/${m._id}`} className="inline-flex h-8 items-center rounded-md px-2.5 text-sm font-medium hover:bg-surface-sunken">
                      Edit
                    </Link>
                    {isAdmin && (
                      <Button size="sm" variant="ghost" onClick={() => setStatus.mutate({ id: m._id, status: m.status === 'published' && !m.hasPendingDraft ? 'draft' : 'published' })}>
                        {m.status === 'published' && !m.hasPendingDraft ? 'Unpublish' : 'Publish'}
                      </Button>
                    )}
                    {isAdmin && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-brand-fg"
                        onClick={async () => {
                          const ok = await confirm({
                            title: `Delete “${m.title}”?`,
                            body: `This removes the module and its ${m.subTaskCount} sub-tasks for everyone. It cannot be undone.`,
                            confirmLabel: 'Delete module',
                            danger: true,
                          });
                          if (ok) remove.mutate(m._id);
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
      </section>
    );
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{isConfig ? SECTION_LABEL.configuration : 'Modules'}</h1>
          <p className="mt-1 text-sm text-ink-muted">{isConfig ? 'Topics about using CHM itself, shown in their own area of the guide.' : 'The stages of the CMS lifecycle.'}{isAdmin ? ' Drag to change the order.' : ''}</p>
        </div>
        <Link to={`/admin/modules/new?section=${section}`} className="inline-flex h-10 items-center gap-2 rounded-lg bg-brand px-4 text-sm font-medium text-white hover:bg-brand-strong">
          <Plus className="h-4 w-4" /> {isConfig ? 'New topic' : 'New module'}
        </Link>
      </div>
      {isLoading ? (
        <Skeleton className="h-80" />
      ) : (
        renderSection(section)
      )}
    </div>
  );
}
