import { PERMISSIONS as P } from '@scms/shared';
import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../../common/middlewares/auth.middleware.js';
import { authorize } from '../../common/middlewares/authorize.middleware.js';
import { validate } from '../../common/middlewares/validate.middleware.js';
import { excuse } from './attendance-excuse.controller.js';

const id = z.coerce.number().int().positive();
const excuseSchema = {
  params: z.object({ id }),
  body: z.object({ memberId: id.optional() }).strict(),
};

const router = Router();

router.post(
  '/classes/sessions/:id/excuse',
  authenticate,
  authorize(P.CLASS_CANCEL_SELF, P.CLASS_ENROLL_FOR_MEMBER),
  validate(excuseSchema),
  excuse,
);

export default router;
