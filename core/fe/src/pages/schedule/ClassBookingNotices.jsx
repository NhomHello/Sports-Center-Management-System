import { ENROLLMENT_STATUS } from '@/constants/schedule';
import { shouldHideEnrollmentReason } from '@/utils/classBookingPresentation';
import { formatDateTime } from '@/utils/format';
import { BookingNotice } from './BookingControls';
import { MembershipExpiryNotice } from './MembershipExpiryNotice';
import { WaitlistNotice } from './WaitlistControls';

const hasPendingPayment = (item, paid, allowed) =>
  paid && allowed && item.enrollment?.status === ENROLLMENT_STATUS.PENDING_PAYMENT;

/** Notes occupy their own grid track so they cannot push individual action buttons around. */
export function ClassBookingNotices({
  item,
  memberId,
  booked,
  enrollAllowed,
  cancelAllowed,
  compact,
}) {
  const paid = item.price > 0 && !booked;
  return (
    <div className="scms-booking-actions__notices">
      {enrollAllowed && !booked && !paid && (
        <MembershipExpiryNotice {...{ item, memberId, compact }} />
      )}
      {compact && <WaitlistNotice {...{ item, memberId, booked }} allowed={enrollAllowed} />}
      {compact && hasPendingPayment(item, paid, enrollAllowed) && (
        <p className="scms-booking-note scms-booking-note--waitlist">
          Chờ thanh toán đến {formatDateTime(item.enrollment.holdExpiresAt)}.
        </p>
      )}
      <BookingNotice
        {...{ item, booked, compact }}
        allowed={enrollAllowed || cancelAllowed}
        hideReason={shouldHideEnrollmentReason({ item, allowed: enrollAllowed, booked, memberId })}
      />
    </div>
  );
}
