import { PERMISSIONS as P } from '@scms/shared';
import { Enums } from '../../config/db.js';
import { createForUsers } from '../notification/notification.service.js';
import { fmtMoney } from './payment-notify.service.js';
import { refundCode } from './refund-reference.js';

/** Thông báo chờ hoàn được lưu cùng transaction; chỉ nhân viên có quyền hoàn nhận chi tiết tiền. */
export const notifyRefundRequested = async (db, refund, { userId, reason }) => {
  const member = await db.user.findUniqueOrThrow({
    where: { id: userId },
    select: { fullName: true },
  });
  const staff = await db.user.findMany({
    where: {
      status: Enums.UserStatus.ACTIVE,
      role: { permissions: { some: { permission: { code: P.PAYMENT_REFUND } } } },
    },
    select: { id: true },
  });
  const code = refundCode(refund.id);
  await createForUsers({
    db,
    userIds: [userId],
    kind: Enums.NotificationKind.PAYMENT_REFUND,
    title: `Yêu cầu hoàn tiền ${code} đã được tạo`,
    message: `Số tiền ${fmtMoney(refund.amount)}. ${reason}. Vui lòng liên hệ trung tâm và cung cấp mã ${code} để được chuyển trả.`,
    eventKey: `refund:${refund.id}:requested:member`,
  });
  await createForUsers({
    db,
    userIds: staff.map((user) => user.id).filter((id) => id !== userId),
    kind: Enums.NotificationKind.PAYMENT_REFUND,
    title: `Cần xử lý hoàn tiền ${code}`,
    message: `${member.fullName}: ${fmtMoney(refund.amount)}. ${reason}. Tra cứu mã ${code} để xử lý.`,
    eventKey: `refund:${refund.id}:requested:staff`,
  });
};

/** Chỉ gửi "đã hoàn" sau khi nhân viên xác nhận chuyển trả thành công, không gửi lúc tạo yêu cầu. */
export const notifyRefundCompleted = async (db, refund) => {
  const source = await db.refund.findUniqueOrThrow({
    where: { id: refund.id },
    include: { invoice: { select: { userId: true } }, case: { select: { userId: true } } },
  });
  const userId = source.invoice?.userId ?? source.case?.userId;
  if (!userId) return;
  await createForUsers({
    db,
    userIds: [userId],
    kind: Enums.NotificationKind.PAYMENT_REFUND,
    title: `Đã hoàn tiền ${refundCode(refund.id)}`,
    message: `Trung tâm đã xác nhận chuyển trả ${fmtMoney(refund.amount)}. Mã tham chiếu: ${refund.reference}.`,
    eventKey: `refund:${refund.id}:completed`,
  });
};
