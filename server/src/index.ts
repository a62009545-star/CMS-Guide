import http from 'node:http';
import mongoose from 'mongoose';
import { createApp } from './app.js';
import { connectDb } from './config/db.js';
import { env } from './config/env.js';
import { initRealtime } from './services/realtime.js';

async function main() {
  await connectDb();
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
