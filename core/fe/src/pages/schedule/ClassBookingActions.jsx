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

/** Lớp có học phí: mua khóa / giữ chỗ / hủy-đổi khóa thay cho đăng ký miễn phí (GY-22). */
function CourseBookingActions({
  item,
  memberId,
  enrollAllowed,
  cancel,
  rosterButton,
  booked,
  roster,
}) {
  return (
    <div className="scms-booking-actions">
      <CourseOrderControls
        item={item}
        memberId={memberId}
        allowed={enrollAllowed}
        cancel={cancel}
      />
      <div className="scms-booking-actions__buttons">{rosterButton}</div>
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
export function ClassBookingActions({ item, memberId, rosterOnly = false }) {
  const { can } = usePermission();
  const [rosterOpen, setRosterOpen] = useState(false);
  const { enrollAllowed, cancelAllowed } = bookingPermissions(can, memberId);
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
  if (item.price > 0)
    return (
      <CourseBookingActions
        {...{ item, memberId, enrollAllowed, cancel, rosterButton, booked }}
        roster={rosterOpen && <ClassRosterModal item={item} onClose={() => setRosterOpen(false)} />}
      />
    );
  return (
    <div className="scms-booking-actions">
      <div className="scms-booking-actions__buttons">
        <BookingEnrollButton
          item={item}
          memberId={memberId}
          allowed={enrollAllowed}
          booked={booked}
          mutation={enroll}
        />
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
      <BookingNotice item={item} booked={booked} allowed={enrollAllowed || cancelAllowed} />
      {rosterOpen && <ClassRosterModal item={item} onClose={() => setRosterOpen(false)} />}
    </div>
  );
}
