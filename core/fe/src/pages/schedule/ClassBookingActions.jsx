import { useState } from 'react';
import { CourseOrderActions } from './CourseOrderActions';
import { PERMISSIONS as P } from '@scms/shared';
import { Button } from 'antd';
import { ENROLLMENT_STATUS } from '@/constants/schedule';
import { usePermission } from '@/hooks/usePermission';
import { useScheduleMutation } from '@/hooks/useScheduleMutation';
import * as service from '@/services/schedule.service';
import { BookingEnrollButton, BookingCancelButton } from './BookingControls';
import { WaitlistControls } from './WaitlistControls';
import { ClassRosterModal } from './ClassRosterModal';
import { ClassBookingNotices } from './ClassBookingNotices';
import { shouldShowEnrollmentAction } from '@/utils/classBookingPresentation';

function EnrollmentControl({ item, memberId, allowed, booked, mutation, compact }) {
  if (!shouldShowEnrollmentAction({ item, memberId, allowed, booked })) return null;
  return item.price > 0 ? (
    <CourseOrderActions {...{ item, memberId, allowed, compact }} />
  ) : (
    <BookingEnrollButton {...{ item, memberId, allowed, booked, mutation }} />
  );
}

function BookingRoster({ item, open, onClose }) {
  return open ? <ClassRosterModal item={item} onClose={onClose} /> : null;
}

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
  const enrollAllowed = can(memberId ? P.CLASS_ENROLL_FOR_MEMBER : P.CLASS_ENROLL_SELF);
  const cancelAllowed = can(memberId ? P.CLASS_ENROLL_FOR_MEMBER : P.CLASS_CANCEL_SELF);
  const enroll = useScheduleMutation(() => service.enrollClass(item.id, memberId));
  const cancel = useScheduleMutation(() => service.cancelEnrollment(item.id, memberId));
  const booked = item.enrollment?.status === ENROLLMENT_STATUS.BOOKED;
  const rosterButton = can(P.CLASS_VIEW_ROSTER, P.CLASS_READ_ALL) && (
    <Button onClick={() => setRosterOpen(true)}>Danh sách hội viên</Button>
  );
  // Tab quản lý lớp dành cho vận hành: đăng ký của chính mình nằm ở tab "Lớp đang mở".
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
