import { PERMISSIONS as P } from '@scms/shared';
import { sendCreated } from '../../common/utils/api-response.js';
import { Enums } from '../../config/db.js';
import * as service from './course-order.service.js';

/**
 * POST /classes/:id/orders — hội viên tự mua (ONLINE, chính mình); nhân viên có quyền đăng ký hộ
 * gửi memberId và mặc định thu tại quầy.
 */
export const create = async (req, res) => {
  const { memberId, channel } = req.validated.body;
  const forMember = Boolean(memberId) && req.permissions.has(P.CLASS_ENROLL_FOR_MEMBER);
  const invoice = await service.createCourseOrder(
    {
      classId: req.validated.params.id,
      memberId: forMember ? memberId : req.user.id,
      channel: forMember ? (channel ?? Enums.InvoiceChannel.COUNTER) : Enums.InvoiceChannel.ONLINE,
    },
    req.user,
  );
  sendCreated(res, invoice, 'Đã giữ chỗ, chờ thanh toán khóa học');
};
