import { useState } from 'react';
import { CourseOrderActions } from './CourseOrderActions';
import { PERMISSIONS as P } from '@scms/shared';
import { Button } from 'antd';
import { ENROLLMENT_STATUS } from '@/constants/schedule';
import { usePermission } from '@/hooks/usePermission';
import { useScheduleMutation } from '@/hooks/useScheduleMutation';
import * as service from '@/services/schedule.service';
import { BookingEnrollButton, BookingCancelButton, BookingNotice } from './BookingControls';
import { WaitlistControls } from './WaitlistControls';
import { ClassRosterModal } from './ClassRosterModal';

const hasBookingPermission = (enrollAllowed, cancelAllowed) => enrollAllowed || cancelAllowed;
const isCourseOrder = (item, booked) => item.price > 0 && !booked;

/** Chỉ dùng điều kiện server trả, không tính hạn hủy ở FE. */
export function ClassBookingActions({ item, memberId, rosterOnly = false }) {
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
      <div className="scms-booking-actions">
        <div className="scms-booking-actions__buttons">{rosterButton}</div>
        {rosterOpen && <ClassRosterModal item={item} onClose={() => setRosterOpen(false)} />}
      </div>
    );
  }
  return (
    <div className="scms-booking-actions">
      <div className="scms-booking-actions__buttons">
        {isCourseOrder(item, booked) ? (
          <CourseOrderActions item={item} memberId={memberId} allowed={enrollAllowed} />
        ) : (
          <BookingEnrollButton
            item={item}
            memberId={memberId}
            allowed={enrollAllowed}
            booked={booked}
            mutation={enroll}
          />
        )}
        <BookingCancelButton
          item={item}
          memberId={memberId}
          allowed={cancelAllowed}
          booked={booked}
          mutation={cancel}
        />
        {rosterButton}
      </div>
      <WaitlistControls item={item} allowed={enrollAllowed} memberId={memberId} booked={booked} />
      <BookingNotice
        item={item}
        booked={booked}
        allowed={hasBookingPermission(enrollAllowed, cancelAllowed)}
      />
      {rosterOpen && <ClassRosterModal item={item} onClose={() => setRosterOpen(false)} />}
    </div>
  );
}
