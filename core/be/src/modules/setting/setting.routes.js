import { PERMISSIONS } from '@scms/shared';
import { Router } from 'express';
import { authenticate } from '../../common/middlewares/auth.middleware.js';
import { authorize } from '../../common/middlewares/authorize.middleware.js';
import { validate } from '../../common/middlewares/validate.middleware.js';
import * as controller from './setting.controller.js';
import { updateSettingsSchema } from './setting.validation.js';

const router = Router();

router.use(authenticate);

router.get('/', authorize(PERMISSIONS.SETTING_READ), controller.list);
router.put(
  '/',
  authorize(PERMISSIONS.SETTING_UPDATE),
  validate(updateSettingsSchema),
  controller.updateMany,
);

export default router;
