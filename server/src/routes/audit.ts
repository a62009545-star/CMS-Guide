import { Router } from 'express';
import { Types } from 'mongoose';
import { z } from 'zod';
import { AUDIT_ACTIONS, ENTITY_TYPES, paginationSchema } from '@cms/shared';
import { requireRole } from '../middleware/auth.js';
import { parseQuery } from '../middleware/validate.js';
import { AuditLog } from '../models/index.js';
import { ah, pageResult, paginate } from '../utils/http.js';

export const auditRouter = Router();

const query = paginationSchema.extend({
  entityType: z.enum(ENTITY_TYPES).optional(),
  action: z.enum(AUDIT_ACTIONS).optional(),
  userId: z.string().regex(/^[a-f\d]{24}$/i).optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

auditRouter.get(
  '/',
  requireRole('admin'),
  ah(async (req, res) => {
    const { page, limit, entityType, action, userId, from, to } = parseQuery(query, req.query);
    const filter: Record<string, unknown> = {};
    if (entityType) filter.entityType = entityType;
    if (action) filter.action = action;
    if (userId) filter.userId = new Types.ObjectId(userId);
    if (from || to) filter.timestamp = { ...(from && { $gte: from }), ...(to && { $lte: to }) };
    const { skip } = paginate(page, limit);
    const [items, total] = await Promise.all([
      AuditLog.find(filter).sort({ timestamp: -1 }).skip(skip).limit(limit).lean(),
      AuditLog.countDocuments(filter),
    ]);
    res.json(pageResult(items, total, page, limit));
  }),
);
