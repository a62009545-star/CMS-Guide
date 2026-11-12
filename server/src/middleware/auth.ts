import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import type { Role } from '@cms/shared';
import { env } from '../config/env.js';
import { User } from '../models/index.js';
import { HttpError } from '../utils/http.js';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

interface TokenPayload {
  sub: string;
  v: number;
}

export function signToken(userId: string, tokenVersion: number) {
  return jwt.sign({ sub: userId, v: tokenVersion } satisfies TokenPayload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });
}

export function setAuthCookie(res: Response, token: string) {
  res.cookie(env.COOKIE_NAME, token, {
    httpOnly: true,
    secure: env.cookieSecure,
    sameSite: 'lax',
    path: '/',
    maxAge: 8 * 60 * 60 * 1000,
  });
}

export function clearAuthCookie(res: Response) {
  res.clearCookie(env.COOKIE_NAME, { path: '/', httpOnly: true, secure: env.cookieSecure, sameSite: 'lax' });
}

/** Resolve a JWT to the current user record; returns null if invalid, expired or revoked. */
export async function userFromToken(token: string | undefined): Promise<AuthUser | null> {
  if (!token) return null;
  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as TokenPayload;
    const user = await User.findById(payload.sub).select('+tokenVersion').lean();
    if (!user || (user.tokenVersion ?? 0) !== payload.v) return null;
    return { id: String(user._id), name: user.name, email: user.email, role: user.role as Role };
  } catch {
    return null;
  }
}

export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const user = await userFromToken(req.cookies?.[env.COOKIE_NAME]);
  if (!user) return next(new HttpError(401, 'Sign in to continue'));
  req.user = user;
  next();
}

const rank: Record<Role, number> = { viewer: 0, editor: 1, admin: 2 };

export const isStaff = (u?: AuthUser) => !!u && rank[u.role] >= rank.editor;
export const isAdmin = (u?: AuthUser) => u?.role === 'admin';

export const requireRole = (min: Role) => (req: Request, _res: Response, next: NextFunction) => {
  if (!req.user) return next(new HttpError(401, 'Sign in to continue'));
  if (rank[req.user.role] < rank[min]) return next(new HttpError(403, 'You do not have permission to do this'));
  next();
};

/**
 * CSRF mitigation: the auth cookie is SameSite=Lax, and every state-changing request must also
 * carry a custom header, which a cross-site form post cannot set without a CORS preflight.
 */
export function requireCsrfHeader(req: Request, _res: Response, next: NextFunction) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  if (req.get('x-requested-with') !== 'cms-guide') return next(new HttpError(403, 'Missing request header'));
  next();
}
