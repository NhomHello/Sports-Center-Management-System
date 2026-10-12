import { PERMISSIONS as P } from '@scms/shared';
import { Router } from 'express';
import { authenticate } from '../../common/middlewares/auth.middleware.js';
import { authorize } from '../../common/middlewares/authorize.middleware.js';
import { validate } from '../../common/middlewares/validate.middleware.js';
import * as controller from './class.controller.js';
import {
  classIdSchema,
  createClassSchema,
  listClassSchema,
  updateClassSchema,
} from './class.validation.js';

const router = Router();

router.use(authenticate);

router.get('/', authorize(P.CLASS_READ), validate(listClassSchema), controller.list);

router.get('/:id', authorize(P.CLASS_READ), validate(classIdSchema), controller.getById);

router.post('/', authorize(P.CLASS_CREATE), validate(createClassSchema), controller.create);

router.put('/:id', authorize(P.CLASS_UPDATE), validate(updateClassSchema), controller.update);

export default router;
