import { PERMISSIONS } from '@scms/shared';
import { Router } from 'express';
import { authenticate } from '../../common/middlewares/auth.middleware.js';
import { authorize } from '../../common/middlewares/authorize.middleware.js';
import { validate } from '../../common/middlewares/validate.middleware.js';
import * as controller from './class-management.controller.js';
import {
  classIdSchema,
  listClassesSchema,
  sessionRosterSchema,
} from './class-management.validation.js';

const router = Router();

// Quản lý (class.read_all) hoặc coach xem học viên (class.view_roster); phạm vi lớp kiểm ở service.
const canManage = authorize(PERMISSIONS.CLASS_READ_ALL, PERMISSIONS.CLASS_VIEW_ROSTER);

router.use(authenticate, canManage);

router.get('/classes', validate(listClassesSchema), controller.list);
router.get('/classes/:id', validate(classIdSchema), controller.detail);
router.get('/sessions/:sessionId/roster', validate(sessionRosterSchema), controller.roster);

export default router;
