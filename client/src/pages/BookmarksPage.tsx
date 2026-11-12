import { useQuery } from '@tanstack/react-query';
import { Bookmark } from 'lucide-react';
import { Link } from 'react-router-dom';
import { get } from '@/api/client';
import { qk } from '@/api/queries';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

export function BookmarksPage() {
  useDocumentTitle('Bookmarks');
  const { data, isLoading } = useQuery({
    queryKey: qk.bookmarks,
    queryFn: () => get<{ items: { _id: string; type: string; title: string; summary: string; path: string; moduleTitle?: string }[] }>('/auth/me/bookmarks'),
  });
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-8">
      <h1 className="text-2xl font-bold">Bookmarks</h1>
      <div className="mt-6">
        {isLoading ? (
          <Skeleton className="h-40" />
        ) : !data?.items.length ? (
          <EmptyState icon={<Bookmark className="h-8 w-8" />} title="No bookmarks yet">
            Use the Bookmark button on any module or walkthrough to save it here.
          </EmptyState>
        ) : (
          <ul className="card divide-y divide-line">
            {data.items.map((b) => (
              <li key={b._id}>
                <Link to={b.path} className="block px-5 py-4 hover:bg-surface-sunken">
                  <span className="block text-xs text-ink-muted">{b.type === 'module' ? 'Module' : b.moduleTitle}</span>
                  <span className="block font-medium">{b.title}</span>
                  <span className="mt-0.5 block text-sm text-ink-muted">{b.summary}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
