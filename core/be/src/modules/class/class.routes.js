import { PERMISSIONS as P } from '@scms/shared';
import { Router } from 'express';
import { authenticate } from '../../common/middlewares/auth.middleware.js';
import { authorize } from '../../common/middlewares/authorize.middleware.js';
import { validate } from '../../common/middlewares/validate.middleware.js';
import * as controller from './class.controller.js';
import { createClassSchema } from './class.validation.js';

const router = Router();

router.use(authenticate);

router.post('/', authorize(P.CLASS_CREATE), validate(createClassSchema), controller.create);

export default router;
