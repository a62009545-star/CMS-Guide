import { Schema, model, type InferSchemaType } from 'mongoose';
import { MEDIA_TYPES } from '@cms/shared';

const mediaSchema = new Schema(
  {
    url: { type: String, required: true },
    type: { type: String, enum: MEDIA_TYPES, required: true, index: true },
    s3Key: { type: String, default: null },
    caption: { type: String, default: '' },
    altText: { type: String, default: '' },
    mimeType: String,
    size: Number,
    uploadedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

mediaSchema.index({ caption: 'text', altText: 'text' });

export type MediaShape = InferSchemaType<typeof mediaSchema>;
export const Media = model('Media', mediaSchema);
