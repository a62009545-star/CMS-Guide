import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

const tones = {
  neutral: 'bg-surface-sunken text-ink-muted border-line',
  brand: 'bg-brand-soft text-brand-fg border-brand/20',
  success: 'bg-success/10 text-success border-success/25',
  warning: 'bg-warning/15 text-ink border-warning/40',
  info: 'bg-info/10 text-info border-info/25',
} as const;

export function Badge({ tone = 'neutral', children, className }: { tone?: keyof typeof tones; children: ReactNode; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2 py-0.5 text-xs font-medium', tones[tone], className)}>
      {children}
    </span>
  );
}

export function StatusBadge({ status, pending }: { status: 'draft' | 'published'; pending?: boolean }) {
  return (
    <span className="inline-flex gap-1.5">
      {status === 'published' ? <Badge tone="success">Published</Badge> : <Badge tone="neutral">Draft</Badge>}
      {pending && <Badge tone="warning">Changes awaiting review</Badge>}
    </span>
  );
}
