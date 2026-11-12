import { History, Plus, Trash2 } from 'lucide-react';
import { useEffect, type ReactNode } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import type { ZodError } from 'zod';
import { StatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Field';
import { useAuth } from '@/lib/auth';
import { formatDateTime } from '@/lib/utils';

export type Errors = Record<string, string>;

export function zodErrors(err: ZodError): Errors {
  const out: Errors = {};
  for (const i of err.issues) {
    const k = i.path.join('.');
    if (!out[k]) out[k] = i.message;
  }
  return out;
}

export function EditorSection({ id, title, description, children, action }: { id: string; title: string; description?: string; children: ReactNode; action?: ReactNode }) {
  return (
    <section id={id} className="card scroll-mt-24 p-5 sm:p-6" aria-labelledby={`${id}-h`}>
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 id={`${id}-h`} className="font-semibold">
            {title}
          </h2>
          {description && <p className="mt-0.5 text-sm text-ink-muted">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

/** Scroll to ?section=… when arriving from an inline Edit link. */
export function useSectionScroll(ready: boolean) {
  const [params] = useSearchParams();
  const section = params.get('section');
  useEffect(() => {
    if (!ready || !section) return;
    const t = setTimeout(() => {
      const el = document.getElementById(section);
      el?.scrollIntoView({ block: 'start' });
      el?.classList.add('target-flash');
    }, 150);
    return () => clearTimeout(t);
  }, [ready, section]);
}

export function useUnsavedWarning(dirty: boolean) {
  useEffect(() => {
    if (!dirty) return;
    const h = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', h);
    return () => window.removeEventListener('beforeunload', h);
  }, [dirty]);
}

export function EditorHeader({
  title,
  back,
  status,
  pending,
  pendingBy,
  updatedAt,
  updatedBy,
  historyPath,
  viewPath,
}: {
  title: string;
  back: { to: string; label: string };
  status?: 'draft' | 'published';
  pending?: boolean;
  pendingBy?: string | null;
  updatedAt?: string;
  updatedBy?: string | null;
  historyPath?: string;
  viewPath?: string;
}) {
  return (
    <div className="mb-6">
      <Link to={back.to} className="text-sm text-ink-muted hover:text-ink">
        ‹ {back.label}
      </Link>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">{title}</h1>
        <div className="flex flex-wrap items-center gap-2">
          {status && <StatusBadge status={status} pending={pending} />}
          {historyPath && (
            <Link to={historyPath} className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium text-ink-muted hover:bg-surface-sunken hover:text-ink">
              <History className="h-4 w-4" /> History
            </Link>
          )}
          {viewPath && (
            <Link to={viewPath} className="inline-flex h-8 items-center rounded-lg border border-line px-3 text-sm font-medium hover:bg-surface-sunken">
              View page
            </Link>
          )}
        </div>
      </div>
      {updatedAt && (
        <p className="mt-1 text-sm text-ink-muted">
          Last saved {formatDateTime(updatedAt)}
          {updatedBy ? ` by ${updatedBy}` : ''}
          {pending && pendingBy ? `. You are editing the changes ${pendingBy} submitted for review.` : ''}
        </p>
      )}
    </div>
  );
}

export function SaveBar({
  dirty,
  saving,
  onSave,
  onPublish,
  publishing,
  status,
  pending,
  changeNote,
  onChangeNote,
  errorCount,
  isNew,
}: {
  dirty: boolean;
  saving: boolean;
  onSave: () => void;
  onPublish?: () => void;
  publishing?: boolean;
  status?: 'draft' | 'published';
  pending?: boolean;
  changeNote: string;
  onChangeNote: (v: string) => void;
  errorCount: number;
  isNew?: boolean;
}) {
  const { isAdmin } = useAuth();
  const editorOnPublished = !isAdmin && status === 'published';
  const saveLabel = isNew ? 'Create draft' : editorOnPublished ? 'Submit for review' : 'Save changes';
  return (
    <div className="sticky bottom-0 z-20 -mx-4 mt-8 border-t border-line bg-surface/95 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-t-xl sm:border-x">
      <div className="flex flex-wrap items-center gap-3">
        <Input value={changeNote} onChange={(e) => onChangeNote(e.target.value)} placeholder="Describe this change (optional)" className="min-w-[200px] flex-1" aria-label="Change note" maxLength={200} />
        {errorCount > 0 && <span className="text-sm font-medium text-brand-fg">{errorCount} field{errorCount > 1 ? 's need' : ' needs'} attention</span>}
        {!dirty && !isNew && <span className="text-sm text-ink-muted">All changes saved</span>}
        <Button onClick={onSave} loading={saving} disabled={!dirty && !isNew} variant={isAdmin && onPublish ? 'secondary' : 'primary'}>
          {saveLabel}
        </Button>
        {isAdmin && onPublish && !isNew && (status === 'draft' || pending || dirty) && (
          <Button variant="primary" onClick={onPublish} loading={publishing}>
            {dirty ? 'Save and publish' : 'Publish'}
          </Button>
        )}
      </div>
      {editorOnPublished && <p className="mt-2 text-xs text-ink-muted">This page is live. Your changes stay hidden until an Admin publishes them.</p>}
    </div>
  );
}

/** Editable list of plain strings (e.g. prerequisites). */
export function StringList({ items, onChange, placeholder, label }: { items: string[]; onChange: (v: string[]) => void; placeholder: string; label: string }) {
  return (
    <div className="space-y-2">
      {items.map((v, i) => (
        <div key={i} className="flex gap-2">
          <Input value={v} onChange={(e) => onChange(items.map((x, j) => (j === i ? e.target.value : x)))} placeholder={placeholder} aria-label={`${label} ${i + 1}`} />
          <Button variant="ghost" size="sm" className="h-10" onClick={() => onChange(items.filter((_, j) => j !== i))} aria-label={`Remove ${label.toLowerCase()} ${i + 1}`}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button size="sm" onClick={() => onChange([...items, ''])}>
        <Plus className="h-4 w-4" /> Add {label.toLowerCase()}
      </Button>
    </div>
  );
}

export const RemoveButton = ({ onClick, label }: { onClick: () => void; label: string }) => (
  <button type="button" onClick={onClick} className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-ink-subtle hover:bg-brand-soft hover:text-brand-fg" aria-label={label}>
    <Trash2 className="h-4 w-4" />
  </button>
);
