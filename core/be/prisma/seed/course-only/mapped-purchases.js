import { Enums } from '../../../src/config/db.js';
import { TIME } from '../../../src/constants/index.js';
import { createInvoiceRecord } from '../../../src/modules/payment/invoice-create.service.js';
import { DATASET, lessonAt } from './dataset-config.js';

/** Invoice ↔ enrollment ↔ payment được tạo cùng transaction, không gọi ngân hàng thật. */
export const createMappedPurchase = async (
  db,
  { course, member, index, paidAt, pending = false },
  context,
) => {
  const channel = index % 2 ? Enums.InvoiceChannel.ONLINE : Enums.InvoiceChannel.COUNTER;
  const invoice = await createInvoiceRecord(db, {
    data: {
      createdAt: paidAt,
      userId: member.id,
      kind: Enums.InvoiceKind.COURSE,
      classId: course.id,
      planName: `Khóa học ${course.name}`,
      amount: course.price,
      channel,
      sessionCount: DATASET.LESSON_COUNT,
      totalSessions: DATASET.LESSON_COUNT,
    },
    policy: context.policy,
    actorId: context.admin.id,
    now: paidAt,
    meta: { demoDataset: 'course-only' },
  });
  if (!pending) {
    await db.invoice.update({
      where: { id: invoice.id },
      data: { status: Enums.InvoiceStatus.PAID, paidAt },
    });
    await db.payment.create({
      data: {
        invoiceId: invoice.id,
        requestedAmount: invoice.amount,
        receivedAmount: invoice.amount,
        provider:
          channel === Enums.InvoiceChannel.ONLINE
            ? Enums.PaymentProvider.SEPAY
            : Enums.PaymentProvider.COUNTER,
        reference: `DEMO-${invoice.code}`,
        paidAt,
        actorId: context.admin.id,
      },
    });
    if (channel === Enums.InvoiceChannel.ONLINE)
      await db.paymentWebhookLog.create({
        data: {
          providerTransactionId: `DEMO-${invoice.code}`,
          invoiceId: invoice.id,
          invoiceCode: invoice.code,
          transferType: 'in',
          transferAmount: invoice.amount,
          status: Enums.WebhookLogStatus.PROCESSED,
          payload: { demo: true, code: invoice.code, transferAmount: invoice.amount },
          createdAt: paidAt,
        },
      });
  }
  const enrollment = await db.classEnrollment.create({
    data: {
      classId: course.id,
      memberId: member.id,
      enrolledBy: context.admin.id,
      enrolledAt: paidAt,
      invoiceId: invoice.id,
      status: pending ? Enums.EnrollmentStatus.PENDING_PAYMENT : Enums.EnrollmentStatus.BOOKED,
      holdExpiresAt: pending ? invoice.expiresAt : null,
    },
  });
  return { invoice, enrollment };
};

/** Lịch sử điểm danh/nhận xét bám đúng buổi và học viên đã mua khóa. */
export const createMappedAttendance = async (db, course, member, index) => {
  const attendance = [];
  for (const [lesson, session] of course.sessions.entries()) {
    const status = attendanceStatus(index, lesson);
    const recordedAt = new Date(session.endAt.getTime() + 10 * TIME.MS_PER_MINUTE);
    const row = await db.attendance.create({
      data: {
        sessionId: session.id,
        memberId: member.id,
        actorId: course.coachId,
        status,
        createdAt: recordedAt,
        updatedAt: recordedAt,
      },
    });
    attendance.push(row);
    if (status !== Enums.AttendanceStatus.EXCUSED)
      await db.sessionFeedback.create({
        data: {
          sessionId: session.id,
          memberId: member.id,
          authorId: course.coachId,
          rating: status === Enums.AttendanceStatus.PRESENT ? 5 - index : null,
          note:
            status === Enums.AttendanceStatus.PRESENT
              ? 'Thực hiện đúng nội dung buổi học, tiếp tục giữ nhịp luyện tập đều.'
              : 'Vắng buổi học; trao đổi với HLV trước buổi tiếp theo.',
          createdAt: recordedAt,
          updatedAt: recordedAt,
        },
      });
  }
  return attendance;
};
function attendanceStatus(member, lesson) {
  if (member === 1 && lesson === DATASET.LESSON_COUNT - 1) return Enums.AttendanceStatus.EXCUSED;
  if (member === 2 && lesson >= 2) return Enums.AttendanceStatus.ABSENT;
  return Enums.AttendanceStatus.PRESENT;
}

/** Ngày thu trước buổi đầu, nên dữ liệu lịch sử không có thanh toán sau khi khóa đã kết thúc. */
export const historicalPaymentDate = (template) =>
  new Date(lessonAt(template.dates[0], 12).getTime() - TIME.MS_PER_DAY);
