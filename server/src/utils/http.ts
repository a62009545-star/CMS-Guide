import type { NextFunction, Request, RequestHandler, Response } from 'express';

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: unknown,
  ) {
    super(message);
  }
}

export const notFound = (what = 'Resource') => new HttpError(404, `${what} not found`);
export const forbidden = (msg = 'You do not have permission to do this') => new HttpError(403, msg);

/** Wrap async route handlers so rejected promises reach the error middleware (Express 4). */
export const ah =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler =>
  (req, res, next) => {
    fn(req, res, next).catch(next);
  };

export function paginate(page: number, limit: number) {
  return { skip: (page - 1) * limit, limit };
}

export function pageResult<T>(items: T[], total: number, page: number, limit: number) {
  return { items, total, page, limit, pages: Math.max(1, Math.ceil(total / limit)) };
}

export function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
