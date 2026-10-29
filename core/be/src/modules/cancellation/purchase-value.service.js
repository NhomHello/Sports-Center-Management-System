import { PERMISSIONS as P } from '@scms/shared';
import { ApiError } from '../../common/errors/api-error.js';
import { Enums } from '../../config/db.js';
import { sumReceived } from '../payment/payment-apply.service.js';
import { futureSessions, remainingCourseValue, remainingPlanValue } from './settlement.js';

const LIVE = [Enums.MembershipStatus.ACTIVE, Enums.MembershipStatus.FROZEN];

/** Hội viên tự thao tác cần quyền tự phục vụ; nhân viên làm hộ cần quyền quản lý tương ứng. */
const assertActor = (ownerId, context, { self, staff }) => {
  const own = ownerId === context.user.id && context.permissions.has(self);
  if (!own && !context.permissions.has(staff)) throw ApiError.forbidden();
};

/** Một lần đổi đang chờ thu chênh lệch thì chưa được hủy/đổi tiếp nguồn đó. */
const assertNoPendingChange = async (db, where) => {
  const pending = await db.purchaseChange.count({
    where: { ...where, status: Enums.PurchaseChangeStatus.PENDING_PAYMENT },
  });
  if (pending) throw ApiError.conflict('Đang có yêu cầu đổi chờ thanh toán chênh lệch');
};

/** Kỳ gói còn giá trị mà người gọi được phép hủy/đổi. */
export const loadPeriodFor = async (db, id, context) => {
  const period = await db.membership.findUnique({ where: { id }, include: { plan: true } });
  if (!period) throw ApiError.notFound('Không tìm thấy kỳ gói');
  assertActor(period.userId, context, { self: P.MEMBERSHIP_PURCHASE, staff: P.MEMBERSHIP_MANAGE });
  if (!LIVE.includes(period.status) || period.endDate <= new Date())
    throw ApiError.businessRule('Kỳ gói đã kết thúc hoặc đã hủy');
  if (period.status === Enums.MembershipStatus.FROZEN)
    throw ApiError.businessRule('Kỳ gói đang bảo lưu, hãy kết thúc bảo lưu trước');
  await assertNoPendingChange(db, { fromMembershipId: id });
  return period;
};

/** Đăng ký khóa học đã thanh toán mà người gọi được phép hủy/đổi. */
export const loadEnrollmentFor = async (db, id, context) => {
  const enrollment = await db.classEnrollment.findUnique({
    where: { id },
    include: { gymClass: { include: { sessions: true } } },
  });
  if (!enrollment) throw ApiError.notFound('Không tìm thấy đăng ký');
  assertActor(enrollment.memberId, context, {
    self: P.CLASS_CANCEL_SELF,
    staff: P.CLASS_ENROLL_FOR_MEMBER,
  });
  if (enrollment.status !== Enums.EnrollmentStatus.BOOKED || !enrollment.invoiceId)
    throw ApiError.businessRule('Chỉ hủy/đổi khóa học đã thanh toán');
  await assertNoPendingChange(db, { fromEnrollmentId: id });
  return enrollment;
};

/**
 * Số đã trả cho một lần mua: hóa đơn gói/khóa = số thực nhận (đã trừ hoàn); hóa đơn chênh lệch
 * của một lần đổi = giá sản phẩm mới (phần còn lại của sản phẩm cũ đã chuyển sang).
 */
export const paidValue = async (db, invoice) => {
  if (invoice.kind !== Enums.InvoiceKind.ADJUSTMENT) return sumReceived(db, invoice.id);
  const change = await db.purchaseChange.findFirst({ where: { adjustmentInvoiceId: invoice.id } });
  return change?.newPrice ?? 0;
};

/** Hóa đơn tạo ra kỳ gói (dữ liệu trước GY-00 tìm theo membershipId). */
const periodInvoice = async (db, period) => {
  const invoice = period.invoiceId
    ? await db.invoice.findUnique({ where: { id: period.invoiceId } })
    : await db.invoice.findFirst({
        where: { membershipId: period.id, status: Enums.InvoiceStatus.PAID },
        orderBy: { paidAt: 'desc' },
      });
  if (!invoice) throw ApiError.businessRule('Kỳ gói không có hóa đơn để tính giá trị còn lại');
  return invoice;
};

/** Giá trị chưa dùng của kỳ gói tại `now`. */
export const periodValue = async (db, period, now = new Date()) => {
  const invoice = await periodInvoice(db, period);
  const paid = await paidValue(db, invoice);
  return {
    invoice,
    paid,
    remainingValue: remainingPlanValue({ paid, ...period }, now),
    beforeStart: period.startDate > now,
  };
};

/** Giá trị chưa dùng của khóa học: theo buổi chưa diễn ra trên số buổi đã mua. */
export const enrollmentValue = async (db, enrollment, now = new Date()) => {
  const invoice = await db.invoice.findUniqueOrThrow({ where: { id: enrollment.invoiceId } });
  const paid = await paidValue(db, invoice);
  const sessionCount = invoice.sessionCount ?? 0;
  const unheld = futureSessions(enrollment.gymClass.sessions, now).length;
  if (!unheld) throw ApiError.businessRule('Khóa học không còn buổi chưa diễn ra');
  return {
    invoice,
    paid,
    remainingValue: remainingCourseValue({ paid, sessionCount, unheld }),
    beforeStart: unheld >= sessionCount,
  };
};
