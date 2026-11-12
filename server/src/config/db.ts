import mongoose from 'mongoose';
import { env } from './env.js';

export async function connectDb(uri = env.MONGODB_URI) {
  mongoose.set('strictQuery', true);
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10_000 });
  console.log(`MongoDB connected (${mongoose.connection.name})`);
  return mongoose.connection;
}
