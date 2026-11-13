import { Schema, model } from 'mongoose';

/** One-time data migrations that have already run, so they never run twice. */
const migrationSchema = new Schema({
  name: { type: String, required: true, unique: true },
  appliedAt: { type: Date, default: Date.now },
});

export const Migration = model('Migration', migrationSchema);
