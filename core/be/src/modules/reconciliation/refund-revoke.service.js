import { Enums } from '../../config/db.js';
import { promoteWaitlist } from '../class/class-waitlist.service.js';
import { endPeriod, LIVE_STATUSES } from '../membership/membership-period.service.js';

/** Hoàn cả hoá đơn thì quyền lợi của hoá đơn đó chấm dứt: kỳ gói bị hủy, chỗ học được nhả. */
export const revokePurchase = async (tx, invoice) => {
  await tx.$queryRaw`SELECT id FROM schedule_locks WHERE id = 1 FOR UPDATE`;
  if (invoice.classId) {
    const enrollment = await tx.classEnrollment.findFirst({
      where: { invoiceId: invoice.id, status: Enums.EnrollmentStatus.BOOKED },
    });
    if (!enrollment) return null;
    await tx.classEnrollment.update({
      where: { id: enrollment.id },
      data: { status: Enums.EnrollmentStatus.CANCELLED, cancelledAt: new Date() },
    });
    await promoteWaitlist(tx, enrollment.classId);
    return null;
  }
  const membership = invoice.membershipId
    ? await tx.membership.findUnique({ where: { id: invoice.membershipId } })
    : null;
  if (!membership || !LIVE_STATUSES.includes(membership.status)) return membership;
  await endPeriod(tx, membership);
  return membership;
};
