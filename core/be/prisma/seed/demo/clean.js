/**
 * Reset dữ liệu nghiệp vụ của DB dev về trống để dựng lại demo.
 * GIỮ: permissions, roles, system_settings (gồm tài khoản nhận tiền SePay), tài khoản admin
 * (SEED_ADMIN_EMAIL), bảng migration và các bảng legacy Sprint 1 không còn trong schema.
 * XOÁ: hoá đơn, thanh toán, đối soát, gói hội viên, lớp/buổi/đăng ký, thông báo, nhật ký,
 * bộ môn, loại phòng, phòng, gói tập và mọi tài khoản khác (khung giờ hoạt động là cấu hình, được giữ).
 *
 * Chạy: npm run db:clean -- --yes   (từ chối khi NODE_ENV=production hoặc thiếu --yes)
 */
import { prisma } from '../../../src/config/db.js';
import { env } from '../../../src/config/env.js';
import { logger } from '../../../src/config/logger.js';

// Thứ tự con → cha để không vướng khoá ngoại; không tắt FOREIGN_KEY_CHECKS.
const TABLES_IN_ORDER = [
  'reconciliationContact',
  'refund',
  'reconciliationCase',
  'paymentWebhookLog',
  'payment',
  'invoice',
  'membershipFreeze',
  'membership',
  'attendance',
  'checkIn',
  'classWaitlist',
  'classEnrollment',
  'classEvent',
  'roomMaintenance',
  'classSession',
  'gymClass',
  'subject',
  'room',
  'roomType',
  'membershipPlan',
  'notification',
  'auditLog',
  'loginThrottle',
  'emailVerificationToken',
];

/**
 * Xoá dữ liệu nghiệp vụ trong một transaction; trả số dòng đã xoá theo bảng.
 * @returns {Promise<Record<string, number>>}
 */
export const cleanDatabase = () =>
  prisma.$transaction(
    async (tx) => {
      const deleted = {};
      for (const model of TABLES_IN_ORDER) {
        deleted[model] = (await tx[model].deleteMany({})).count;
      }
      deleted.user = (
        await tx.user.deleteMany({ where: { email: { not: env.SEED_ADMIN_EMAIL } } })
      ).count;
      return deleted;
    },
    { timeout: 120000 },
  );

const isEntry = process.argv[1]?.endsWith('clean.js');
if (isEntry) {
  if (env.NODE_ENV === 'production') {
    logger.error('Từ chối reset: NODE_ENV=production');
    process.exit(1);
  }
  if (!process.argv.includes('--yes')) {
    logger.error('Lệnh này xoá toàn bộ dữ liệu nghiệp vụ. Chạy lại với --yes để xác nhận.');
    process.exit(1);
  }
  const deleted = await cleanDatabase();
  logger.info({ deleted }, 'Đã reset dữ liệu nghiệp vụ');
  await prisma.$disconnect();
}
