import { Router } from 'express';
import { authenticate } from '../../common/middlewares/auth.middleware.js';
import { validate } from '../../common/middlewares/validate.middleware.js';
import * as controller from './member.controller.js';
import { updateOwnProfileSchema } from './member.validation.js';

const router = Router();

router.use(authenticate);
router.get('/me', controller.getOwn);
router.patch('/me', validate(updateOwnProfileSchema), controller.updateOwn);

export default router;
