import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ArrowRight, Check, CheckCircle2, ChevronDown, Circle } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { ApiError, errorMessage, post } from '@/api/client';
import { qk, useSubTask } from '@/api/queries';
import type { WalkthroughStep } from '@/api/types';
import { Callout } from '@/components/content/Callout';
import { MediaGallery } from '@/components/content/Media';
import { BookmarkButton, LastUpdated, SectionEdit, StaffBar } from '@/components/content/PageMeta';
import { RichContent } from '@/components/content/RichContent';
import { Button } from '@/components/ui/Button';
import { ErrorState } from '@/components/ui/EmptyState';
import { PageSkeleton } from '@/components/ui/Skeleton';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useHashScroll } from '@/hooks/useHashScroll';
import { useGuide } from '@/components/guide/Guide';
import { useAuth } from '@/lib/auth';
import { cn } from '@/lib/utils';
import { NotFoundPage } from './NotFoundPage';

/** Tracks which step is in view and which steps have been seen, for the progress rail. */
function useStepSpy(count: number) {
  const [active, setActive] = useState(0);
  const [seen, setSeen] = useState<Set<number>>(() => new Set());
  useEffect(() => {
    if (!count) return;
    const els = Array.from({ length: count }, (_, i) => document.getElementById(`step-${i + 1}`)).filter(Boolean) as HTMLElement[];
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          const i = Number((e.target as HTMLElement).dataset.index);
          setActive(i);
          setSeen((s) => (s.has(i) ? s : new Set(s).add(i)));
        }
      },
      { rootMargin: '-30% 0px -60% 0px' },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [count]);
  return { active, seen };
}

function StepRail({ steps, active, seen, onJump }: { steps: WalkthroughStep[]; active: number; seen: Set<number>; onJump: (i: number) => void }) {
  const pct = Math.round((seen.size / Math.max(1, steps.length)) * 100);
  return (
    <div>
      <div className="flex items-baseline justify-between text-xs text-ink-muted">
        <span className="font-semibold">Steps</span>
        <span className="tabular">
          {seen.size} of {steps.length} viewed
        </span>
      </div>
      <div className="mt-2 h-1 overflow-hidden rounded-full bg-line" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Walkthrough progress">
        <div className="h-full rounded-full bg-brand transition-[width] duration-300" style={{ width: `${pct}%` }} />
      </div>
      <ol className="relative mt-4">
        {steps.map((s, i) => (
          <li key={s._id} className="relative">
            {i < steps.length - 1 && <span aria-hidden className={cn('absolute left-[10px] top-6 h-[calc(100%-12px)] w-0.5', seen.has(i) && seen.has(i + 1) ? 'bg-brand' : 'bg-line')} />}
            <button
              onClick={() => onJump(i)}
              aria-current={i === active ? 'step' : undefined}
              className={cn('relative flex w-full items-start gap-3 rounded-md py-1.5 pr-2 text-left text-sm', i === active ? 'font-semibold text-ink' : 'text-ink-muted hover:text-ink')}
            >
              <span
                className={cn(
                  'tabular relative z-10 mt-px grid h-[22px] w-[22px] shrink-0 place-items-center rounded-full border-2 text-[11px] font-semibold',
                  i === active ? 'border-brand bg-brand text-white' : seen.has(i) ? 'border-brand bg-surface text-brand-fg' : 'border-line bg-surface',
                )}
              >
                {i + 1}
              </span>
              <span className="leading-snug">{s.title}</span>
            </button>
          </li>
        ))}
      </ol>
    </div>
  );
}

