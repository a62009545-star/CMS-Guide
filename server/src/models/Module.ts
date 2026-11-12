import { Schema, model, type InferSchemaType, type HydratedDocument } from 'mongoose';
import { GUIDELINE_TYPES, STATUSES } from '@cms/shared';

export const richTextDef = {
  html: { type: String, default: '' },
  json: { type: Schema.Types.Mixed, default: null },
};

const moduleSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    icon: { type: String, default: 'box' },
    summary: { type: String, default: '' },
    order: { type: Number, default: 0, index: true },
    e2eContent: { type: new Schema(richTextDef, { _id: false }), default: () => ({}) },
    flowSteps: [{ title: { type: String, required: true }, description: { type: String, default: '' } }],
    heroMedia: { type: Schema.Types.ObjectId, ref: 'Media', default: null },
    guidelines: [{ type: { type: String, enum: GUIDELINE_TYPES, required: true }, text: { type: String, required: true } }],
    faqs: [{ q: { type: String, required: true }, a: { type: String, required: true } }],
    status: { type: String, enum: STATUSES, default: 'draft', index: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    /** Unpublished changes submitted by an Editor to already-published content. */
    pendingDraft: { type: Schema.Types.Mixed, default: null },
    pendingDraftBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    pendingDraftAt: { type: Date, default: null },
    /** Plain text of all searchable fields — powers the fallback text index. */
    searchText: { type: String, default: '', select: false },
    publishedAt: Date,
  },
  { timestamps: true },
);

moduleSchema.index({ title: 'text', summary: 'text', searchText: 'text' }, { weights: { title: 10, summary: 5, searchText: 1 }, name: 'module_text' });

export type ModuleDoc = HydratedDocument<InferSchemaType<typeof moduleSchema>>;
export const Module = model('Module', moduleSchema);
