import { Router } from 'express';
import { z } from 'zod';
import { PERMISSIONS as P } from '@scms/shared';
import { authenticate } from '../../common/middlewares/auth.middleware.js';
import { authorize } from '../../common/middlewares/authorize.middleware.js';
import { validate } from '../../common/middlewares/validate.middleware.js';
import { paginationQuerySchema } from '../../common/utils/pagination.js';
import { sendSuccess } from '../../common/utils/api-response.js';
import { Enums } from '../../config/db.js';
import { listOwn } from './attendance-history.service.js';
const router = Router();
const schema = {
  query: paginationQuerySchema
    .extend({
      from: z.iso.date().optional(),
      to: z.iso.date().optional(),
      classId: z.coerce.number().int().positive().optional(),
      status: z.nativeEnum(Enums.AttendanceStatus).optional(),
    })
    .strict()
    .refine((q) => !q.from || !q.to || q.to >= q.from, 'Khoảng ngày không hợp lệ'),
};
router.get(
  '/me',
  authenticate,
  authorize(P.SCHEDULE_VIEW_OWN),
  validate(schema),
  async (req, res) => {
    const { items, meta } = await listOwn(req.user.id, req.validated.query);
    sendSuccess(res, { data: items, meta });
  },
);
export default router;
