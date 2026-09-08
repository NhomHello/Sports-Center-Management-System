import { PERMISSIONS } from '@scms/shared';
import { Router } from 'express';
import { authenticate } from '../../common/middlewares/auth.middleware.js';
import { authorize } from '../../common/middlewares/authorize.middleware.js';
import { validate } from '../../common/middlewares/validate.middleware.js';
import * as controller from './user.controller.js';
import {
  createUserSchema,
  listUsersSchema,
  updateUserRoleSchema,
  updateUserStatusSchema,
  userIdSchema,
} from './user.validation.js';

const router = Router();

router.use(authenticate);

router.get('/', authorize(PERMISSIONS.USER_READ), validate(listUsersSchema), controller.list);
router.post('/', authorize(PERMISSIONS.USER_CREATE), validate(createUserSchema), controller.create);
router.get('/:id', authorize(PERMISSIONS.USER_READ), validate(userIdSchema), controller.getById);
router.patch(
  '/:id/role',
  authorize(PERMISSIONS.USER_ASSIGN_ROLE),
  validate(updateUserRoleSchema),
  controller.updateRole,
);
router.patch(
  '/:id/status',
  authorize(PERMISSIONS.USER_UPDATE, PERMISSIONS.USER_DELETE),
  validate(updateUserStatusSchema),
  controller.updateStatus,
);

export default router;
