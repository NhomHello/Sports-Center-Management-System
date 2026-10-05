import { PERMISSIONS as P } from '@scms/shared';
import { Router } from 'express';
import { authenticate } from '../../common/middlewares/auth.middleware.js';
import { authorize } from '../../common/middlewares/authorize.middleware.js';
import { validate } from '../../common/middlewares/validate.middleware.js';
import * as controller from './class.controller.js';
import * as booking from './class-enrollment.controller.js';
import { enrollForMemberSchema, cancelForMemberSchema } from './class-enrollment.validation.js';
import {
  classIdSchema,
  createClassSchema,
  listClassSchema,
  updateClassSchema,
} from './class.validation.js';
const router = Router();
router.use(authenticate);
router.post(
  '/:id/enrollments/me',
  authorize(P.CLASS_ENROLL_SELF),
  validate(classIdSchema),
  booking.enrollSelf,
);
router.delete(
  '/:id/enrollments/me',
  authorize(P.CLASS_CANCEL_SELF),
  validate(classIdSchema),
  booking.cancelSelf,
);
router.post(
  '/:id/enrollments',
  authorize(P.CLASS_ENROLL_FOR_MEMBER),
  validate(enrollForMemberSchema),
  booking.enrollForMember,
);
router.delete(
  '/:id/enrollments/:memberId',
  authorize(P.CLASS_ENROLL_FOR_MEMBER),
  validate(cancelForMemberSchema),
  booking.cancelForMember,
);
router.get(
  '/:id/roster',
  authorize(P.CLASS_VIEW_ROSTER, P.CLASS_READ_ALL),
  validate(classIdSchema),
  booking.roster,
);
router.get(
  '/',
  authorize(P.CLASS_READ, P.CLASS_READ_ALL),
  validate(listClassSchema),
  controller.list,
);
router.get(
  '/coaches',
  authorize(P.CLASS_CREATE, P.CLASS_UPDATE, P.CLASS_READ_ALL),
  controller.listCoaches,
);
router.get(
  '/:id',
  authorize(P.CLASS_READ, P.CLASS_READ_ALL),
  validate(classIdSchema),
  controller.getById,
);
router.post('/', authorize(P.CLASS_CREATE), validate(createClassSchema), controller.create);
router.put('/:id', authorize(P.CLASS_UPDATE), validate(updateClassSchema), controller.update);
router.delete('/:id', authorize(P.CLASS_DELETE), validate(classIdSchema), controller.cancel);
export default router;
