import type { AuditAction, EntityType } from '@cms/shared';
import { broadcast } from './realtime.js';
import { AuditLog } from '../models/index.js';
import type { AuthUser } from '../middleware/auth.js';

interface RecordArgs {
  user: AuthUser;
  action: AuditAction;
  entityType: EntityType;
  entityId?: unknown;
  entityTitle: string;
  path?: string;
  slug?: string;
  moduleSlug?: string;
  visibleToViewers?: boolean;
  meta?: Record<string, unknown>;
  /** Content changes are broadcast; user-management events are not. */
  notify?: boolean;
}

export async function record(a: RecordArgs) {
  const entry = await AuditLog.create({
    userId: a.user.id,
    userName: a.user.name,
    action: a.action,
    entityType: a.entityType,
    entityId: a.entityId,
    entityTitle: a.entityTitle,
    path: a.path,
    visibleToViewers: !!a.visibleToViewers,
    meta: a.meta ?? null,
  });
  if (a.notify !== false) {
    broadcast({
      entityType: a.entityType,
      entityId: String(a.entityId ?? ''),
      action: a.action,
      title: a.entityTitle,
      slug: a.slug,
      moduleSlug: a.moduleSlug,
      by: { id: a.user.id, name: a.user.name },
      at: entry.timestamp.toISOString(),
      visibleToViewers: !!a.visibleToViewers,
    });
  }
  return entry;
}
