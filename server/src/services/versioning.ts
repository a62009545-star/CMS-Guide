import type { EntityType } from '@cms/shared';
import { Version } from '../models/index.js';
import type { AuthUser } from '../middleware/auth.js';

/** Top-level fields whose JSON differs between two snapshots. */
export function changedFields(prev: Record<string, unknown> | null, next: Record<string, unknown>): string[] {
  if (!prev) return Object.keys(next);
  const keys = new Set([...Object.keys(prev), ...Object.keys(next)]);
  return [...keys].filter((k) => JSON.stringify(prev[k] ?? null) !== JSON.stringify(next[k] ?? null));
}

export async function saveVersion(opts: {
  entityType: EntityType;
  entityId: unknown;
  snapshot: Record<string, unknown>;
  user: AuthUser;
  changeNote?: string;
}) {
  const last = await Version.findOne({ entityType: opts.entityType, entityId: opts.entityId })
    .sort({ versionNumber: -1 })
    .lean();
  const fields = changedFields((last?.snapshot as Record<string, unknown>) ?? null, opts.snapshot);
  if (last && fields.length === 0) return last; // nothing changed — don't store a duplicate
  return Version.create({
    entityType: opts.entityType,
    entityId: opts.entityId,
    versionNumber: (last?.versionNumber ?? 0) + 1,
    snapshot: opts.snapshot,
    changedFields: fields,
    changedBy: opts.user.id,
    changedByName: opts.user.name,
    changeNote: opts.changeNote ?? '',
  });
}
