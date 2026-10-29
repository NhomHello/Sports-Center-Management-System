import { useState } from 'react';
import { PERMISSIONS as P } from '@scms/shared';
import { Button } from 'antd';
import { ENROLLMENT_STATUS } from '@/constants/schedule';
import { usePermission } from '@/hooks/usePermission';
import { useScheduleMutation } from '@/hooks/useScheduleMutation';
import * as service from '@/services/schedule.service';
import { BookingEnrollButton, BookingCancelButton, BookingNotice } from './BookingControls';
import { CourseOrderControls } from './CourseOrderControls';
import { WaitlistControls } from './WaitlistControls';
import { ClassRosterModal } from './ClassRosterModal';
import { ClassBookingNotices } from './ClassBookingNotices';
import { shouldShowEnrollmentAction } from '@/utils/classBookingPresentation';

function EnrollmentControl({ item, memberId, allowed, booked, mutation, compact }) {
  if (!shouldShowEnrollmentAction({ item, memberId, allowed, booked })) return null;
  return (
    <BookingEnrollButton
      item={item}
      memberId={memberId}
      allowed={allowed}
      booked={booked}
      mutation={mutation}
      compact={compact}
    />
  );
}

function BookingRoster({ item, open, onClose }) {
  return open ? <ClassRosterModal item={item} onClose={onClose} /> : null;
}

function CourseBookingActions({
  item,
  memberId,
  enrollAllowed,
  cancel,
  rosterButton,
  booked,
  roster,
  secondaryAction,
  compact,
}) {
  return (
    <div className={`scms-booking-actions${compact ? ' scms-booking-actions--compact' : ''}`}>
      <CourseOrderControls
        item={item}
        memberId={memberId}
        allowed={enrollAllowed}
        cancel={cancel}
      />
      <div className="scms-booking-actions__buttons">
        {rosterButton}
        {secondaryAction}
      </div>
      <WaitlistControls item={item} allowed={enrollAllowed} memberId={memberId} booked={booked} />
      {!item.enrollment?.invoiceId && (
        <BookingNotice item={item} booked={false} allowed={enrollAllowed} />
      )}
      {roster}
    </div>
  );
}

/** Nhân viên đăng ký / hủy hộ cần quyền riêng; hội viên dùng quyền tự phục vụ. */
const bookingPermissions = (can, memberId) =>
  memberId
    ? {
        enrollAllowed: can(P.CLASS_ENROLL_FOR_MEMBER),
        cancelAllowed: can(P.CLASS_ENROLL_FOR_MEMBER),
      }
    : { enrollAllowed: can(P.CLASS_ENROLL_SELF), cancelAllowed: can(P.CLASS_CANCEL_SELF) };

/** Chỉ dùng điều kiện server trả, không tính hạn hủy ở FE. */
export function ClassBookingActions({
  item,
  memberId,
  rosterOnly = false,
  compact = false,
  secondaryAction,
}) {
  const { can } = usePermission();
  const [rosterOpen, setRosterOpen] = useState(false);
  const { enrollAllowed, cancelAllowed } = bookingPermissions(can, memberId);
  const enroll = useScheduleMutation(() => service.enrollClass(item.id, memberId));
  const cancel = useScheduleMutation(() => service.cancelEnrollment(item.id, memberId));
  const booked = item.enrollment?.status === ENROLLMENT_STATUS.BOOKED;
  const rosterButton = can(P.CLASS_VIEW_ROSTER, P.CLASS_READ_ALL) && (
    <Button onClick={() => setRosterOpen(true)}>Danh sách hội viên</Button>
  );
  if (rosterOnly) {
    return (
      <div className={`scms-booking-actions${compact ? ' scms-booking-actions--compact' : ''}`}>
        <div className="scms-booking-actions__notices" />
        <div className="scms-booking-actions__buttons">
          {rosterButton}
          {secondaryAction}
        </div>
        <BookingRoster item={item} open={rosterOpen} onClose={() => setRosterOpen(false)} />
      </div>
    );
  }
  if (item.price > 0)
    return (
      <CourseBookingActions
        {...{
          item,
          memberId,
          enrollAllowed,
          cancel,
          rosterButton,
          booked,
          secondaryAction,
          compact,
        }}
        roster={rosterOpen && <ClassRosterModal item={item} onClose={() => setRosterOpen(false)} />}
      />
    );
  return (
    <div className={`scms-booking-actions${compact ? ' scms-booking-actions--compact' : ''}`}>
      <ClassBookingNotices {...{ item, memberId, booked, enrollAllowed, cancelAllowed, compact }} />
      <div className="scms-booking-actions__buttons">
        <EnrollmentControl
          item={item}
          memberId={memberId}
          allowed={enrollAllowed}
          booked={booked}
          mutation={enroll}
          compact={compact}
        />
        <BookingCancelButton
          item={item}
          memberId={memberId}
          allowed={cancelAllowed}
          booked={booked}
          mutation={cancel}
        />
        <WaitlistControls
          item={item}
          allowed={enrollAllowed}
          memberId={memberId}
          booked={booked}
          compact={compact}
        />
        {rosterButton}
        {secondaryAction}
      </div>
      <BookingRoster item={item} open={rosterOpen} onClose={() => setRosterOpen(false)} />
    </div>
  );
}
