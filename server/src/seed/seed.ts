import mongoose from 'mongoose';
import { connectDb } from '../config/db.js';
import { runSeed } from './run.js';

// CLI: npm run seed [-- --reset]
connectDb()
  .then(() => runSeed({ reset: process.argv.includes('--reset') }))
  .then(() => mongoose.disconnect())
  .catch(async (err) => {
    console.error(err);
    await mongoose.disconnect();
    process.exit(1);
  });
