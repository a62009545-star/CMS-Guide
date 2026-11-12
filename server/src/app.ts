import fs from 'node:fs';
import path from 'node:path';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import mongoose from 'mongoose';
import { env } from './config/env.js';
import { requireAuth, requireCsrfHeader } from './middleware/auth.js';
import { errorHandler } from './middleware/error.js';
import { activityRouter } from './routes/activity.js';
import { auditRouter } from './routes/audit.js';
import { authRouter } from './routes/auth.js';
import { mediaRouter } from './routes/media.js';
import { modulesRouter } from './routes/modules.js';
import { searchRouter } from './routes/search.js';
import { statsRouter } from './routes/stats.js';
import { subTasksRouter } from './routes/subtasks.js';
import { usersRouter } from './routes/users.js';
import { versionsRouter } from './routes/versions.js';
import { HttpError } from './utils/http.js';

export function createApp() {
  const app = express();
  app.set('trust proxy', 1);
  app.disable('x-powered-by');

  const mediaOrigins = [env.CLOUDFRONT_URL, env.useS3 ? `https://${env.AWS_S3_BUCKET}.s3.${env.AWS_REGION}.amazonaws.com` : '', env.S3_ENDPOINT ?? '']
    .filter(Boolean) as string[];

  app.use(
    helmet({
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          'img-src': ["'self'", 'data:', 'blob:', ...mediaOrigins],
          'media-src': ["'self'", 'blob:', ...mediaOrigins],
          'frame-src': ['https://www.youtube-nocookie.com', 'https://www.youtube.com', 'https://player.vimeo.com', 'https://*.sharepoint.com'],
          'connect-src': ["'self'", 'ws:', 'wss:', ...mediaOrigins, ...(env.useS3 ? [`https://${env.AWS_S3_BUCKET}.s3.${env.AWS_REGION}.amazonaws.com`, `https://${env.AWS_S3_BUCKET}.s3.amazonaws.com`] : [])],
          'font-src': ["'self'", 'https://fonts.gstatic.com', 'data:'],
          'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
          // Only force HTTPS sub-resources when the app is actually served over HTTPS.
          'upgrade-insecure-requests': env.cookieSecure ? [] : null,
        },
      },
      crossOriginEmbedderPolicy: false,
    }),
  );
  app.use(cors({ origin: env.corsOrigins, credentials: true }));
  app.use(compression());
  app.use(express.json({ limit: '2mb' }));
  app.use(cookieParser());
  if (env.NODE_ENV !== 'test') app.use(morgan(env.isProd ? 'combined' : 'dev'));

  app.get('/api/health', (_req, res) => {
    const db = mongoose.connection.readyState === 1;
    res.status(db ? 200 : 503).json({ ok: db, db: db ? 'up' : 'down' });
  });

  app.use('/api', requireCsrfHeader);
  app.use('/api/auth', authRouter);

  // Everything below requires a signed-in user. Role checks happen per route.
  app.use('/api', requireAuth);
  app.use('/api/modules', modulesRouter);
  app.use('/api/subtasks', subTasksRouter);
  app.use('/api/media', mediaRouter);
  app.use('/api/users', usersRouter);
  app.use('/api/audit', auditRouter);
  app.use('/api/versions', versionsRouter);
  app.use('/api/search', searchRouter);
  app.use('/api/activity', activityRouter);
  app.use('/api/stats', statsRouter);
  app.use('/api', (_req, _res, next) => next(new HttpError(404, 'Endpoint not found')));

  // Locally stored media (development without S3). express.static honours Range requests, so
  // videos stream instead of downloading in full.
  if (!env.useS3) {
    app.use('/uploads', requireAuth, express.static(path.resolve(env.LOCAL_UPLOAD_DIR), { maxAge: '7d', immutable: true, fallthrough: false }));
  }

  // Single-container production: serve the built SPA.
  if (env.CLIENT_DIST && fs.existsSync(env.CLIENT_DIST)) {
    const dist = path.resolve(env.CLIENT_DIST);
    app.use(express.static(dist, { index: false, maxAge: '1y', immutable: true }));
    app.get('*', (_req, res) => {
      res.set('Cache-Control', 'no-cache');
      res.sendFile(path.join(dist, 'index.html'));
    });
  }

  app.use(errorHandler);
  return app;
}
