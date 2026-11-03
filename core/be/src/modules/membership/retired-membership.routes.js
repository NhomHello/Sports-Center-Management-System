import { Router } from 'express';
import { StatusCodes } from 'http-status-codes';
import { ERROR_CODES } from '@scms/shared';
import { authenticate } from '../../common/middlewares/auth.middleware.js';
import { ApiError } from '../../common/errors/api-error.js';
const router = Router();
// Các bảng và hoá đơn cũ được giữ để đối soát, không còn API bán/gia hạn/bảo lưu gói.
router.use(['/memberships', '/membership-plans'], authenticate, () => {
  throw new ApiError(
    StatusCodes.GONE,
    ERROR_CODES.BUSINESS_RULE_VIOLATION,
    'Trung tâm đã chuyển sang bán khóa học. Vui lòng chọn khóa học để đăng ký.',
  );
});
export default router;
