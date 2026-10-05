import { Router } from 'express';
import { PERMISSIONS } from '@scms/shared';
import { authenticate } from '../../common/middlewares/auth.middleware.js';
import { authorize } from '../../common/middlewares/authorize.middleware.js';
import { validate } from '../../common/middlewares/validate.middleware.js';
import * as controller from './member.controller.js';
import { memberEnrollments } from '../class/class-enrollment.controller.js';
import {
  createMemberSchema,
  listMembersSchema,
  memberIdSchema,
  updateOwnProfileSchema,
  updateMemberSchema,
} from './member.validation.js';

const router = Router();

router.use(authenticate);
router.get(
  '/:id/enrollments',
  authorize(PERMISSIONS.CLASS_ENROLL_FOR_MEMBER, PERMISSIONS.CLASS_READ_ALL),
  validate(memberIdSchema),
  memberEnrollments,
);

router.get('/me', controller.getOwn);
router.patch('/me', validate(updateOwnProfileSchema), controller.updateOwn);
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

router.put(
  '/:id',
  authorize(PERMISSIONS.MEMBER_UPDATE),
  validate(updateMemberSchema),
  controller.update,
);
export default router;
