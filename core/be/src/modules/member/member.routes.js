import { Router } from 'express';
import { PERMISSIONS } from '@scms/shared';
import { authenticate } from '../../common/middlewares/auth.middleware.js';
import { authorize } from '../../common/middlewares/authorize.middleware.js';
import { validate } from '../../common/middlewares/validate.middleware.js';
import * as controller from './member.controller.js';
import { listMembersSchema, updateOwnProfileSchema } from './member.validation.js';

const router = Router();
router.use(authenticate);
router.get('/me', controller.getOwn);
router.patch('/me', validate(updateOwnProfileSchema), controller.updateOwn);
router.get('/', authorize(PERMISSIONS.MEMBER_READ), validate(listMembersSchema), controller.list);
export default router;
