import { Schema, model, type InferSchemaType, type HydratedDocument } from 'mongoose';
import { CALLOUT_TYPES, STATUSES } from '@cms/shared';
import { richTextDef } from './Module.js';

const stepSchema = new Schema({
  order: { type: Number, default: 0 },
  title: { type: String, required: true },
  content: { type: new Schema(richTextDef, { _id: false }), default: () => ({}) },
  media: [{ type: Schema.Types.ObjectId, ref: 'Media' }],
  callout: {
    type: new Schema({ type: { type: String, enum: CALLOUT_TYPES }, text: String }, { _id: false }),
    default: null,
  },
});

const subTaskSchema = new Schema(
  {
    moduleId: { type: Schema.Types.ObjectId, ref: 'Module', required: true, index: true },
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, lowercase: true },
    summary: { type: String, default: '' },
    order: { type: Number, default: 0 },
    prerequisites: { type: [String], default: [] },
    expectedOutcome: { type: String, default: '' },
    steps: { type: [stepSchema], default: [] },
    relatedSubTaskIds: [{ type: Schema.Types.ObjectId, ref: 'SubTask' }],
    status: { type: String, enum: STATUSES, default: 'draft', index: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    pendingDraft: { type: Schema.Types.Mixed, default: null },
    pendingDraftBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    pendingDraftAt: { type: Date, default: null },
    searchText: { type: String, default: '', select: false },
    publishedAt: Date,
  },
  { timestamps: true },
);

subTaskSchema.index({ moduleId: 1, slug: 1 }, { unique: true });
subTaskSchema.index({ moduleId: 1, order: 1 });
subTaskSchema.index({ title: 'text', summary: 'text', searchText: 'text' }, { weights: { title: 10, summary: 5, searchText: 1 }, name: 'subtask_text' });

export type SubTaskDoc = HydratedDocument<InferSchemaType<typeof subTaskSchema>>;
export const SubTask = model('SubTask', subTaskSchema);
