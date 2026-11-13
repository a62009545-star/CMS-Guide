import { FileClock, Image, LayoutDashboard, Layers, ListChecks, ScrollText, Settings2, Users } from 'lucide-react';
import { NavLink, Route, Routes } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { cn } from '@/lib/utils';
import { NotFoundPage } from '../NotFoundPage';
import { AuditLogPage } from './AuditLogPage';
import { DashboardPage } from './DashboardPage';
import { MediaLibraryPage } from './MediaLibraryPage';
import { ModuleEditorPage } from './ModuleEditorPage';
import { ModulesManagerPage } from './ModulesManagerPage';
import { SubTaskEditorPage } from './SubTaskEditorPage';
import { SubTasksManagerPage } from './SubTasksManagerPage';
import { UsersPage } from './UsersPage';
import { EntityHistoryPage, VersionHistoryPage } from './VersionHistoryPage';

export default function AdminRoutes() {
  const { isAdmin } = useAuth();
  const nav = [
    { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/admin/modules', label: 'Modules', icon: Layers },
    { to: '/admin/configuration', label: 'Configuration', icon: Settings2 },
    { to: '/admin/subtasks', label: 'Sub-tasks', icon: ListChecks },
    { to: '/admin/media', label: 'Media library', icon: Image },
    { to: '/admin/versions', label: 'Version history', icon: FileClock },
    ...(isAdmin
      ? [
          { to: '/admin/users', label: 'Users & roles', icon: Users },
          { to: '/admin/audit', label: 'Audit log', icon: ScrollText },
        ]
      : []),
  ];
  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-8">
      <nav aria-label="Admin" className="-mx-1 mb-6 flex gap-1 overflow-x-auto border-b border-line pb-px">
        {nav.map((n) => (
          <NavLink
            key={n.to}
            to={n.to}
            end={n.end}
            className={({ isActive }) =>
              cn('-mb-px flex shrink-0 items-center gap-2 border-b-2 px-3 py-2.5 text-sm font-medium', isActive ? 'border-brand text-ink' : 'border-transparent text-ink-muted hover:text-ink')
            }
          >
            <n.icon className="h-4 w-4" aria-hidden />
            {n.label}
          </NavLink>
        ))}
      </nav>
      <Routes>
        <Route index element={<DashboardPage />} />
        <Route path="modules" element={<ModulesManagerPage key="lifecycle" section="lifecycle" />} />
        <Route path="configuration" element={<ModulesManagerPage key="configuration" section="configuration" />} />
        <Route path="modules/new" element={<ModuleEditorPage />} />
        <Route path="modules/:id" element={<ModuleEditorPage />} />
        <Route path="subtasks" element={<SubTasksManagerPage />} />
        <Route path="subtasks/new" element={<SubTaskEditorPage />} />
        <Route path="subtasks/:id" element={<SubTaskEditorPage />} />
        <Route path="media" element={<MediaLibraryPage />} />
        <Route path="versions" element={<VersionHistoryPage />} />
        <Route path="versions/:entityType/:entityId" element={<EntityHistoryPage />} />
        {isAdmin && <Route path="users" element={<UsersPage />} />}
        {isAdmin && <Route path="audit" element={<AuditLogPage />} />}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </div>
  );
}
