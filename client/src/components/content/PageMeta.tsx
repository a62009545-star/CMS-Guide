import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Bookmark, BookmarkCheck, Eye, EyeOff, Pencil } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { errorMessage, patch, post } from '@/api/client';
import { qk } from '@/api/queries';
import { StatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useGuide } from '@/components/guide/Guide';
import { useAuth } from '@/lib/auth';
import { cn, formatDateTime } from '@/lib/utils';

export function LastUpdated({ name, at }: { name: string | null; at: string }) {
  return (
    <p className="mt-12 border-t border-line pt-5 text-sm text-ink-muted">
      Last updated by <span className="font-medium text-ink">{name ?? 'Unknown'}</span> on {formatDateTime(at)}
    </p>
  );
}

export function BookmarkButton({ entityType, entityId }: { entityType: 'module' | 'subtask'; entityId: string }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { cue } = useGuide();
  const on = !!user?.bookmarks?.some((b) => b.entityType === entityType && String(b.entityId) === entityId);
  const m = useMutation({
    mutationFn: () => post<{ bookmarked: boolean }>('/auth/me/bookmarks', { entityType, entityId }),
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: qk.me });
      qc.invalidateQueries({ queryKey: qk.bookmarks });
      toast.success(r.bookmarked ? 'Bookmarked' : 'Bookmark removed');
      cue(r.bookmarked ? 'heart' : 'wink');
    },
    onError: (e) => toast.error(errorMessage(e)),
  });
  const I = on ? BookmarkCheck : Bookmark;
  return (
    <Button data-guide="bookmark" size="sm" variant="secondary" onClick={() => m.mutate()} loading={m.isPending} aria-pressed={on}>
      <I className={cn('h-4 w-4', on && 'text-brand-fg')} aria-hidden />
      {on ? 'Bookmarked' : 'Bookmark'}
    </Button>
  );
}

interface StaffBarProps {
  entityType: 'module' | 'subtask';
  id: string;
  status: 'draft' | 'published';
  hasPendingDraft: boolean;
  pendingDraftByName: string | null;
  isPreview: boolean;
  editPath: string;
}

/** Shown to Editors and Admins only: status, draft preview toggle, publish and edit actions. */
export function StaffBar({ entityType, id, status, hasPendingDraft, pendingDraftByName, isPreview, editPath }: StaffBarProps) {
  const { isStaff, isAdmin } = useAuth();
  const [params, setParams] = useSearchParams();
  const qc = useQueryClient();
  const publish = useMutation({
    mutationFn: (s: 'draft' | 'published') => patch(`/${entityType === 'module' ? 'modules' : 'subtasks'}/${id}/status`, { status: s }),
    onSuccess: (_d, s) => {
      toast.success(s === 'published' ? 'Published' : 'Unpublished');
      qc.invalidateQueries();
      if (params.get('preview')) setParams({}, { replace: true });
    },
    onError: (e) => toast.error(errorMessage(e)),
  });
  if (!isStaff) return null;
  const previewing = params.get('preview') === '1';
  return (
    <div data-staff-only className="mb-6 flex flex-wrap items-center gap-2 rounded-card border border-dashed border-line bg-surface px-3 py-2">
      <StatusBadge status={status} pending={hasPendingDraft} />
      {isPreview && <span className="text-xs text-ink-muted">Previewing changes from {pendingDraftByName ?? 'an editor'}</span>}
      <div className="ml-auto flex flex-wrap gap-2">
        {hasPendingDraft && (
          <Button size="sm" variant="ghost" onClick={() => setParams(previewing ? {} : { preview: '1' }, { replace: true })}>
            {previewing ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {previewing ? 'Show live version' : 'Preview pending changes'}
          </Button>
        )}
        {isAdmin && (status === 'draft' || hasPendingDraft) && (
          <Button size="sm" variant="primary" loading={publish.isPending} onClick={() => publish.mutate('published')}>
            Publish
          </Button>
        )}
        {isAdmin && status === 'published' && !hasPendingDraft && (
          <Button size="sm" variant="ghost" loading={publish.isPending} onClick={() => publish.mutate('draft')}>
            Unpublish
          </Button>
        )}
        <Link to={editPath} className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-line bg-surface px-3 text-sm font-medium hover:bg-surface-sunken">
          <Pencil className="h-4 w-4" aria-hidden />
          Edit
        </Link>
      </div>
    </div>
  );
}

/** Small inline "Edit" link placed next to a section heading, for staff only. */
export function SectionEdit({ to, label }: { to: string; label: string }) {
  const { isStaff } = useAuth();
  if (!isStaff) return null;
  return (
    <Link data-staff-only to={to} className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-ink-muted hover:bg-surface-sunken hover:text-ink" aria-label={label}>
      <Pencil className="h-3.5 w-3.5" aria-hidden />
      Edit
    </Link>
  );
}
