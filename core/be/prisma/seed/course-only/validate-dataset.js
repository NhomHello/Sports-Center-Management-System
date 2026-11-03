import { validateResources } from '../../../src/modules/class/class-schedule.service.js';
import { Enums } from '../../../src/config/db.js';
import { findMemberScheduleConflict } from '../../../src/modules/class/class-member-conflicts.service.js';

const demand = (condition, message) => {
  if (!condition) throw new Error(`Dữ liệu mới không hợp lệ: ${message}`);
};
/** Kiểm tra cả liên kết nghiệp vụ, không chỉ FK; lỗi khiến toàn bộ reset rollback. */
export const validateMappedData = async (db, created) => {
  const invoices = await db.invoice.findMany({
    include: { enrollments: true, payments: true, courseClass: { include: { sessions: true } } },
  });
  for (const invoice of invoices) validateInvoice(invoice);
  const [packages, memberships, pending, waiting, feedback, summaries] = await Promise.all([
    db.membershipPlan.count(),
    db.membership.count(),
    db.classEnrollment.count({ where: { status: Enums.EnrollmentStatus.PENDING_PAYMENT } }),
    db.classWaitlist.count({ where: { status: Enums.WaitlistStatus.WAITING } }),
    db.sessionFeedback.count(),
    db.courseSummary.count(),
  ]);
  demand(packages === 0 && memberships === 0, 'vẫn còn gói tự tập');
  demand(pending === 1 && waiting === 1, 'thiếu tình huống giữ chỗ/hàng chờ');
  const active = await db.classEnrollment.findMany({
    where: {
      status: { in: [Enums.EnrollmentStatus.BOOKED, Enums.EnrollmentStatus.PENDING_PAYMENT] },
    },
    include: { gymClass: { include: { sessions: true } } },
  });
  for (const enrollment of active)
    demand(
      !(await findMemberScheduleConflict(db, {
        item: enrollment.gymClass,
        memberId: enrollment.memberId,
      })),
      'học viên bị trùng lịch',
    );
  for (const course of await db.gymClass.findMany({
    include: { enrollments: true, waitlist: true, sessions: true },
  })) {
    const future = course.sessions.filter(
      (s) => s.status === Enums.SessionStatus.SCHEDULED && s.startAt > new Date(),
    );
    if (future.length) await validateResources(db, course, future, course.id);
    const occupied = course.enrollments.filter(
      (e) => e.status !== Enums.EnrollmentStatus.CANCELLED,
    ).length;
    demand(occupied <= course.capacity, 'vượt sức chứa');
    demand(!course.waitlist.length || occupied === course.capacity, 'hàng chờ khi khóa còn chỗ');
  }
  return {
    courses: created.courses.length,
    invoices: invoices.length,
    payments: invoices.reduce((n, i) => n + i.payments.length, 0),
    enrollments: active.length,
    pending,
    waiting,
    feedback,
    summaries,
    packages,
    memberships,
  };
};
function validateInvoice(invoice) {
  demand(
    invoice.kind === Enums.InvoiceKind.COURSE && invoice.courseClass,
    'invoice không gắn khóa học',
  );
  demand(invoice.enrollments.length === 1, 'invoice phải có đúng một đăng ký');
  const enrollment = invoice.enrollments[0];
  demand(
    enrollment.classId === invoice.classId && enrollment.memberId === invoice.userId,
    'sai học viên/khóa của invoice',
  );
  demand(
    invoice.courseClass.createdAt <= enrollment.enrolledAt,
    'ngày đăng ký trước ngày tạo khóa',
  );
  demand(invoice.sessionCount === invoice.courseClass.sessions.length, 'số buổi trên invoice sai');
  demand(invoice.amount === invoice.courseClass.price, 'snapshot giá không khớp giá demo');
  const paid = invoice.status === Enums.InvoiceStatus.PAID;
  demand(
    enrollment.status ===
      (paid ? Enums.EnrollmentStatus.BOOKED : Enums.EnrollmentStatus.PENDING_PAYMENT),
    'sai trạng thái thanh toán/đăng ký',
  );
  demand(
    invoice.payments.reduce((n, p) => n + p.receivedAmount, 0) === (paid ? invoice.amount : 0),
    'số thực thu không khớp',
  );
  if (!paid)
    demand(
      enrollment.holdExpiresAt?.getTime() === invoice.expiresAt.getTime(),
      'hạn giữ chỗ khác hạn invoice',
    );
}
