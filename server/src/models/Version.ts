import { Schema, model } from 'mongoose';
import { ENTITY_TYPES } from '@cms/shared';

const versionSchema = new Schema({
  entityType: { type: String, enum: ENTITY_TYPES, required: true },
  entityId: { type: Schema.Types.ObjectId, required: true },
  versionNumber: { type: Number, required: true },
  snapshot: { type: Schema.Types.Mixed, required: true },
  changedFields: { type: [String], default: [] },
  changedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  changedByName: String,
  changedAt: { type: Date, default: Date.now },
  changeNote: { type: String, default: '' },
});

versionSchema.index({ entityType: 1, entityId: 1, versionNumber: -1 }, { unique: true });

export const Version = model('Version', versionSchema);
