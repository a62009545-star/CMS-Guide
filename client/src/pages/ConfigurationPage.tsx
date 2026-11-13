import { ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { modulePath } from '@cms/shared';
import { useModuleSections } from '@/api/queries';
import { EmptyState, ErrorState } from '@/components/ui/EmptyState';
import { ModuleIcon } from '@/components/ui/Icon';
import { Skeleton } from '@/components/ui/Skeleton';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useAuth } from '@/lib/auth';

/** Landing page of the Configuration & management area, separate from the CMS lifecycle. */
export function ConfigurationPage() {
  useDocumentTitle('Configuration & management');
  const { configuration, isLoading, error, refetch } = useModuleSections();
  const { isStaff } = useAuth();
  const [first, ...rest] = configuration;

  return (
    <div>
      <section className="border-b border-line bg-surface">
        <div className="mx-auto max-w-6xl px-4 pb-10 pt-10 sm:px-8 sm:pt-14">
          <h1 className="max-w-3xl text-3xl font-bold sm:text-4xl">Configuration &amp; management</h1>
          <p className="mt-3 max-w-2xl text-ink-muted">
            How to set up and run CHM itself: who is in each team, which plan types exist, and who is on shift. Each topic has step-by-step walkthroughs with screenshots.
          </p>
          {first && (
            <Link
              to={modulePath('configuration', first.slug)}
              className="mt-8 flex max-w-2xl items-center gap-4 rounded-card border border-line bg-surface-sunken p-4 transition-colors hover:border-brand/40"
              data-guide="config-start"
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand text-white">
                <ModuleIcon name={first.icon} className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm text-ink-muted">New to CHM? Start here</span>
                <span className="block font-semibold">{first.title}</span>
              </span>
              <ArrowUpRight className="h-5 w-5 shrink-0 text-ink-subtle" />
            </Link>
          )}
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-8">
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="h-40" />
            ))}
          </div>
        ) : error ? (
          <ErrorState message="The topics could not be loaded." onRetry={() => refetch()} />
        ) : configuration.length === 0 ? (
          <EmptyState title="No topics yet">{isStaff ? 'Add one from Admin › Configuration.' : 'Check back soon.'}</EmptyState>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2" data-guide="config-topics">
            {(rest.length ? rest : configuration).map((m) => (
              <li key={m._id}>
                <Link
                  to={modulePath('configuration', m.slug)}
                  className="card group flex h-full gap-4 p-5 transition-[border-color,box-shadow] hover:border-brand/40 hover:shadow-raised"
                >
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-surface-sunken text-ink-muted group-hover:text-brand-fg">
                    <ModuleIcon name={m.icon} className="h-5 w-5" />
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="font-semibold leading-snug group-hover:text-brand-fg">
                      {m.title}
                      {m.status === 'draft' && <span className="ml-1.5 text-xs font-normal text-ink-subtle">(draft)</span>}
                    </span>
                    <span className="mt-1 text-sm text-ink-muted">{m.summary}</span>
                    <span className="mt-auto pt-3 text-xs text-ink-muted">
                      {m.subTaskCount} {m.subTaskCount === 1 ? 'walkthrough' : 'walkthroughs'}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
