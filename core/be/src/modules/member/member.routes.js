import { PERMISSIONS } from '@scms/shared';
import { Router } from 'express';
import { authenticate } from '../../common/middlewares/auth.middleware.js';
import { authorize } from '../../common/middlewares/authorize.middleware.js';
import { validate } from '../../common/middlewares/validate.middleware.js';
import * as controller from './member.controller.js';
import { createMemberSchema, listMembersSchema, memberIdSchema } from './member.validation.js';

const router = Router();

router.use(authenticate);

router.get('/', authorize(PERMISSIONS.MEMBER_READ), validate(listMembersSchema), controller.list);

router.post(
  '/',
  authorize(PERMISSIONS.MEMBER_CREATE),
  validate(createMemberSchema),
  controller.create,
);

router.get(
  '/:id',
  authorize(PERMISSIONS.MEMBER_READ),
  validate(memberIdSchema),
  controller.getById,
);

export default router;
