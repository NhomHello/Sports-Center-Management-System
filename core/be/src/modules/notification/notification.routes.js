import { Router } from 'express';
import { authenticate } from '../../common/middlewares/auth.middleware.js';
import { validate } from '../../common/middlewares/validate.middleware.js';
import * as controller from './notification.controller.js';
import {
  markNotificationsReadSchema,
  notificationIdSchema,
  notificationListSchema,
} from './notification.validation.js';

const router = Router();

router.use(authenticate);
router.get('/', validate(notificationListSchema), controller.list);
router.patch('/read', validate(markNotificationsReadSchema), controller.markManyRead);
router.patch('/:id/read', validate(notificationIdSchema), controller.markRead);
export default router;
