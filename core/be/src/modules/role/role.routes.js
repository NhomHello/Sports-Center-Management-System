import { PERMISSIONS } from '@scms/shared';
import { Router } from 'express';
import { authenticate } from '../../common/middlewares/auth.middleware.js';
import { authorize } from '../../common/middlewares/authorize.middleware.js';
import { validate } from '../../common/middlewares/validate.middleware.js';
import * as controller from './role.controller.js';
import { createRoleSchema, roleIdSchema, updateRoleSchema } from './role.validation.js';

const router = Router();

router.use(authenticate);

router.get('/', authorize(PERMISSIONS.ROLE_READ), controller.list);
router.post('/', authorize(PERMISSIONS.ROLE_CREATE), validate(createRoleSchema), controller.create);
router.get('/:id', authorize(PERMISSIONS.ROLE_READ), validate(roleIdSchema), controller.getById);
router.put(
  '/:id',
  authorize(PERMISSIONS.ROLE_UPDATE),
  validate(updateRoleSchema),
  controller.update,
);
router.delete(
  '/:id',
  authorize(PERMISSIONS.ROLE_DELETE),
  validate(roleIdSchema),
  controller.remove,
);
router.patch(
  '/:id/default',
  authorize(PERMISSIONS.ROLE_UPDATE),
  validate(roleIdSchema),
  controller.setDefault,
);

export default router;
