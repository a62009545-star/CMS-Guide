import { Schema, model, type InferSchemaType, type HydratedDocument } from 'mongoose';
import { ROLES } from '@cms/shared';

const bookmarkSchema = new Schema(
  {
    entityType: { type: String, enum: ['module', 'subtask'], required: true },
    entityId: { type: Schema.Types.ObjectId, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ROLES, default: 'viewer', index: true },
    bookmarks: { type: [bookmarkSchema], default: [] },
    readSubTasks: { type: [Schema.Types.ObjectId], default: [] },
    /** Incremented to invalidate every issued JWT (role change, password reset). */
    tokenVersion: { type: Number, default: 0 },
    lastLoginAt: Date,
  },
  { timestamps: true },
);

userSchema.set('toJSON', {
  transform: (_doc, ret: Record<string, unknown>) => {
    delete ret.passwordHash;
    delete ret.__v;
    delete ret.tokenVersion;
    return ret;
  },
});

export type UserDoc = HydratedDocument<InferSchemaType<typeof userSchema>>;
export const User = model('User', userSchema);
