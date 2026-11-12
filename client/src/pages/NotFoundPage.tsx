import { Link } from 'react-router-dom';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

export function NotFoundPage() {
  useDocumentTitle('Page not found');
  return (
    <div className="mx-auto max-w-lg px-4 py-24 text-center">
      <p className="tabular text-sm font-semibold text-brand-fg">404</p>
      <h1 className="mt-2 text-2xl font-semibold">This page does not exist or is not published</h1>
      <p className="mt-2 text-ink-muted">It may have been moved, renamed or unpublished. Search the guide or go back to the lifecycle.</p>
      <Link to="/" className="mt-6 inline-flex h-10 items-center rounded-lg bg-brand px-4 text-sm font-medium text-white hover:bg-brand-strong">
        Go to the lifecycle
      </Link>
    </div>
  );
}
