import { Router } from 'express';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import { Types } from 'mongoose';
import { z } from 'zod';
import { loginSchema, modulePath } from '@cms/shared';
import { clearAuthCookie, requireAuth, setAuthCookie, signToken } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { Module, SubTask, User } from '../models/index.js';
import { ah, HttpError } from '../utils/http.js';

export const authRouter = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many sign-in attempts. Try again in 15 minutes.' },
});

// A fixed dummy hash keeps response time similar whether or not the email exists.
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', 10);

authRouter.post(
  '/login',
  loginLimiter,
  validateBody(loginSchema),
  ah(async (req, res) => {
    const { email, password } = req.body as z.infer<typeof loginSchema>;
    const user = await User.findOne({ email }).select('+passwordHash +tokenVersion');
    const ok = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
    if (!user || !ok) throw new HttpError(401, 'Email or password is incorrect');
    user.lastLoginAt = new Date();
    await user.save();
    setAuthCookie(res, signToken(String(user._id), user.tokenVersion ?? 0));
    res.json({ user: user.toJSON() });
  }),
);

authRouter.post('/logout', (_req, res) => {
  clearAuthCookie(res);
  res.json({ ok: true });
});

authRouter.get(
  '/me',
  requireAuth,
  ah(async (req, res) => {
    const user = await User.findById(req.user!.id).lean();
    if (!user) throw new HttpError(401, 'Sign in to continue');
    const { passwordHash: _p, tokenVersion: _t, ...safe } = user as Record<string, unknown>;
    res.json({ user: safe });
  }),
);

/* ───────── Bookmarks ───────── */

const bookmarkSchema = z.object({ entityType: z.enum(['module', 'subtask']), entityId: z.string().regex(/^[a-f\d]{24}$/i) });

authRouter.post(
  '/me/bookmarks',
  requireAuth,
  validateBody(bookmarkSchema),
  ah(async (req, res) => {
    const { entityType, entityId } = req.body as z.infer<typeof bookmarkSchema>;
    const user = await User.findById(req.user!.id);
    if (!user) throw new HttpError(401, 'Sign in to continue');
    const idx = user.bookmarks.findIndex((b) => b.entityType === entityType && String(b.entityId) === entityId);
    if (idx >= 0) user.bookmarks.splice(idx, 1);
    else user.bookmarks.push({ entityType, entityId: new Types.ObjectId(entityId), createdAt: new Date() });
    await user.save();
    res.json({ bookmarked: idx < 0, bookmarks: user.bookmarks });
  }),
);

authRouter.get(
  '/me/bookmarks',
  requireAuth,
  ah(async (req, res) => {
    const user = await User.findById(req.user!.id).lean();
    const bms = user?.bookmarks ?? [];
    const modIds = bms.filter((b) => b.entityType === 'module').map((b) => b.entityId);
    const subIds = bms.filter((b) => b.entityType === 'subtask').map((b) => b.entityId);
    const [mods, subs] = await Promise.all([
      Module.find({ _id: { $in: modIds }, status: 'published' }).select('title slug section summary icon').lean(),
      SubTask.find({ _id: { $in: subIds }, status: 'published' }).select('title slug summary moduleId').lean(),
    ]);
    const parentMods = await Module.find({ _id: { $in: subs.map((s) => s.moduleId) } }).select('title slug section').lean();
    const pm = new Map(parentMods.map((m) => [String(m._id), m]));
    res.json({
      items: [
        ...mods.map((m) => ({ type: 'module', _id: m._id, title: m.title, summary: m.summary, path: modulePath(m.section, m.slug) })),
        ...subs.map((s) => {
          const p = pm.get(String(s.moduleId));
          return { type: 'subtask', _id: s._id, title: s.title, summary: s.summary, moduleTitle: p?.title, path: modulePath(p?.section, p?.slug ?? '', s.slug) };
        }),
      ],
    });
  }),
);

/* ───────── Mark as read ───────── */

authRouter.post(
  '/me/read/:subTaskId',
  requireAuth,
  ah(async (req, res) => {
    const id = req.params.subTaskId;
    if (!Types.ObjectId.isValid(id)) throw new HttpError(400, 'Invalid id');
    const user = await User.findById(req.user!.id);
    if (!user) throw new HttpError(401, 'Sign in to continue');
    const has = user.readSubTasks.some((r) => String(r) === id);
    if (has) user.readSubTasks = user.readSubTasks.filter((r) => String(r) !== id);
    else user.readSubTasks.push(new Types.ObjectId(id));
    await user.save();
    res.json({ read: !has, readSubTasks: user.readSubTasks });
  }),
);
