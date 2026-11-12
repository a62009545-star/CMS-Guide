import type { ReactNode } from 'react';

export function EmptyState({ icon, title, children, action }: { icon?: ReactNode; title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-card border border-dashed border-line px-6 py-12 text-center">
      {icon && <div className="mb-3 text-ink-subtle">{icon}</div>}
      <p className="font-medium">{title}</p>
      {children && <div className="mt-1 max-w-sm text-sm text-ink-muted">{children}</div>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorState({ title = 'This page could not be loaded', message, onRetry }: { title?: string; message?: string; onRetry?: () => void }) {
  return (
    <div className="card p-8 text-center" role="alert">
      <p className="font-medium">{title}</p>
      {message && <p className="mt-1 text-sm text-ink-muted">{message}</p>}
      {onRetry && (
        <button onClick={onRetry} className="mt-4 text-sm font-medium text-brand-fg hover:underline">
          Try again
        </button>
      )}
    </div>
  );
}
