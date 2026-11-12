import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { paginationSchema, ROLES, userCreateSchema, userUpdateSchema } from '@cms/shared';
import { requireRole } from '../middleware/auth.js';
import { parseQuery, validateBody } from '../middleware/validate.js';
import { User } from '../models/index.js';
import { record } from '../services/audit.js';
import { ah, escapeRegex, HttpError, notFound, pageResult, paginate } from '../utils/http.js';

export const usersRouter = Router();
usersRouter.use(requireRole('admin'));

const listQuery = paginationSchema.extend({ q: z.string().trim().max(100).optional(), role: z.enum(ROLES).optional() });

usersRouter.get(
  '/',
  ah(async (req, res) => {
    const { page, limit, q, role } = parseQuery(listQuery, req.query);
    const filter: Record<string, unknown> = {};
    if (role) filter.role = role;
    if (q) {
      const rx = { $regex: escapeRegex(q), $options: 'i' };
      filter.$or = [{ name: rx }, { email: rx }];
    }
    const { skip } = paginate(page, limit);
    const [items, total] = await Promise.all([
      User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).select('name email role createdAt lastLoginAt').lean(),
      User.countDocuments(filter),
    ]);
    res.json(pageResult(items, total, page, limit));
  }),
);

usersRouter.post(
  '/',
  validateBody(userCreateSchema),
  ah(async (req, res) => {
    const { password, ...rest } = req.body as z.infer<typeof userCreateSchema>;
    const user = await User.create({ ...rest, passwordHash: await bcrypt.hash(password, 12) });
    await record({ user: req.user!, action: 'create', entityType: 'user', entityId: user._id, entityTitle: user.email, notify: false, meta: { role: user.role } });
    res.status(201).json(user.toJSON());
  }),
);

usersRouter.patch(
  '/:id',
  validateBody(userUpdateSchema),
  ah(async (req, res) => {
    const input = req.body as z.infer<typeof userUpdateSchema>;
    const user = await User.findById(req.params.id).select('+tokenVersion');
    if (!user) throw notFound('User');
    if (input.role && input.role !== 'admin' && user.role === 'admin') {
      const admins = await User.countDocuments({ role: 'admin' });
      if (admins <= 1) throw new HttpError(409, 'Keep at least one Admin. Promote someone else first.');
    }
    const prevRole = user.role;
    if (input.name) user.name = input.name;
    if (input.role) user.role = input.role;
    if (input.password) user.passwordHash = await bcrypt.hash(input.password, 12);
    // Role or password changes sign the user out everywhere.
    if ((input.role && input.role !== prevRole) || input.password) user.tokenVersion = (user.tokenVersion ?? 0) + 1;
    await user.save();
    await record({
      user: req.user!,
      action: input.role && input.role !== prevRole ? 'role_change' : 'update',
      entityType: 'user',
      entityId: user._id,
      entityTitle: user.email,
      notify: false,
      meta: input.role ? { from: prevRole, to: input.role } : null as never,
    });
    res.json(user.toJSON());
  }),
);

usersRouter.delete(
  '/:id',
  ah(async (req, res) => {
    if (req.params.id === req.user!.id) throw new HttpError(409, 'You cannot delete your own account');
    const user = await User.findById(req.params.id);
    if (!user) throw notFound('User');
    if (user.role === 'admin' && (await User.countDocuments({ role: 'admin' })) <= 1) {
      throw new HttpError(409, 'Keep at least one Admin');
    }
    await user.deleteOne();
    await record({ user: req.user!, action: 'delete', entityType: 'user', entityId: user._id, entityTitle: user.email, notify: false });
    res.json({ ok: true });
  }),
);
