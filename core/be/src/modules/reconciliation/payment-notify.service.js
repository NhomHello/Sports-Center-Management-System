import { PERMISSIONS } from '@scms/shared';
import { Enums, prisma } from '../../config/db.js';
import { logger } from '../../config/logger.js';
import { TIME } from '../../constants/index.js';
import { createForUsers } from '../notification/notification.service.js';

const money = new Intl.NumberFormat('vi-VN');
const dateTime = new Intl.DateTimeFormat('vi-VN', {
  timeZone: TIME.VIETNAM_ZONE,
  dateStyle: 'short',
  timeStyle: 'short',
});

/** Định dạng tiền cho nội dung thông báo. */
export const fmtMoney = (value) => `${money.format(value)} đ`;
/** Định dạng thời điểm theo giờ Việt Nam (BR-0.3). */
export const fmtTime = (value) => dateTime.format(value);

/** Người nhận cảnh báo đối soát: theo permission trong DB, không theo tên role. */
const findReconcilers = async () => {
  const users = await prisma.user.findMany({
    where: {
      status: Enums.UserStatus.ACTIVE,
      role: { permissions: { some: { permission: { code: PERMISSIONS.PAYMENT_RECONCILE } } } },
    },
    select: { id: true },
  });
  return users.map((user) => user.id);
};

/**
 * Thông báo cho hội viên. eventKey chống gửi trùng khi webhook/job chạy lại.
 * @param {{ userId: number, kind: string, title: string, message: string, eventKey: string }} notice
 */
export const toMember = ({ userId, ...notice }) => ({ ...notice, userIds: [userId] });

/** Cảnh báo cho mọi người có quyền đối soát (BR-PAY-18: chuyển lặp là cảnh báo mức cao). */
export const toReconcilers = (notice) => ({
  ...notice,
  kind: Enums.NotificationKind.PAYMENT_REVIEW_ALERT,
  reconcilers: true,
});

/**
 * Gửi danh sách thông báo sau khi transaction đã commit. Lỗi gửi chỉ ghi log, không làm hỏng
 * kết quả ghi nhận tiền (BR-PAY-09).
 * @param {Array<object>} notices
 */
export const sendNotices = async (notices = []) => {
  if (notices.length === 0) return;
  try {
    const reconcilers = notices.some((item) => item.reconcilers) ? await findReconcilers() : [];
    for (const { reconcilers: toStaff, userIds, ...notice } of notices) {
      await createForUsers({ ...notice, userIds: toStaff ? reconcilers : userIds });
    }
  } catch (err) {
    logger.error({ err }, 'Gửi thông báo thanh toán thất bại');
  }
};
