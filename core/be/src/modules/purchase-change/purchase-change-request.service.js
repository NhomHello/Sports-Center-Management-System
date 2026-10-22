import { PERMISSIONS as P } from '@scms/shared';
import { ApiError } from '../../common/errors/api-error.js';
import {
  withScheduleTransaction,
  writeScheduleAudit,
} from '../../common/utils/schedule-transaction.js';
import { Enums } from '../../config/db.js';
import { AUDIT_ACTIONS } from '../../constants/index.js';
import { loadSyncedPeriod } from '../cancellation/cancellation.service.js';
import { payOut } from '../cancellation/payout.service.js';
import {
  enrollmentValue,
  loadEnrollmentFor,
  periodValue,
} from '../cancellation/purchase-value.service.js';
import { createInvoiceRecord, loadInvoicePolicy } from '../payment/invoice-create.service.js';
import { buildPaymentInstruction } from '../payment/sepay-qr.service.js';
import { completeChange } from './purchase-change.service.js';
import { loadTargetClass, loadTargetPlan, holdTargetSeat } from './purchase-target.service.js';

const quote = (remainingValue, newPrice) => ({
  remainingValue,
  newPrice,
  difference: newPrice - remainingValue,
});

/** Hội viên tự đổi thì trả chênh lệch online; nhân viên làm hộ thì thu tại quầy. */
const channelFor = (ownerId, context, staffPermission) =>
  ownerId !== context.user.id && context.permissions.has(staffPermission)
    ? Enums.InvoiceChannel.COUNTER
    : Enums.InvoiceChannel.ONLINE;

/** Kỳ gói nguồn và gói đích của một yêu cầu đổi gói. */
const planChangeQuote = async (db, id, planId, context) => {
  const period = await loadSyncedPeriod(db, id, context);
  const plan = await loadTargetPlan(db, planId, period);
  const value = await periodValue(db, period);
  const refs = { userId: period.userId, fromMembershipId: period.id, toPlanId: plan.id };
  return { period, plan, value, refs, ...quote(value.remainingValue, plan.price) };
};

/** Đăng ký nguồn và lớp đích của một yêu cầu đổi lớp. */
const classChangeQuote = async (db, id, classId, context) => {
  const enrollment = await loadEnrollmentFor(db, id, context);
  const target = await loadTargetClass(db, classId, enrollment);
  const value = await enrollmentValue(db, enrollment);
  const refs = {
    userId: enrollment.memberId,
    fromEnrollmentId: enrollment.id,
    toClassId: target.id,
  };
  return {
    refs,
    enrollment,
    target,
    value,
    ...quote(value.remainingValue, target.pricing.priceForRemaining),
  };
};

const strip = ({ remainingValue, newPrice, difference, value }) => ({
  paidAmount: value.paid,
  remainingValue,
  newPrice,
  difference,
});

/** GET /memberships/:id/change-preview?planId= */
export const previewPlanChange = (id, planId, context) =>
  withScheduleTransaction(async (db) => strip(await planChangeQuote(db, id, planId, context)));

/** GET /enrollments/:id/change-preview?classId= */
export const previewClassChange = (id, classId, context) =>
  withScheduleTransaction(async (db) => strip(await classChangeQuote(db, id, classId, context)));

/** Lần đổi ở trạng thái chờ + hóa đơn chênh lệch (ADJUSTMENT, mang thời hạn / số buổi mới). */
const createChangeRows = async (db, { kind, q, product, input, context, channel }) => {
  const change = await db.purchaseChange.create({
    data: {
      kind,
      status: Enums.PurchaseChangeStatus.PENDING_PAYMENT,
      ...q.refs,
      actorId: context.user.id,
      fromInvoiceId: q.value.invoice.id,
      paidAmount: q.value.paid,
      remainingValue: q.remainingValue,
      newPrice: q.newPrice,
      difference: q.difference,
      settlement: q.difference < 0 ? input.settlement : Enums.SettlementMode.NONE,
    },
  });
  const invoice = await createInvoiceRecord(db, {
    data: {
      userId: q.refs.userId,
      kind: Enums.InvoiceKind.ADJUSTMENT,
      changeId: change.id,
      channel,
      amount: Math.max(0, q.difference),
      ...product,
    },
    policy: await loadInvoicePolicy(),
    actorId: context.user.id,
    now: new Date(),
    meta: { changeId: change.id, difference: q.difference },
  });
  const linked = await db.purchaseChange.update({
    where: { id: change.id },
    data: { adjustmentInvoiceId: invoice.id },
  });
  return { change: linked, invoice };
};

