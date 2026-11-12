import { Router } from 'express';
import { isStaff } from '../middleware/auth.js';
import { parseQuery } from '../middleware/validate.js';
import { paginationSchema } from '@cms/shared';
import { AuditLog } from '../models/index.js';
import { ah, pageResult, paginate } from '../utils/http.js';

export const activityRouter = Router();

/** "What's New": recent content changes. Viewers only see changes to published content. */
activityRouter.get(
  '/',
  ah(async (req, res) => {
    const { page, limit } = parseQuery(paginationSchema, req.query);
    const filter: Record<string, unknown> = { entityType: { $in: ['module', 'subtask'] } };
    if (!isStaff(req.user)) filter.visibleToViewers = true;
    const { skip } = paginate(page, limit);
    const [items, total] = await Promise.all([
      AuditLog.find(filter).sort({ timestamp: -1 }).skip(skip).limit(limit).select('userName action entityType entityTitle path timestamp visibleToViewers').lean(),
      AuditLog.countDocuments(filter),
    ]);
    res.json(pageResult(items, total, page, limit));
  }),
);
