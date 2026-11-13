import http from 'node:http';
import mongoose from 'mongoose';
import { createApp } from './app.js';
import { connectDb } from './config/db.js';
import { env } from './config/env.js';
import { User } from './models/index.js';
import { runMigrations, runSeed } from './seed/run.js';
import { initRealtime } from './services/realtime.js';

async function main() {
  await connectDb();
  if (env.SEED_ON_START && (await User.estimatedDocumentCount()) === 0) {
    console.log('Empty database: seeding admin account and sample content');
    await runSeed();
  } else {
    await runMigrations(); // adds content introduced after the first deploy, once
  }
  const app = createApp();
  const server = http.createServer(app);
  initRealtime(server);
  server.listen(env.PORT, () => console.log(`CMS Process Guide API listening on :${env.PORT}`));

  const shutdown = async (signal: string) => {
    console.log(`${signal} received, shutting down`);
    server.close();
    await mongoose.disconnect();
    process.exit(0);
  };
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