export function SubTaskPage() {
  const { moduleSlug = '', subSlug = '' } = useParams();
  const [params] = useSearchParams();
  const preview = params.get('preview') === '1';
  const { data: s, isLoading, error, refetch } = useSubTask(moduleSlug, subSlug, preview);
  const { user } = useAuth();
  const qc = useQueryClient();
  const { cue } = useGuide();
  const navigate = useNavigate();
  const [stepsOpen, setStepsOpen] = useState(false);
  useDocumentTitle(s?.title);
  useHashScroll(!!s);
  const { active, seen } = useStepSpy(s?.steps.length ?? 0);
  const topRef = useRef<HTMLDivElement>(null);

  const isRead = !!s && (user?.readSubTasks ?? []).map(String).includes(s._id);
  const markRead = useMutation({
    mutationFn: () => post<{ read: boolean }>(`/auth/me/read/${s!._id}`),
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: qk.me });
      toast.success(r.read ? 'Marked as read' : 'Marked as unread');
      cue(r.read ? 'delighted' : 'wink');
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  const jump = useCallback(
    (i: number) => {
      setStepsOpen(false);
      navigate({ hash: `step-${i + 1}`, search: params.toString() }, { replace: true });
      const el = document.getElementById(`step-${i + 1}`);
      el?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
    },
    [navigate, params],
  );

  if (isLoading) return <div className="mx-auto max-w-6xl px-4 py-8 sm:px-8"><PageSkeleton /></div>;
  if (error instanceof ApiError && error.status === 404) return <NotFoundPage />;
  if (error || !s) return <div className="mx-auto max-w-6xl px-4 py-8 sm:px-8"><ErrorState message={(error as Error)?.message} onRetry={() => refetch()} /></div>;

  const n = s.steps.length;
  const editBase = `/admin/subtasks/${s._id}`;

  return (
    <div ref={topRef} className="mx-auto flex max-w-6xl gap-10 px-4 py-8 sm:px-8">
      <aside data-guide="step-rail" className="hidden w-60 shrink-0 lg:block">
        <div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto pb-4">
          <Link to={`/modules/${s.module.slug}`} className="mb-5 inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink">
            <ArrowLeft className="h-4 w-4" /> {s.module.title}
          </Link>
          <StepRail steps={s.steps} active={active} seen={seen} onJump={jump} />
        </div>
      </aside>

      <article className="min-w-0 flex-1 pb-20">
        <StaffBar
          entityType="subtask"
          id={s._id}
          status={s.status}
          hasPendingDraft={s.hasPendingDraft}
          pendingDraftByName={s.pendingDraftByName}
          isPreview={s.isPreview}
          editPath={editBase}
        />

        <nav aria-label="Breadcrumb" className="text-sm text-ink-muted">
          <ol className="flex flex-wrap items-center gap-1.5">
            <li>
              <Link to="/" className="hover:text-ink">Lifecycle</Link>
            </li>
            <li aria-hidden>›</li>
            <li>
              <Link to={`/modules/${s.module.slug}`} className="hover:text-ink">{s.module.title}</Link>
            </li>
          </ol>
        </nav>
        <h1 className="mt-2 text-3xl font-bold">{s.title}</h1>
        <p className="mt-3 max-w-prose text-lg text-ink-muted">{s.summary}</p>
        <div className="mt-5 flex flex-wrap gap-2">
          <BookmarkButton entityType="subtask" entityId={s._id} />
          <Button data-guide="mark-read" size="sm" variant="secondary" onClick={() => markRead.mutate()} loading={markRead.isPending} aria-pressed={isRead}>
            {isRead ? <CheckCircle2 className="h-4 w-4 text-success" /> : <Circle className="h-4 w-4" />}
            {isRead ? 'Read' : 'Mark as read'}
          </Button>
        </div>

        {/* Mobile step list */}
        <div data-guide="step-list-mobile" className="card mt-6 lg:hidden">
          <button onClick={() => setStepsOpen((o) => !o)} aria-expanded={stepsOpen} className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium">
            <span className="tabular">
              Step {active + 1} of {n}: {s.steps[active]?.title}
            </span>
            <ChevronDown className={cn('h-4 w-4 shrink-0 transition-transform', stepsOpen && 'rotate-180')} />
          </button>
          {stepsOpen && (
            <div className="border-t border-line px-4 py-3">
              <StepRail steps={s.steps} active={active} seen={seen} onJump={jump} />
            </div>
          )}
        </div>

        {s.prerequisites.length > 0 && (
          <section data-guide="prereq" className="mt-8 rounded-card border border-line bg-surface p-5" aria-labelledby="prereq-h">
            <div className="flex items-center justify-between">
              <h2 id="prereq-h" className="font-semibold">Before you start</h2>
              <SectionEdit to={`${editBase}?section=details`} label="Edit prerequisites" />
            </div>
            <ul className="mt-3 space-y-2">
              {s.prerequisites.map((p, i) => (
                <li key={i} className="flex gap-2.5 text-[0.9375rem]">
                  <Check className="mt-1 h-4 w-4 shrink-0 text-ink-subtle" aria-hidden />
                  {p}
                </li>
              ))}
            </ul>
          </section>
        )}

        <ol className="mt-10 space-y-6">
          {s.steps.map((st, i) => (
            <li key={st._id} id={`step-${i + 1}`} data-index={i} className="card scroll-mt-24 p-5 sm:p-7">
              <div className="flex items-start justify-between gap-4">
                <h2 className="flex items-start gap-3 text-xl font-semibold">
                  <span className="tabular grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand text-sm font-semibold text-white">{i + 1}</span>
                  <span className="pt-0.5">{st.title}</span>
                </h2>
                <SectionEdit to={`${editBase}?section=step-${i + 1}`} label={`Edit step ${i + 1}`} />
              </div>
              <div className="mt-4 space-y-5 sm:pl-11">
                <RichContent html={st.content.html} />
                <MediaGallery items={st.media} />
                {st.callout?.text && <Callout type={st.callout.type} text={st.callout.text} />}
              </div>
            </li>
          ))}
        </ol>

        {s.expectedOutcome && (
          <section className="mt-8 rounded-card border border-success/30 bg-success/[0.06] p-5" aria-labelledby="outcome-h">
            <h2 id="outcome-h" className="flex items-center gap-2 font-semibold">
              <CheckCircle2 className="h-5 w-5 text-success" /> Expected outcome
            </h2>
            <p className="mt-2 text-[0.9375rem]">{s.expectedOutcome}</p>
            {!isRead && (
              <Button size="sm" variant="primary" className="mt-4" onClick={() => markRead.mutate()} loading={markRead.isPending}>
                Mark as read
              </Button>
            )}
          </section>
        )}

        {s.related.length > 0 && (
          <section className="mt-10" aria-labelledby="related-h">
            <h2 id="related-h" className="text-lg font-semibold">Related walkthroughs</h2>
            <ul className="mt-3 grid gap-3 sm:grid-cols-2">
              {s.related.map((r) => (
                <li key={r._id}>
                  <Link to={`/modules/${r.moduleSlug}/${r.slug}`} className="card block h-full p-4 hover:border-brand/40">
                    <span className="block text-xs text-ink-muted">{r.moduleTitle}</span>
                    <span className="mt-1 block font-medium">{r.title}</span>
                    <span className="mt-1 block text-sm text-ink-muted">{r.summary}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <nav aria-label="Walkthroughs in this stage" className="mt-10 grid gap-3 sm:grid-cols-2">
          {s.prev ? (
            <Link to={`/modules/${s.module.slug}/${s.prev.slug}`} className="card flex items-center gap-3 p-4 hover:border-brand/40">
              <ArrowLeft className="h-5 w-5 shrink-0 text-ink-muted" />
              <span>
                <span className="block text-xs text-ink-muted">Previous walkthrough</span>
                <span className="font-medium">{s.prev.title}</span>
              </span>
            </Link>
          ) : (
            <span />
          )}
          {s.next && (
            <Link to={`/modules/${s.module.slug}/${s.next.slug}`} className="card flex items-center justify-end gap-3 p-4 text-right hover:border-brand/40">
              <span>
                <span className="block text-xs text-ink-muted">Next walkthrough</span>
                <span className="font-medium">{s.next.title}</span>
              </span>
              <ArrowRight className="h-5 w-5 shrink-0 text-ink-muted" />
            </Link>
          )}
        </nav>

        <LastUpdated name={s.updatedByName} at={s.updatedAt} />

        {/* Previous / next step bar */}
        {n > 1 && (
          <div className="sticky bottom-4 z-20 mt-8 flex justify-center">
            <div data-guide="step-bar" className="flex items-center gap-1 rounded-full border border-line bg-surface/95 p-1 shadow-raised backdrop-blur">
              <Button size="sm" variant="ghost" className="rounded-full" disabled={active === 0} onClick={() => jump(active - 1)}>
                <ArrowLeft className="h-4 w-4" /> Previous step
              </Button>
              <span className="tabular px-2 text-xs text-ink-muted">
                {active + 1} / {n}
              </span>
              <Button size="sm" variant="ghost" className="rounded-full" disabled={active >= n - 1} onClick={() => jump(active + 1)}>
                Next step <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </article>
    </div>
  );
}
