import { useState } from 'react';
import { PERMISSIONS as P } from '@scms/shared';
import { Button, Space } from 'antd';
import { ENROLLMENT_STATUS } from '@/constants/schedule';
import { usePermission } from '@/hooks/usePermission';
import { useScheduleMutation } from '@/hooks/useScheduleMutation';
import * as service from '@/services/schedule.service';
import { BookingEnrollButton, BookingCancelButton, BookingNotice } from './BookingControls';
import { ClassRosterModal } from './ClassRosterModal';

/** Chỉ dùng điều kiện server trả, không tính hạn huỷ ở FE. */
export function ClassBookingActions({ item, memberId }) {
  const { can } = usePermission();
  const [rosterOpen, setRosterOpen] = useState(false);
  const enrollAllowed = can(memberId ? P.CLASS_ENROLL_FOR_MEMBER : P.CLASS_ENROLL_SELF);
  const cancelAllowed = can(memberId ? P.CLASS_ENROLL_FOR_MEMBER : P.CLASS_CANCEL_SELF);
  const enroll = useScheduleMutation(() => service.enrollClass(item.id, memberId));
  const cancel = useScheduleMutation(() => service.cancelEnrollment(item.id, memberId));
  const booked = item.enrollment?.status === ENROLLMENT_STATUS.BOOKED;
  return (
    <Space vertical className="scms-schedule-stack">
      <Space wrap>
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
        {can(P.CLASS_VIEW_ROSTER, P.CLASS_READ_ALL) && (
          <Button onClick={() => setRosterOpen(true)}>Danh sách học viên</Button>
        )}
      </Space>
      <BookingNotice item={item} booked={booked} allowed={enrollAllowed || cancelAllowed} />
      {rosterOpen && <ClassRosterModal item={item} onClose={() => setRosterOpen(false)} />}
    </Space>
  );
}
