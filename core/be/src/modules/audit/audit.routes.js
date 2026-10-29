import { Router } from 'express';
import { PERMISSIONS } from '@scms/shared';
import { authenticate } from '../../common/middlewares/auth.middleware.js';
import { authorize } from '../../common/middlewares/authorize.middleware.js';
import { validate } from '../../common/middlewares/validate.middleware.js';
import { auditListSchema } from './audit.validation.js';
import { list } from './audit.controller.js';

const router = Router();
router.use(authenticate, authorize(PERMISSIONS.AUDIT_READ));
router.get('/', validate(auditListSchema), list);
export default router;
