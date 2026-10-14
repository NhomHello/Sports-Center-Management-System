import { useState } from 'react';
import { Modal } from 'antd';
import { useLiveScheduleQuery } from '@/hooks/useLiveScheduleQuery';
import { QUERY_KEYS } from '@/constants';
import { ENROLLMENT_STATUS } from '@/constants/schedule';
import { usePermission } from '@/hooks/usePermission';
import { PERMISSIONS as P } from '@scms/shared';
import * as service from '@/services/schedule.service';
import { QueryState } from './QueryState';
import { RosterContent } from './RosterContent';
import { AttendanceModal } from './AttendanceModal';
/** Roster in được, chọn buổi để mở điểm danh mà không hiển thị ID thô. */
export function ClassRosterModal({ item, onClose }) {
  const [sessionId, setSessionId] = useState(null);
  const [attendanceOpen, setAttendanceOpen] = useState(false);
  const { can } = usePermission();
  const query = useLiveScheduleQuery({
    queryKey: [...QUERY_KEYS.SCHEDULE, 'roster', item.id],
    queryFn: () => service.getRoster(item.id),
  });
  const detail = useLiveScheduleQuery({
    queryKey: [...QUERY_KEYS.SCHEDULE, 'detail', item.id],
    queryFn: () => service.getClass(item.id),
  });
  const session = detail.data?.data.sessions.find((s) => s.id === sessionId);
  const data = query.data?.data;
  const count = (data?.items || []).filter((i) => i.status === ENROLLMENT_STATUS.BOOKED).length;
  return (
    <Modal
      open
      centered
      title={`Hội viên · ${item.name}`}
      onCancel={onClose}
      footer={null}
      width={900}
    >
      <QueryState query={query}>
        <RosterContent
          item={item}
          data={data}
          detail={detail}
          count={count}
          session={session}
          sessionId={sessionId}
          onSessionChange={setSessionId}
          onAttendance={() => setAttendanceOpen(true)}
          can={can}
        />
      </QueryState>
      {attendanceOpen && (
        <AttendanceModal session={session} onClose={() => setAttendanceOpen(false)} />
      )}
    </Modal>
  );
}
