import { Router } from 'express';
import { PERMISSIONS as P } from '@scms/shared';
import { authenticate } from '../../common/middlewares/auth.middleware.js';
import { authorize } from '../../common/middlewares/authorize.middleware.js';
import { validate } from '../../common/middlewares/validate.middleware.js';
import * as controller from './operating-frame.controller.js';
import { createFrameSchema, updateFrameSchema } from './operating-frame.validation.js';

/** /operating-frames: khung giờ hoạt động; xem khi xếp lịch/bán gói, sửa là cấu hình vận hành. */
const router = Router();
router.use(authenticate);
router.get(
  '/',
  authorize(P.ROOM_READ, P.CLASS_CREATE, P.CLASS_UPDATE, P.MEMBERSHIP_PLAN_READ, P.SETTING_READ),
  controller.list,
);
router.post('/', authorize(P.SETTING_UPDATE), validate(createFrameSchema), controller.create);
router.put('/:id', authorize(P.SETTING_UPDATE), validate(updateFrameSchema), controller.update);
export default router;
