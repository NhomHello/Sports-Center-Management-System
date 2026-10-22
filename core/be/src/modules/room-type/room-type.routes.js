import { Router } from 'express';
import { PERMISSIONS as P } from '@scms/shared';
import { authenticate } from '../../common/middlewares/auth.middleware.js';
import { authorize } from '../../common/middlewares/authorize.middleware.js';
import { validate } from '../../common/middlewares/validate.middleware.js';
import * as controller from './room-type.controller.js';
import { createRoomTypeSchema, updateRoomTypeSchema } from './room-type.validation.js';

/** /room-types: loại phòng (chức năng, bộ môn được dạy, khu tự tập); dùng quyền phòng tập. */
const router = Router();
router.use(authenticate);
// Người sửa gói chọn khu tự tập; lễ tân chọn khu vực khi check-in.
router.get(
  '/',
  authorize(
    P.ROOM_READ,
    P.CLASS_CREATE,
    P.CLASS_UPDATE,
    P.MEMBERSHIP_PLAN_CREATE,
    P.MEMBERSHIP_PLAN_UPDATE,
    P.ATTENDANCE_CHECK_IN,
  ),
  controller.list,
);
router.post('/', authorize(P.ROOM_CREATE), validate(createRoomTypeSchema), controller.create);
router.put('/:id', authorize(P.ROOM_UPDATE), validate(updateRoomTypeSchema), controller.update);
export default router;
