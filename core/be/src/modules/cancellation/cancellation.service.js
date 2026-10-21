import { SETTING_KEYS as K } from '@scms/shared';
import {
  withScheduleTransaction,
  writeScheduleAudit,
} from '../../common/utils/schedule-transaction.js';
import { Enums, prisma } from '../../config/db.js';
import { AUDIT_ACTIONS } from '../../constants/index.js';
import { promoteWaitlist } from '../class/class-waitlist.service.js';
import { completeDueFreezes } from '../membership/membership-freeze.service.js';
import { endPeriod } from '../membership/membership-period.service.js';
import * as settings from '../setting/setting.service.js';
import { payOut } from './payout.service.js';
import {
  enrollmentValue,
  loadEnrollmentFor,
  loadPeriodFor,
  periodValue,
} from './purchase-value.service.js';
import { cancelQuote } from './settlement.js';

const quote = async (value) =>
  cancelQuote({
    paid: value.paid,
    remainingValue: value.remainingValue,
    percent: await settings.getValue(K.CANCELLATION_FEE_PERCENT),
    beforeStart: value.beforeStart,
  });

const recordCancel = async (db, { kind, source, value, preview, input, actor }) => {
  const change = await db.purchaseChange.create({
    data: {
      kind,
      userId: source.userId ?? source.memberId,
      actorId: actor.id,
      fromInvoiceId: value.invoice.id,
      ...(kind === Enums.PurchaseChangeKind.CANCEL_PLAN
        ? { fromMembershipId: source.id }
        : { fromEnrollmentId: source.id }),
      paidAmount: preview.paidAmount,
      remainingValue: preview.remainingValue,
      fee: preview.fee,
      difference: -preview.refundAmount,
      settlement: preview.refundAmount > 0 ? input.settlement : Enums.SettlementMode.NONE,
      completedAt: new Date(),
    },
  });
  const done = await payOut(db, {
    change,
    amount: preview.refundAmount,
    settlement: input.settlement,
    actor,
    reason: input.reason ?? `Hủy ${value.invoice.planName ?? 'gói'} (${value.invoice.code})`,
  });
  await writeScheduleAudit(db, actor, {
    action: AUDIT_ACTIONS.DELETE,
    entity: 'PurchaseChange',
    entityId: change.id,
    meta: { kind, ...preview, settlement: change.settlement, reason: input.reason },
  });
  return done;
};

/** Đồng bộ trạng thái kỳ (bảo lưu tới hạn, hết hạn) trước khi kiểm tra điều kiện hủy/đổi. */
export const loadSyncedPeriod = async (db, id, context, now = new Date()) => {
  const row = await db.membership.findUnique({ where: { id }, select: { userId: true } });
  if (row) await completeDueFreezes(db, row.userId, now);
  return loadPeriodFor(db, id, context);
};

/** GET /memberships/:id/cancel-preview — giá trị chưa dùng, phí hủy và số được hoàn. */
export const previewMembership = (id, context) =>
  withScheduleTransaction(async (db) =>
    quote(await periodValue(db, await loadSyncedPeriod(db, id, context))),
  );

/** POST /memberships/:id/cancel — kỳ gói CANCELLED, kỳ nối tiếp dời lên, tiền hoàn/ghi số dư. */
export const cancelMembership = (id, input, context) =>
  withScheduleTransaction(async (db) => {
    const now = new Date();
    const period = await loadSyncedPeriod(db, id, context, now);
    const value = await periodValue(db, period, now);
    const preview = await quote(value);
    await endPeriod(db, period, now);
    return recordCancel(db, {
      kind: Enums.PurchaseChangeKind.CANCEL_PLAN,
      source: period,
      value,
      preview,
      input,
      actor: context.user,
    });
  });

/** GET /enrollments/:id/cancel-preview */
export const previewEnrollment = async (id, context) => {
  const enrollment = await loadEnrollmentFor(prisma, id, context);
  return quote(await enrollmentValue(prisma, enrollment));
};

/** POST /enrollments/:id/cancel — hủy cả khóa đã thanh toán, nhả chỗ cho danh sách chờ. */
export const cancelEnrollment = (id, input, context) =>
  withScheduleTransaction(async (db) => {
    const enrollment = await loadEnrollmentFor(db, id, context);
    const value = await enrollmentValue(db, enrollment);
    const preview = await quote(value);
    await db.classEnrollment.update({
      where: { id },
      data: {
        status: Enums.EnrollmentStatus.CANCELLED,
        cancelledAt: new Date(),
        cancelledBy: context.user.id,
        exceptionUntil: null,
      },
    });
    const change = await recordCancel(db, {
      kind: Enums.PurchaseChangeKind.CANCEL_COURSE,
      source: enrollment,
      value,
      preview,
      input,
      actor: context.user,
    });
    await promoteWaitlist(db, enrollment.classId);
    return change;
  });
