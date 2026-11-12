import type { ErrorRequestHandler } from 'express';
import mongoose from 'mongoose';
import multer from 'multer';
import { env } from '../config/env.js';
import { HttpError } from '../utils/http.js';

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.message, details: err.details });
  }
  if (err instanceof multer.MulterError) {
    const msg = err.code === 'LIMIT_FILE_SIZE' ? 'File is larger than the allowed size' : err.message;
    return res.status(413).json({ error: msg });
  }
  if (err instanceof mongoose.Error.CastError) {
    return res.status(400).json({ error: 'Invalid id' });
  }
  if (err instanceof mongoose.Error.ValidationError) {
    return res.status(422).json({ error: 'Some fields need attention', details: Object.values(err.errors).map((e) => ({ path: e.path, message: e.message })) });
  }
  if ((err as { code?: number })?.code === 11000) {
    const field = Object.keys((err as { keyValue?: object }).keyValue ?? {})[0] ?? 'value';
    return res.status(409).json({ error: `That ${field} is already in use` });
  }
  const status = (err as { status?: number; statusCode?: number })?.status ?? (err as { statusCode?: number })?.statusCode;
  if (typeof status === 'number' && status >= 400 && status < 500) {
    return res.status(status).json({ error: status === 404 ? 'Not found' : String(err.message) });
  }
  console.error(err);
  res.status(500).json({ error: env.isProd ? 'Something went wrong on the server' : String(err?.message ?? err) });
};
