import { ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link, Navigate, useLocation, useParams, useSearchParams } from 'react-router-dom';
import { SECTION_LABEL, modulePath } from '@cms/shared';
import { ApiError } from '@/api/client';
import { useModule } from '@/api/queries';
import { FaqList, GuidelineList } from '@/components/content/Guidelines';
import { FlowDiagram } from '@/components/content/FlowDiagram';
import { MediaView } from '@/components/content/Media';
import { BookmarkButton, LastUpdated, SectionEdit, StaffBar } from '@/components/content/PageMeta';
import { RichContent } from '@/components/content/RichContent';
import { StatusBadge } from '@/components/ui/Badge';
import { ErrorState } from '@/components/ui/EmptyState';
import { ModuleIcon } from '@/components/ui/Icon';
import { PageSkeleton } from '@/components/ui/Skeleton';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useHashScroll } from '@/hooks/useHashScroll';
import { useAuth } from '@/lib/auth';
import { NotFoundPage } from './NotFoundPage';

function Section({ id, title, edit, children }: { id: string; title: string; edit?: ReactNode; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-h`} className="scroll-mt-24">
      <div className="mb-4 flex items-center justify-between gap-4">
        <h2 id={`${id}-h`} className="text-xl font-semibold">
          {title}
        </h2>
        {edit}
      </div>
      {children}
    </section>
  );
}

export function ModulePage() {
  const { moduleSlug = '' } = useParams();
  return <ModuleView slug={moduleSlug} />;
}

/**
 * Everything about one module on a single page: overview, flow, guidelines, walkthroughs, FAQs.
 * Used as the module's own page, and embedded under the route on the CMS lifecycle page.
 */
export function ModuleView({ slug: moduleSlug, embedded = false }: { slug: string; embedded?: boolean }) {
  const [params] = useSearchParams();
  const preview = params.get('preview') === '1';
  const { data: m, isLoading, error, refetch } = useModule(moduleSlug, preview);
  const { user, isStaff } = useAuth();
  const location = useLocation();
  useDocumentTitle(embedded ? 'CMS lifecycle' : m?.title);
  useHashScroll(!!m && !embedded);
  const wrap = embedded ? '' : 'mx-auto max-w-6xl px-4 py-8 sm:px-8';

  if (isLoading) return <div className={wrap}><PageSkeleton /></div>;
  if (error instanceof ApiError && error.status === 404) return <NotFoundPage />;
  if (error || !m) return <div className={wrap}><ErrorState message={(error as Error)?.message} onRetry={() => refetch()} /></div>;

  // Each section has its own address; send old or mistyped links to the right one.
  const home = modulePath(m.section, m.slug);
  if (!embedded && location.pathname !== home) return <Navigate replace to={{ pathname: home, search: location.search, hash: location.hash }} />;
  const editBase = `/admin/modules/${m._id}`;
  const isLifecycle = (m.section ?? 'lifecycle') === 'lifecycle';
  const unit = isLifecycle ? 'stage' : 'topic';
  const read = new Set((user?.readSubTasks ?? []).map(String));
  const toc = [
    { id: 'overview', label: 'How it works' },
    m.flowSteps.length > 0 && { id: 'flow', label: 'Process flow' },
    m.guidelines.length > 0 && { id: 'guidelines', label: 'Guidelines' },
    { id: 'walkthroughs', label: 'Walkthroughs' },
    m.faqs.length > 0 && { id: 'faqs', label: 'FAQs' },
  ].filter(Boolean) as { id: string; label: string }[];

  return (
    <div className={embedded ? 'flex gap-10' : 'mx-auto flex max-w-6xl gap-10 px-4 py-8 sm:px-8'}>
      <article className="min-w-0 flex-1">
        <StaffBar
          entityType="module"
          id={m._id}
          status={m.status}
          hasPendingDraft={m.hasPendingDraft}
          pendingDraftByName={m.pendingDraftByName}
          isPreview={m.isPreview}
          editPath={editBase}
        />

        <header>
          <p className="flex items-center gap-2 text-sm text-ink-muted">
            <ModuleIcon name={m.icon} className="h-4 w-4" />
            <span className="tabular">{isLifecycle ? `Stage ${m.order}` : SECTION_LABEL.configuration}</span>
          </p>
          <h1 className="mt-2 text-3xl font-bold">{m.title}</h1>
          <p className="mt-3 max-w-prose text-lg text-ink-muted">{m.summary}</p>
          <div className="mt-5 flex gap-2">
            <BookmarkButton entityType="module" entityId={m._id} />
          </div>
        </header>

        {m.heroMedia && <MediaView media={m.heroMedia} className="mt-8 [&_img]:aspect-[21/9] [&_img]:max-h-[360px]" />}

        <div className="mt-10 space-y-12">
          <Section id="overview" title="How it works" edit={<SectionEdit to={`${editBase}?section=overview`} label="Edit how it works" />}>
            <div className="card p-5 sm:p-7">
              <RichContent html={m.e2eContent.html} />
            </div>
          </Section>

          {m.flowSteps.length > 0 && (
            <Section id="flow" title="Process flow" edit={<SectionEdit to={`${editBase}?section=flow`} label="Edit process flow" />}>
              <div className="card overflow-x-auto p-5 sm:p-7">
                <FlowDiagram steps={m.flowSteps} />
              </div>
            </Section>
          )}

          {m.guidelines.length > 0 && (
            <Section id="guidelines" title="Guidelines" edit={<SectionEdit to={`${editBase}?section=guidelines`} label="Edit guidelines" />}>
              <div className="card p-5 sm:p-6">
                <GuidelineList items={m.guidelines} />
              </div>
            </Section>
          )}

          <Section
            id="walkthroughs"
            title="Walkthroughs"
            edit={isStaff ? <SectionEdit to={`/admin/subtasks?module=${m._id}`} label="Manage walkthroughs" /> : undefined}
          >
            {m.subTasks.length === 0 ? (
              <p className="text-sm text-ink-muted">No walkthroughs for this {unit} yet.</p>
            ) : (
              <ol className="grid gap-3 sm:grid-cols-2">
                {m.subTasks.map((s, i) => (
                  <li key={s._id}>
                    <Link
                      to={modulePath(m.section, m.slug, s.slug)}
                      className="card group flex h-full flex-col p-5 transition-[border-color,box-shadow] hover:border-brand/40 hover:shadow-raised"
                    >
                      <span className="flex items-center justify-between gap-3 text-xs text-ink-muted">
                        <span className="tabular">
                          {isLifecycle ? `${m.order}.${i + 1}` : i + 1}
                        </span>
                        {read.has(s._id) && (
                          <span className="inline-flex items-center gap-1 text-success">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Read
                          </span>
                        )}
                        {isStaff && s.status === 'draft' && <StatusBadge status="draft" />}
                      </span>
                      <span className="mt-2 font-semibold group-hover:text-brand-fg">{s.title}</span>
                      <span className="mt-1 text-sm text-ink-muted">{s.summary}</span>
                      <span className="mt-auto pt-4 text-xs text-ink-muted">
                        {s.stepCount} {s.stepCount === 1 ? 'step' : 'steps'}
                      </span>
                    </Link>
                  </li>
                ))}
              </ol>
            )}
          </Section>

          {m.faqs.length > 0 && (
            <Section id="faqs" title="FAQs" edit={<SectionEdit to={`${editBase}?section=faqs`} label="Edit FAQs" />}>
              <div className="card px-5 sm:px-6">
                <FaqList items={m.faqs} />
              </div>
            </Section>
          )}
        </div>

        <nav aria-label={isLifecycle ? 'Lifecycle' : SECTION_LABEL.configuration} data-guide="stage-nav" className="mt-12 grid gap-3 sm:grid-cols-2">
          {m.prev ? (
            <Link to={embedded ? `/lifecycle?stage=${m.prev.slug}` : modulePath(m.section, m.prev.slug)} className="card flex items-center gap-3 p-4 hover:border-brand/40">
              <ArrowLeft className="h-5 w-5 shrink-0 text-ink-muted" />
              <span>
                <span className="block text-xs text-ink-muted">Previous {unit}</span>
                <span className="font-medium">{m.prev.title}</span>
              </span>
            </Link>
          ) : (
            <span />
          )}
          {m.next && (
            <Link to={embedded ? `/lifecycle?stage=${m.next.slug}` : modulePath(m.section, m.next.slug)} className="card flex items-center justify-end gap-3 p-4 text-right hover:border-brand/40">
              <span>
                <span className="block text-xs text-ink-muted">Next {unit}</span>
                <span className="font-medium">{m.next.title}</span>
              </span>
              <ArrowRight className="h-5 w-5 shrink-0 text-ink-muted" />
            </Link>
          )}
        </nav>

        <LastUpdated name={m.updatedByName} at={m.updatedAt} />
      </article>

      <aside className="hidden w-48 shrink-0 xl:block">
        <nav aria-label="On this page" className="sticky top-24">
          <p className="text-xs font-semibold text-ink-muted">On this page</p>
          <ul className="mt-3 space-y-1 border-l border-line">
            {toc.map((t) => (
              <li key={t.id}>
                <a href={`#${t.id}`} className="-ml-px block border-l border-transparent py-1 pl-3 text-sm text-ink-muted hover:border-ink-subtle hover:text-ink">
                  {t.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
    </div>
  );
}
