import { ArrowRight, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { modulePath } from '@cms/shared';
import { useModule, useSubTask } from '@/api/queries';
import type { SubTaskCard } from '@/api/types';
import { ErrorState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { cn } from '@/lib/utils';
import { Callout } from './Callout';
import { MediaGallery } from './Media';
import { RichContent } from './RichContent';

/** One walkthrough's steps, loaded when it is opened, drawn as a connected timeline. */
function WalkthroughSteps({ moduleSlug, slug }: { moduleSlug: string; slug: string }) {
  const { data, isLoading, error } = useSubTask(moduleSlug, slug);
  if (isLoading)
    return (
      <div className="space-y-3 py-2">
        <Skeleton className="h-5 w-1/2" />
        <Skeleton className="h-24" />
      </div>
    );
  if (error || !data) return <p className="py-2 text-sm text-ink-muted">These steps could not be loaded.</p>;
  const n = data.steps.length;
  return (
    <div>
      {data.prerequisites.length > 0 && (
        <p className="mb-6 rounded-lg bg-surface-sunken px-4 py-3 text-sm">
          <span className="font-semibold">Before you start: </span>
          {data.prerequisites.join('; ')}.
        </p>
      )}
      <ol className="relative">
        {data.steps.map((st, i) => (
          <li key={st._id} className="relative pb-10 pl-12 last:pb-2">
            {i < n - 1 && <span aria-hidden className="absolute bottom-0 left-[15px] top-9 w-0.5 bg-brand/30" />}
            <span className="tabular absolute left-0 top-0 grid h-8 w-8 place-items-center rounded-full bg-brand text-sm font-semibold text-white">{i + 1}</span>
            <h4 className="pt-1 text-lg font-semibold leading-snug">{st.title}</h4>
            <div className="mt-3 space-y-4">
              <RichContent html={st.content.html} />
              <MediaGallery items={st.media} />
              {st.callout?.text && <Callout type={st.callout.type} text={st.callout.text} />}
            </div>
          </li>
        ))}
      </ol>
      {data.expectedOutcome && (
        <p className="mt-4 rounded-lg border border-success/30 bg-success/[0.06] px-4 py-3 text-sm">
          <span className="font-semibold">Expected outcome: </span>
          {data.expectedOutcome}
        </p>
      )}
      <Link to={modulePath(data.module.section, data.module.slug, data.slug)} className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-brand-fg hover:underline">
        Open as a full walkthrough to bookmark or mark as read
        <ArrowRight className="h-4 w-4" aria-hidden />
      </Link>
    </div>
  );
}

function WalkthroughItem({ moduleSlug, sub, index, defaultOpen }: { moduleSlug: string; sub: SubTaskCard; index: number; defaultOpen: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const panelId = `wt-${sub._id}`;
  return (
    <li className="rounded-2xl border border-line bg-surface">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-controls={panelId} className="flex w-full items-start gap-4 p-5 text-left">
        <span className="tabular mt-0.5 text-sm font-semibold text-ink-muted">{index + 1}</span>
        <span className="min-w-0 flex-1">
          <span className="block font-semibold">{sub.title}</span>
          <span className="mt-0.5 block text-sm text-ink-muted">{sub.summary}</span>
        </span>
        <span className="mt-0.5 shrink-0 text-xs text-ink-muted">
          {sub.stepCount} {sub.stepCount === 1 ? 'step' : 'steps'}
        </span>
        <ChevronDown className={cn('mt-0.5 h-5 w-5 shrink-0 text-ink-muted transition-transform', open && 'rotate-180')} aria-hidden />
      </button>
      {open && (
        <div id={panelId} className="border-t border-line px-5 pb-6 pt-6 sm:px-8">
          <WalkthroughSteps moduleSlug={moduleSlug} slug={sub.slug} />
        </div>
      )}
    </li>
  );
}

/** A stage's guide and its walkthrough steps, shown in place under the lifecycle route. */
export function StageDetail({ slug }: { slug: string }) {
  const { data: m, isLoading, error, refetch } = useModule(slug);
  if (isLoading)
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-48 rounded-2xl" />
      </div>
    );
  if (error || !m) return <ErrorState message="This stage could not be loaded." onRetry={() => refetch()} />;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="tabular text-sm text-ink-muted">Stage {m.order}</p>
          <h2 className="mt-1 text-2xl font-bold sm:text-3xl">{m.title}</h2>
          <p className="mt-2 max-w-prose text-ink-muted">{m.summary}</p>
        </div>
        <Link to={modulePath(m.section, m.slug)} className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-fg hover:underline">
          Guidelines, FAQs and more
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>

      <section aria-labelledby="stage-guide-h" className="mt-8">
        <h3 id="stage-guide-h" className="text-lg font-semibold">
          Guide
        </h3>
        <div className="mt-3 rounded-2xl border border-line bg-surface p-5 sm:p-7">
          <RichContent html={m.e2eContent.html} />
        </div>
      </section>

      <section aria-labelledby="stage-steps-h" className="mt-10">
        <h3 id="stage-steps-h" className="text-lg font-semibold">
          Steps
        </h3>
        {m.subTasks.length === 0 ? (
          <p className="mt-3 text-sm text-ink-muted">No walkthroughs for this stage yet.</p>
        ) : (
          <ol className="mt-3 space-y-3">
            {m.subTasks.map((s, i) => (
              <WalkthroughItem key={s._id} moduleSlug={m.slug} sub={s} index={i} defaultOpen={i === 0} />
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
