import { ApiError } from '../../common/errors/api-error.js';
import {
  withScheduleTransaction,
  writeScheduleAudit,
} from '../../common/utils/schedule-transaction.js';
import { Enums } from '../../config/db.js';
import { AUDIT_ACTIONS } from '../../constants/index.js';
import { getClassActions } from '../class/class-booking-policy.service.js';
import { promoteWaitlist } from '../class/class-waitlist.service.js';
import { CLASS_INCLUDE, coursePricing } from '../class/class.mapper.js';
import { createInvoiceRecord, loadInvoicePolicy } from '../payment/invoice-create.service.js';
import { INVOICE_INCLUDE } from '../payment/invoice.service.js';
import { buildPaymentInstruction } from '../payment/sepay-qr.service.js';

const loadMember = async (db, memberId) => {
  const member = await db.user.findFirst({
    where: { id: memberId, role: { isDefault: true }, status: Enums.UserStatus.ACTIVE },
  });
  if (!member) throw ApiError.notFound('Không tìm thấy hội viên đang hoạt động');
  return member;
};

const loadPaidClass = async (db, classId) => {
  const item = await db.gymClass.findUnique({ where: { id: classId }, include: CLASS_INCLUDE });
  if (!item) throw ApiError.notFound('Không tìm thấy lớp');
  if (item.price <= 0) throw ApiError.businessRule('Lớp miễn phí, hãy đăng ký trực tiếp');
  return item;
};

/** Đang giữ chỗ cùng kênh thì trả lại hóa đơn cũ (bấm lại không tạo trùng). */
const existingHold = async (db, enrollment, channel) => {
  if (enrollment?.status !== Enums.EnrollmentStatus.PENDING_PAYMENT || !enrollment.invoiceId)
    return null;
  const invoice = await db.invoice.findUnique({
    where: { id: enrollment.invoiceId },
    include: INVOICE_INCLUDE,
  });
  if (invoice?.status !== Enums.InvoiceStatus.PENDING) return null;
  if (invoice.channel !== channel)
    throw ApiError.conflict('Khóa học đang có hóa đơn chờ thanh toán ở kênh khác');
  return invoice;
};

const holdSeat = (db, { item, memberId, invoice, actor }) =>
  db.classEnrollment.upsert({
    where: { classId_memberId: { classId: item.id, memberId } },
    create: {
      classId: item.id,
      memberId,
      enrolledBy: actor.id,
      status: Enums.EnrollmentStatus.PENDING_PAYMENT,
      invoiceId: invoice.id,
      holdExpiresAt: invoice.channel === Enums.InvoiceChannel.ONLINE ? invoice.expiresAt : null,
    },
    update: {
      status: Enums.EnrollmentStatus.PENDING_PAYMENT,
      enrolledBy: actor.id,
      enrolledAt: new Date(),
      invoiceId: invoice.id,
      holdExpiresAt: invoice.channel === Enums.InvoiceChannel.ONLINE ? invoice.expiresAt : null,
      cancelledBy: null,
      cancelledAt: null,
      exceptionUntil: null,
    },
  });

const createCourseInvoice = (db, { item, memberId, channel, actor, now }) => {
  const pricing = coursePricing(item, now);
  return loadInvoicePolicy().then((policy) =>
    createInvoiceRecord(db, {
      data: {
        userId: memberId,
        kind: Enums.InvoiceKind.COURSE,
        classId: item.id,
        planName: `Khóa học ${item.name}`,
        sessionCount: pricing.remainingSessions,
        totalSessions: pricing.totalSessions,
        amount: pricing.priceForRemaining,
        channel,
      },
      policy,
      actorId: actor.id,
      now,
      meta: { classId: item.id, sessionCount: pricing.remainingSessions },
    }),
  );
};

/**
 * GY-20: đăng ký lớp có học phí = mua khóa học. Tạo hóa đơn khóa học (giá theo số buổi còn lại)
 * và giữ chỗ PENDING_PAYMENT; thanh toán đủ mới thành đăng ký chính thức.
 * @param {{ classId: number, memberId: number, channel: string }} input
 * @param {{ id: number }} actor
 */
export const createCourseOrder = async ({ classId, memberId, channel }, actor) => {
  const invoice = await withScheduleTransaction(async (db) => {
    await loadMember(db, memberId);
    await promoteWaitlist(db, classId);
    const item = await loadPaidClass(db, classId);
    const state = await getClassActions(db, item, memberId);
    const reused = await existingHold(db, state.enrollment, channel);
    if (reused) return reused;
    if (!state.canEnroll) throw ApiError.businessRule(state.enrollReason);
    const now = new Date();
    const created = await createCourseInvoice(db, { item, memberId, channel, actor, now });
    if (created.amount <= 0) throw ApiError.businessRule('Lớp không còn buổi để đăng ký');
    const enrollment = await holdSeat(db, { item, memberId, invoice: created, actor });
    await db.classWaitlist.updateMany({
      where: { classId, memberId, status: Enums.WaitlistStatus.OFFERED, offeredUntil: { gt: now } },
      data: { status: Enums.WaitlistStatus.ACCEPTED },
    });
    await writeScheduleAudit(db, actor, {
      action: AUDIT_ACTIONS.CREATE,
      entity: 'ClassEnrollment',
      entityId: enrollment.id,
      meta: { classId, memberId, invoiceId: created.id, status: enrollment.status },
    });
    return created;
  });
  return invoice.channel === Enums.InvoiceChannel.ONLINE
    ? { ...invoice, paymentInstruction: await buildPaymentInstruction(invoice) }
    : invoice;
};
