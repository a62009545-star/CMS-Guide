import { Schema, model } from 'mongoose';
import { AUDIT_ACTIONS, ENTITY_TYPES } from '@cms/shared';

const auditLogSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
  userName: String,
  action: { type: String, enum: AUDIT_ACTIONS, required: true },
  entityType: { type: String, enum: ENTITY_TYPES, required: true },
  entityId: { type: Schema.Types.ObjectId },
  entityTitle: String,
  /** Path for linking from the UI, e.g. /modules/mop-creation/attach-rollback-plan */
  path: String,
  /** Whether the change concerns content viewers can see (drives the What's New feed). */
  visibleToViewers: { type: Boolean, default: false, index: true },
  meta: { type: Schema.Types.Mixed, default: null },
  timestamp: { type: Date, default: Date.now, index: -1 },
});

auditLogSchema.index({ entityType: 1, entityId: 1, timestamp: -1 });

export const AuditLog = model('AuditLog', auditLogSchema);
