import { Menu, Search, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { Guide } from '@/components/guide/Guide';
import { cn } from '@/lib/utils';
import { CommandPalette } from './CommandPalette';
import { Logo } from './Logo';
import { Sidebar, areaOf } from './Sidebar';
import { UserMenu } from './UserMenu';
import { WhatsNew } from './WhatsNew';

const COLLAPSE_KEY = 'cms-sidebar-collapsed';

/** The two areas of the guide, kept separate. */
function AreaTabs({ className, onNavigate, stacked }: { className?: string; onNavigate?: () => void; stacked?: boolean }) {
  const { pathname } = useLocation();
  const area = areaOf(pathname);
  const isHome = pathname === '/';
  const inLifecycle = pathname.startsWith('/lifecycle') || pathname.startsWith('/modules');
  const tab = (active: boolean) =>
    stacked
      ? cn('block rounded-lg px-3 py-2.5 text-sm font-medium', active ? 'bg-brand-soft text-ink' : 'text-ink-muted hover:bg-surface-sunken hover:text-ink')
      : cn(
      'relative flex h-full items-center whitespace-nowrap px-1 text-sm font-medium transition-colors',
      active ? 'text-ink after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-brand' : 'text-ink-muted hover:text-ink',
    );
  return (
    <nav aria-label="Guide areas" className={cn(stacked ? 'flex flex-col gap-1' : 'flex items-stretch gap-5', className)} data-guide={stacked ? undefined : 'areas'}>
      <NavLink to="/" onClick={onNavigate} className={() => tab(isHome)} aria-current={isHome ? 'page' : undefined}>
        Home
      </NavLink>
      <NavLink to="/lifecycle" onClick={onNavigate} className={() => tab(inLifecycle)} aria-current={inLifecycle ? 'page' : undefined}>
        CMS lifecycle
      </NavLink>
      <NavLink to="/configuration" onClick={onNavigate} className={() => tab(area === 'configuration')} aria-current={area === 'configuration' ? 'page' : undefined}>
        Configuration &amp; management
      </NavLink>
    </nav>
  );
}

export function AppShell() {
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(COLLAPSE_KEY) === '1';
    } catch {
      return false;
    }
  });
  const location = useLocation();
  const parts = location.pathname.split('/').filter(Boolean);
  const isLanding = parts.length === 0;
  // Walkthrough pages bring their own step navigation, so the global sidebar would be a second column.
  const isWalkthrough = (parts[0] === 'modules' || parts[0] === 'configuration') && parts.length === 3;
  // The lifecycle overview page is itself the list of stages, so the sidebar would repeat it.
  const hideSidebar = isLanding || isWalkthrough || parts[0] === 'lifecycle';
  const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => setDrawer(false), [location.pathname]);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((c) => {
      try {
        localStorage.setItem(COLLAPSE_KEY, c ? '0' : '1');
      } catch {
        /* ignore */
      }
      return !c;
    });
  }, []);

  return (
    <div className="min-h-screen">
      <a href="#main" className="sr-only z-50 rounded-md bg-surface px-3 py-2 focus:not-sr-only focus:fixed focus:left-3 focus:top-3">
        Skip to content
      </a>
      <header className="sticky top-0 z-30 border-b border-line bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/85">
        <div className="flex h-16 items-center gap-3 px-3 sm:px-5">
          {(
            <button data-guide="menu" onClick={() => setDrawer(true)} className="rounded-lg p-2 text-ink-muted hover:bg-surface-sunken lg:hidden" aria-label="Open menu">
              <Menu className="h-5 w-5" />
            </button>
          )}
          <Logo />
          <AreaTabs className="ml-2 hidden h-16 lg:flex xl:ml-4" />
          <div className={cn('flex flex-1 justify-center px-2', isLanding && 'invisible')} aria-hidden={isLanding || undefined}>
            <button
              data-guide="search"
              onClick={() => setPaletteOpen(true)}
              className="flex h-10 w-full max-w-md items-center gap-3 rounded-lg border border-line bg-surface-sunken px-3 text-sm text-ink-muted transition-colors hover:border-ink-subtle"
              aria-label="Search the guide"
            >
              <Search className="h-4 w-4 shrink-0" aria-hidden />
              <span className="flex-1 truncate text-left">Search the guide</span>
              <kbd className="hidden rounded border border-line bg-surface px-1.5 font-sans text-xs sm:inline">{isMac ? '⌘' : 'Ctrl'} K</kbd>
            </button>
          </div>
          <div className="flex items-center gap-1">
            <WhatsNew />
            <UserMenu />
          </div>
        </div>
      </header>

      <div className="flex">
        {!hideSidebar && (
          <aside
            data-guide="sidebar"
            className={cn(
              'sticky top-16 hidden h-[calc(100vh-4rem)] shrink-0 border-r border-line bg-surface transition-[width] duration-200 lg:block',
              collapsed ? 'w-[68px]' : 'w-[272px]',
            )}
          >
            <Sidebar collapsed={collapsed} onToggle={toggleCollapsed} />
          </aside>
        )}

        {drawer && (
          <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Modules">
            <div className="absolute inset-0 animate-fade-in bg-ink/40" onClick={() => setDrawer(false)} />
            <div className="absolute inset-y-0 left-0 flex w-[290px] max-w-[85vw] animate-pop-in flex-col bg-surface shadow-raised">
              <div className="flex h-14 items-center justify-between border-b border-line px-4">
                <span className="text-sm font-semibold">Menu</span>
                <button onClick={() => setDrawer(false)} className="rounded-md p-1.5 text-ink-muted hover:bg-surface-sunken" aria-label="Close menu">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <AreaTabs stacked className="border-b border-line p-3" onNavigate={() => setDrawer(false)} />
              <Sidebar collapsed={false} onNavigate={() => setDrawer(false)} />
            </div>
          </div>
        )}

        <main id="main" className="min-w-0 flex-1">
          <Outlet />
        </main>
      </div>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
      <Guide />
    </div>
  );
}