/** Không phải trả thêm: chốt hóa đơn 0 đ, chuyển quyền ngay, phần dư hoàn hoặc ghi số dư. */
const settleWithoutPayment = async (db, { change, invoice }, { q, input, context }) => {
  const now = new Date();
  const paid = await db.invoice.update({
    where: { id: invoice.id },
    data: { status: Enums.InvoiceStatus.PAID, paidAt: now },
  });
  await completeChange(db, change, paid, now);
  const done = await payOut(db, {
    change,
    amount: -q.difference,
    settlement: input.settlement,
    actor: context.user,
    reason: `Phần trả lại khi đổi (${q.value.invoice.code})`,
  });
  return { change: { ...done, status: Enums.PurchaseChangeStatus.DONE }, invoice: paid };
};

/**
 * Ghi lần đổi; phải trả thêm thì chờ hóa đơn chênh lệch (lớp mới được giữ chỗ), không thì xong ngay.
 */
const recordChange = async (db, args) => {
  const { q, input, context } = args;
  if (q.difference < 0 && !input.settlement)
    throw ApiError.businessRule('Hãy chọn nhận tiền hoàn hoặc ghi vào số dư cho phần trả lại');
  const rows = await createChangeRows(db, args);
  if (q.target)
    await holdTargetSeat(db, {
      target: q.target,
      memberId: q.refs.userId,
      invoice: rows.invoice,
      actor: context.user,
    });
  return q.difference > 0 ? rows : settleWithoutPayment(db, rows, args);
};

const respond = async (db, { change, invoice }, actor) => {
  await writeScheduleAudit(db, actor, {
    action: AUDIT_ACTIONS.UPDATE,
    entity: 'PurchaseChange',
    entityId: change.id,
    meta: { kind: change.kind, difference: change.difference, invoiceId: invoice.id },
  });
  return { ...change, adjustmentInvoice: invoice };
};

const withInstruction = async (result) => {
  const invoice = result.adjustmentInvoice;
  if (
    invoice.status !== Enums.InvoiceStatus.PENDING ||
    invoice.channel !== Enums.InvoiceChannel.ONLINE
  )
    return result;
  return {
    ...result,
    adjustmentInvoice: { ...invoice, paymentInstruction: await buildPaymentInstruction(invoice) },
  };
};

/** POST /memberships/:id/change — đổi gói, tính chênh lệch theo giá trị còn lại. */
export const changePlan = async (id, input, context) => {
  const result = await withScheduleTransaction(async (db) => {
    const q = await planChangeQuote(db, id, input.planId, context);
    const channel = channelFor(q.period.userId, context, P.MEMBERSHIP_MANAGE);
    const product = {
      planId: q.plan.id,
      planName: `Đổi sang ${q.plan.name}`,
      durationDays: q.plan.durationDays,
    };
    const out = await recordChange(db, {
      kind: Enums.PurchaseChangeKind.CHANGE_PLAN,
      q,
      product,
      input,
      context,
      channel,
    });
    return respond(db, out, context.user);
  });
  return withInstruction(result);
};

/** POST /enrollments/:id/change — đổi lớp, giá lớp mới theo số buổi còn lại. */
export const changeClass = async (id, input, context) => {
  const result = await withScheduleTransaction(async (db) => {
    const q = await classChangeQuote(db, id, input.classId, context);
    const channel = channelFor(q.enrollment.memberId, context, P.CLASS_ENROLL_FOR_MEMBER);
    const product = {
      classId: q.target.id,
      planName: `Đổi sang khóa ${q.target.name}`,
      sessionCount: q.target.pricing.remainingSessions,
      totalSessions: q.target.pricing.totalSessions,
    };
    const out = await recordChange(db, {
      kind: Enums.PurchaseChangeKind.CHANGE_CLASS,
      q,
      product,
      input,
      context,
      channel,
    });
    return respond(db, out, context.user);
  });
  return withInstruction(result);
};
