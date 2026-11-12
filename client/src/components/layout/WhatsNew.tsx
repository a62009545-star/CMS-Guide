import { Bell } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useActivity } from '@/api/queries';
import { actionLabel, timeAgo } from '@/lib/utils';
import { Popover } from './Popover';

const KEY = 'cms-whatsnew-seen';
const readSeen = () => {
  try {
    return Number(localStorage.getItem(KEY)) || 0;
  } catch {
    return 0;
  }
};

export function WhatsNew() {
  const { data, isLoading } = useActivity(15);
  const [seen, setSeen] = useState(readSeen);
  const items = data?.items ?? [];
  const unread = items.filter((i) => new Date(i.timestamp).getTime() > seen).length;

  const markSeen = (open: boolean) => {
    if (!open) return;
    const now = Date.now();
    setSeen(now);
    try {
      localStorage.setItem(KEY, String(now));
    } catch {
      /* ignore */
    }
  };

  return (
    <Popover
      label="What's new"
      onOpenChange={markSeen}
      className="w-[min(380px,calc(100vw-24px))]"
      trigger={({ open, toggle }) => (
        <button
          data-guide="whats-new"
          onClick={toggle}
          aria-expanded={open}
          aria-label={unread ? `What's new, ${unread} unread` : "What's new"}
          className="relative grid h-10 w-10 place-items-center rounded-lg text-ink-muted hover:bg-surface-sunken hover:text-ink"
        >
          <Bell className="h-5 w-5" />
          {unread > 0 && (
            <span className="tabular absolute right-1.5 top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-brand px-1 text-[10px] font-semibold text-white">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </button>
      )}
    >
      {(close) => (
        <div>
          <p className="border-b border-line px-4 py-3 text-sm font-semibold">What’s new</p>
          <ul className="max-h-[60vh] overflow-y-auto py-1">
            {isLoading && <li className="px-4 py-6 text-center text-sm text-ink-muted">Loading…</li>}
            {!isLoading && items.length === 0 && <li className="px-4 py-6 text-center text-sm text-ink-muted">No changes yet.</li>}
            {items.map((i) => {
              const fresh = new Date(i.timestamp).getTime() > seen;
              const body = (
                <>
                  <span className="block text-sm leading-snug">
                    <span className="font-medium">{i.userName}</span> {actionLabel[i.action] ?? i.action}{' '}
                    <span className="font-medium">{i.entityTitle}</span>
                  </span>
                  <span className="mt-0.5 block text-xs text-ink-muted">{timeAgo(i.timestamp)}</span>
                </>
              );
              return (
                <li key={i._id} className="relative">
                  {fresh && <span className="absolute left-1.5 top-4 h-1.5 w-1.5 rounded-full bg-brand" aria-label="New" />}
                  {i.path && i.action !== 'delete' ? (
                    <Link to={i.path} onClick={close} className="block px-4 py-2.5 hover:bg-surface-sunken">
                      {body}
                    </Link>
                  ) : (
                    <div className="px-4 py-2.5">{body}</div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </Popover>
  );
}
