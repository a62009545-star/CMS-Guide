import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { diffLines } from 'diff';
import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { errorMessage, get, post } from '@/api/client';
import type { Version } from '@/api/types';
import { Button } from '@/components/ui/Button';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useAuth } from '@/lib/auth';
import { cn, formatDateTime, timeAgo } from '@/lib/utils';

const fieldLabel: Record<string, string> = {
  title: 'title',
  slug: 'address',
  icon: 'icon',
  summary: 'summary',
  e2eContent: 'how it works',
  flowSteps: 'process flow',
  heroMedia: 'hero media',
  guidelines: 'guidelines',
  faqs: 'FAQs',
  moduleId: 'module',
  prerequisites: 'prerequisites',
  expectedOutcome: 'expected outcome',
  steps: 'steps',
  relatedSubTaskIds: 'related sub-tasks',
};

function htmlText(html: string) {
  const doc = new DOMParser().parseFromString(html.replace(/<\/(p|h\d|li|tr|div|blockquote)>/g, '$&\n'), 'text/html');
  return (doc.body.textContent ?? '').replace(/\n{3,}/g, '\n\n').trim();
}

/** Readable plain-text rendering of a snapshot, so diffs read like a document. */
function snapshotText(s: Record<string, any> | undefined): string {
  if (!s) return '';
  const out: string[] = [`Title: ${s.title}`, `Address: ${s.slug}`, `Summary: ${s.summary}`];
  if (s.icon) out.push(`Icon: ${s.icon}`);
  if ('heroMedia' in s) out.push(`Hero media: ${s.heroMedia ?? 'none'}`);
  if (s.e2eContent) out.push('', 'How it works:', htmlText(s.e2eContent.html ?? ''));
  (s.flowSteps ?? []).forEach((f: any, i: number) => out.push(i === 0 ? '\nProcess flow:' : '', `${i + 1}. ${f.title}: ${f.description}`.trim()));
  (s.guidelines ?? []).forEach((g: any, i: number) => out.push(i === 0 ? '\nGuidelines:' : '', `[${g.type}] ${g.text}`));
  (s.faqs ?? []).forEach((f: any, i: number) => out.push(i === 0 ? '\nFAQs:' : '', `Q: ${f.q}`, `A: ${f.a}`));
  if (s.prerequisites) out.push('', 'Prerequisites:', ...s.prerequisites.map((p: string) => `- ${p}`));
  if (s.expectedOutcome !== undefined) out.push('', `Expected outcome: ${s.expectedOutcome}`);
  (s.steps ?? []).forEach((st: any, i: number) => {
    out.push('', `Step ${i + 1}: ${st.title}`, htmlText(st.content?.html ?? ''));
    if (st.media?.length) out.push(`Media: ${st.media.length} item(s) [${st.media.join(', ')}]`);
    if (st.callout?.text) out.push(`Callout (${st.callout.type}): ${st.callout.text}`);
  });
  if (s.relatedSubTaskIds) out.push('', `Related sub-tasks: ${s.relatedSubTaskIds.length}`);
  return out.filter((l) => l !== '').join('\n') + '\n';
}

function Diff({ from, to }: { from?: Record<string, unknown>; to?: Record<string, unknown> }) {
  const parts = useMemo(() => diffLines(snapshotText(from), snapshotText(to)), [from, to]);
  const changed = parts.some((p) => p.added || p.removed);
  if (!changed) return <p className="p-4 text-sm text-ink-muted">No visible differences.</p>;
  return (
    <pre className="overflow-x-auto whitespace-pre-wrap break-words p-4 font-sans text-sm leading-6">
      {parts.map((p, i) => (
        <span
          key={i}
          className={cn(p.added && 'block bg-success/15 text-ink', p.removed && 'block bg-brand/10 text-ink line-through decoration-brand/40', !p.added && !p.removed && 'block text-ink-muted')}
        >
          {p.value
            .replace(/\n$/, '')
            .split('\n')
            .map((line, j) => (
              <span key={j} className="block pl-5 -indent-5">
                <span aria-hidden className="inline-block w-5 select-none indent-0 text-ink-subtle">{p.added ? '+' : p.removed ? '−' : ' '}</span>
                {line}
              </span>
            ))}
        </span>
      ))}
    </pre>
  );
}

