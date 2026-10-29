import { Enums, prisma } from '../../config/db.js';
import { CLASS_LIMITS } from '../../constants/index.js';
import { sendMail } from '../../common/mail/mailer.js';

/** Một email/lần khoá: lưu receipt sau từng người để retry không gửi lại cả lớp. */
export const deliverCourseEmail = (id) =>
  prisma.$transaction(
    async (db) => {
      await db.$queryRaw`SELECT id FROM class_events WHERE id = ${id} FOR UPDATE`;
      const event = await db.classEvent.findUnique({ where: { id } });
      if (event.sentAt) return;
      const sent = event.changes.emailDeliveredTo ?? [];
      const users = await db.user.findMany({
        where: {
          id: { in: event.recipientIds },
          email: { not: null },
          emailVerifiedAt: { not: null },
          status: Enums.UserStatus.ACTIVE,
        },
        select: { id: true, email: true },
      });
      const next = users.find((user) => !sent.includes(user.id));
      if (next) {
        const result = await sendMail({
          to: next.email,
          subject: event.title,
          text: event.message,
        });
        if (!result.delivered) {
          await db.classEvent.update({
            where: { id },
            data: {
              attempts: { increment: 1 },
              lastError: 'SMTP chưa gửi được; giữ hàng đợi để retry',
            },
          });
          return;
        }
        sent.push(next.id);
      }
      await db.classEvent.update({
        where: { id },
        data: {
          changes: { ...event.changes, emailDeliveredTo: sent },
          attempts: { increment: 1 },
          lastError: null,
          sentAt: users.every((user) => sent.includes(user.id)) ? new Date() : null,
        },
      });
    },
    { timeout: CLASS_LIMITS.TX_TIMEOUT_MS },
  );
