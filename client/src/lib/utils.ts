import clsx, { type ClassValue } from 'clsx';

export const cn = (...v: ClassValue[]) => clsx(v);

const dateFmt = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
const dateTimeFmt = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' });

export const formatDate = (d?: string | Date | null) => (d ? dateFmt.format(new Date(d)) : '');
export const formatDateTime = (d?: string | Date | null) => (d ? dateTimeFmt.format(new Date(d)) : '');

export function timeAgo(d: string | Date) {
  const s = Math.round((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 45) return 'just now';
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} h ago`;
  const days = Math.round(h / 24);
  if (days < 7) return `${days} d ago`;
  return formatDate(d);
}

export const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80);

export const formatBytes = (n?: number) => {
  if (!n) return '';
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
};

export const actionLabel: Record<string, string> = {
  create: 'created',
  update: 'updated',
  delete: 'deleted',
  publish: 'published',
  unpublish: 'unpublished',
  restore: 'restored a version of',
  reorder: 'reordered',
  submit: 'submitted changes to',
  login: 'signed in',
  role_change: 'changed the role of',
};