export function EntityHistoryPage() {
  const { entityType = '', entityId = '' } = useParams();
  const { isAdmin } = useAuth();
  const qc = useQueryClient();
  const confirm = useConfirm();
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'versions', entityType, entityId],
    queryFn: () => get<{ items: Version[] }>(`/versions/${entityType}/${entityId}`),
  });
  const items = data?.items ?? [];
  const [selId, setSelId] = useState<string | null>(null);
  const [compareId, setCompareId] = useState<string | null>(null);
  useEffect(() => {
    if (items.length && !selId) setSelId(items[0]._id);
  }, [items, selId]);
  const selIdx = items.findIndex((v) => v._id === selId);
  const sel = items[selIdx];
  const base = compareId ? items.find((v) => v._id === compareId) : items[selIdx + 1];
  const title = (items[0]?.snapshot as { title?: string } | undefined)?.title ?? 'Content';
  useDocumentTitle(`History: ${title}`);

  const restore = useMutation({
    mutationFn: (id: string) => post(`/versions/${id}/restore`),
    onSuccess: () => {
      toast.success('Version restored');
      qc.invalidateQueries();
      setSelId(null);
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  if (isLoading) return <Skeleton className="h-96" />;
  return (
    <div>
      <Link to={`/admin/${entityType === 'module' ? 'modules' : 'subtasks'}/${entityId}`} className="text-sm text-ink-muted hover:text-ink">
        ‹ Back to editor
      </Link>
      <h1 className="mt-2 text-2xl font-bold">Version history: {title}</h1>
      {items.length === 0 ? (
        <EmptyState title="No versions yet" />
      ) : (
        <div className="mt-6 grid gap-6 lg:grid-cols-[300px_1fr]">
          <ol className="card max-h-[70vh] divide-y divide-line overflow-y-auto">
            {items.map((v, i) => (
              <li key={v._id}>
                <button onClick={() => { setSelId(v._id); setCompareId(null); }} className={cn('block w-full px-4 py-3 text-left', v._id === selId ? 'bg-brand-soft' : 'hover:bg-surface-sunken')} aria-current={v._id === selId}>
                  <span className="flex items-center justify-between text-sm">
                    <span className="tabular font-semibold">Version {v.versionNumber}</span>
                    {i === 0 && <span className="text-xs text-ink-muted">Latest</span>}
                  </span>
                  <span className="mt-0.5 block text-xs text-ink-muted">
                    {v.changedByName}, {timeAgo(v.changedAt)}
                  </span>
                  {v.changeNote && <span className="mt-1 block text-sm">{v.changeNote}</span>}
                  {v.changedFields.length > 0 && v.versionNumber > 1 && (
                    <span className="mt-1 block text-xs text-ink-muted">Changed {v.changedFields.map((f) => fieldLabel[f] ?? f).join(', ')}</span>
                  )}
                </button>
              </li>
            ))}
          </ol>
          {sel && (
            <div className="card min-w-0">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3">
                <div className="text-sm">
                  <p className="font-semibold">
                    Version {sel.versionNumber} by {sel.changedByName}
                  </p>
                  <p className="text-ink-muted">{formatDateTime(sel.changedAt)}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <label className="text-sm text-ink-muted" htmlFor="cmp">
                    Compare with
                  </label>
                  <select id="cmp" className="input h-9 w-auto" value={base?._id ?? ''} onChange={(e) => setCompareId(e.target.value || null)}>
                    <option value="">Nothing (first version)</option>
                    {items
                      .filter((v) => v._id !== sel._id)
                      .map((v) => (
                        <option key={v._id} value={v._id}>
                          Version {v.versionNumber}
                        </option>
                      ))}
                  </select>
                  {isAdmin && selIdx > 0 && (
                    <Button
                      size="sm"
                      variant="primary"
                      loading={restore.isPending}
                      onClick={async () => {
                        if (await confirm({ title: `Restore version ${sel.versionNumber}?`, body: 'The current content is kept as a version, so you can undo this.', confirmLabel: 'Restore version' }))
                          restore.mutate(sel._id);
                      }}
                    >
                      Restore this version
                    </Button>
                  )}
                </div>
              </div>
              <p className="border-b border-line px-4 py-2 text-xs text-ink-muted">
                {base ? `Showing changes from version ${base.versionNumber} to version ${sel.versionNumber}.` : `Showing version ${sel.versionNumber} in full.`}
              </p>
              <Diff from={base?.snapshot} to={sel.snapshot} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function VersionHistoryPage() {
  useDocumentTitle('Version history');
  const { data, isLoading } = useQuery({ queryKey: ['admin', 'versions'], queryFn: () => get<{ items: Version[] }>('/versions', { limit: 60 }) });
  return (
    <div>
      <h1 className="text-2xl font-bold">Version history</h1>
      <p className="mt-1 text-sm text-ink-muted">Every save creates a version. Open one to compare it with earlier versions or restore it.</p>
      {isLoading ? (
        <Skeleton className="mt-6 h-96" />
      ) : (
        <ul className="card mt-6 divide-y divide-line">
          {data?.items.map((v) => (
            <li key={v._id}>
              <Link to={`/admin/versions/${v.entityType}/${v.entityId}`} className="flex flex-wrap items-start justify-between gap-3 px-4 py-3 hover:bg-surface-sunken">
                <span>
                  <span className="block font-medium">{v.entityTitle}</span>
                  <span className="block text-xs text-ink-muted">
                    {v.entityType === 'module' ? 'Module' : 'Sub-task'}, version {v.versionNumber}
                    {v.changeNote ? `: ${v.changeNote}` : ''}
                  </span>
                </span>
                <span className="text-right text-xs text-ink-muted">
                  {v.changedByName}
                  <br />
                  {formatDateTime(v.changedAt)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
