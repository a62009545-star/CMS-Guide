import type { RequestHandler } from 'express';
import type { ZodTypeAny, z } from 'zod';
import { HttpError } from '../utils/http.js';

function format(err: z.ZodError) {
  return err.issues.map((i) => ({ path: i.path.join('.'), message: i.message }));
}

export const validateBody =
  (schema: ZodTypeAny): RequestHandler =>
  (req, _res, next) => {
    const r = schema.safeParse(req.body);
    if (!r.success) return next(new HttpError(422, 'Some fields need attention', format(r.error)));
    req.body = r.data;
    next();
  };

export function parseQuery<T extends ZodTypeAny>(schema: T, query: unknown): z.infer<T> {
  const r = schema.safeParse(query);
  if (!r.success) throw new HttpError(400, 'Invalid query parameters', format(r.error));
  return r.data;
}
