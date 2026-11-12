import { Bookmark, Bot, LayoutDashboard, LogOut, Moon, Sun } from 'lucide-react';
import { useGuide } from '@/components/guide/Guide';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { useTheme } from '@/lib/theme';
import { Popover } from './Popover';

const roleName = { admin: 'Admin', editor: 'Editor', viewer: 'Viewer' };

export function UserMenu() {
  const { user, logout, isStaff } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const guide = useGuide();
  if (!user) return null;
  const initials = user.name.split(/\s+/).map((p) => p[0]).slice(0, 2).join('').toUpperCase();
  const item = 'flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-ink hover:bg-surface-sunken';
  return (
    <Popover
      label="Account"
      className="w-64 p-1.5"
      trigger={({ open, toggle: t }) => (
        <button onClick={t} aria-expanded={open} aria-label="Account menu" className="flex items-center gap-2 rounded-lg p-1 hover:bg-surface-sunken">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-ink text-xs font-semibold text-canvas">{initials}</span>
        </button>
      )}
    >
      {(close) => (
        <div>
          <div className="px-3 pb-2 pt-1.5">
            <p className="truncate text-sm font-semibold">{user.name}</p>
            <p className="truncate text-xs text-ink-muted">{user.email}</p>
            <p className="mt-1.5 inline-block rounded border border-line px-1.5 text-xs text-ink-muted">{roleName[user.role]}</p>
          </div>
          <div className="my-1 border-t border-line" />
          <Link to="/bookmarks" onClick={close} className={item}>
            <Bookmark className="h-4 w-4 text-ink-muted" /> Bookmarks
          </Link>
          {isStaff && (
            <Link to="/admin" onClick={close} className={item}>
              <LayoutDashboard className="h-4 w-4 text-ink-muted" /> Admin
            </Link>
          )}
          <button onClick={toggle} className={item}>
            {theme === 'dark' ? <Sun className="h-4 w-4 text-ink-muted" /> : <Moon className="h-4 w-4 text-ink-muted" />}
            {theme === 'dark' ? 'Light mode' : 'Dark mode'}
          </button>
          <button
            onClick={() => {
              guide.setHidden(!guide.hidden);
              close();
            }}
            className={item}
          >
            <Bot className="h-4 w-4 text-ink-muted" />
            {guide.hidden ? 'Show the guide (Relay)' : 'Hide the guide (Relay)'}
          </button>
          <div className="my-1 border-t border-line" />
          <button
            onClick={async () => {
              close();
              await logout();
              navigate('/login');
            }}
            className={item}
          >
            <LogOut className="h-4 w-4 text-ink-muted" /> Sign out
          </button>
        </div>
      )}
    </Popover>
  );
}
