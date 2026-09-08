import { PERMISSIONS } from '@scms/shared';
import { Router } from 'express';
import { authenticate } from '../../common/middlewares/auth.middleware.js';
import { authorize } from '../../common/middlewares/authorize.middleware.js';
import * as controller from './permission.controller.js';

const router = Router();

router.use(authenticate);

router.get('/', authorize(PERMISSIONS.ROLE_READ), controller.list);

export default router;
