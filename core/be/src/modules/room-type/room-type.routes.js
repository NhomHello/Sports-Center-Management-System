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
router.get('/', authorize(P.ROOM_READ, P.CLASS_CREATE, P.CLASS_UPDATE), controller.list);
router.post('/', authorize(P.ROOM_CREATE), validate(createRoomTypeSchema), controller.create);
router.put('/:id', authorize(P.ROOM_UPDATE), validate(updateRoomTypeSchema), controller.update);
export default router;
