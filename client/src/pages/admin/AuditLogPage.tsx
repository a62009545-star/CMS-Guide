import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AUDIT_ACTIONS, ENTITY_TYPES } from '@cms/shared';
import { get } from '@/api/client';
import type { AuditEntry, Page } from '@/api/types';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Field';
import { Skeleton } from '@/components/ui/Skeleton';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { formatDateTime } from '@/lib/utils';

const entityName: Record<string, string> = { module: 'Module', subtask: 'Sub-task', media: 'Media', user: 'User' };
const actionTone: Record<string, 'success' | 'brand' | 'warning' | 'neutral' | 'info'> = {
  publish: 'success',
  delete: 'brand',
  unpublish: 'warning',
  submit: 'info',
};

export function AuditLogPage() {
  useDocumentTitle('Audit log');
  const [f, setF] = useState({ entityType: '', action: '', from: '', to: '' });
  const [page, setPage] = useState(1);
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'audit', f, page],
    queryFn: () => get<Page<AuditEntry>>('/audit', { ...f, to: f.to ? `${f.to}T23:59:59` : '', page, limit: 25 }),
    placeholderData: keepPreviousData,
  });
  const set = (k: keyof typeof f, v: string) => {
    setF((x) => ({ ...x, [k]: v }));
    setPage(1);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold">Audit log</h1>
      <p className="mt-1 text-sm text-ink-muted">Every change, who made it and when.</p>
      <div className="my-5 grid gap-2 sm:grid-cols-4">
        <Select value={f.entityType} onChange={(e) => set('entityType', e.target.value)} aria-label="Entity type">
          <option value="">All entities</option>
          {ENTITY_TYPES.map((t) => (
            <option key={t} value={t}>{entityName[t]}</option>
          ))}
        </Select>
        <Select value={f.action} onChange={(e) => set('action', e.target.value)} aria-label="Action">
          <option value="">All actions</option>
          {AUDIT_ACTIONS.map((a) => (
            <option key={a} value={a}>{a.replace('_', ' ')}</option>
          ))}
        </Select>
        <Input type="date" value={f.from} onChange={(e) => set('from', e.target.value)} aria-label="From date" />
        <Input type="date" value={f.to} onChange={(e) => set('to', e.target.value)} aria-label="To date" />
      </div>
      {isLoading ? (
        <Skeleton className="h-96" />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="border-b border-line text-left text-ink-muted">
              <tr>
                <th className="px-4 py-3 font-medium">When</th>
                <th className="px-4 py-3 font-medium">Who</th>
                <th className="px-4 py-3 font-medium">Action</th>
                <th className="px-4 py-3 font-medium">Entity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {data?.items.map((a) => (
                <tr key={a._id}>
                  <td className="tabular whitespace-nowrap px-4 py-3 text-ink-muted">{formatDateTime(a.timestamp)}</td>
                  <td className="px-4 py-3">{a.userName}</td>
                  <td className="px-4 py-3">
                    <Badge tone={actionTone[a.action] ?? 'neutral'}>{a.action.replace('_', ' ')}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <span className="mr-2 text-xs text-ink-muted">{entityName[a.entityType]}</span>
                    {a.path && a.action !== 'delete' ? (
                      <Link to={a.path} className="font-medium hover:text-brand-fg">{a.entityTitle}</Link>
                    ) : (
                      <span className="font-medium">{a.entityTitle}</span>
                    )}
                    {a.meta && 'from' in a.meta && <span className="ml-2 text-xs text-ink-muted">{String(a.meta.from)} to {String(a.meta.to)}</span>}
                  </td>
                </tr>
              ))}
              {data?.items.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-ink-muted">No entries match these filters.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
      {data && data.pages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm">
          <Button size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
          <span className="tabular text-ink-muted">Page {data.page} of {data.pages} ({data.total} entries)</span>
          <Button size="sm" disabled={page >= data.pages} onClick={() => setPage((p) => p + 1)}>Next</Button>
        </div>
      )}
    </div>
  );
}
