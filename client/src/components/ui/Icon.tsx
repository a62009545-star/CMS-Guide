import {
  Activity,
  Box,
  CalendarDays,
  Database,
  LogIn,
  ClipboardCheck,
  FileText,
  Flag,
  RadioTower,
  ShieldCheck,
  Users,
  Workflow,
  Wrench,
  Network,
  Server,
  type LucideIcon,
} from 'lucide-react';

/** Icons an Admin can pick for a module. Add more here to offer them in the editor. */
export const MODULE_ICONS: Record<string, LucideIcon> = {
  'clipboard-check': ClipboardCheck,
  activity: Activity,
  'file-text': FileText,
  'shield-check': ShieldCheck,
  users: Users,
  'radio-tower': RadioTower,
  flag: Flag,
  workflow: Workflow,
  wrench: Wrench,
  network: Network,
  server: Server,
  database: Database,
  'calendar-days': CalendarDays,
  'log-in': LogIn,
  box: Box,
};

export function ModuleIcon({ name, className }: { name: string; className?: string }) {
  const I = MODULE_ICONS[name] ?? Box;
  return <I className={className} aria-hidden strokeWidth={1.75} />;
}
