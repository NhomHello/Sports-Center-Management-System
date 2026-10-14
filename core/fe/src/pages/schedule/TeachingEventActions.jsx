import { useState } from 'react';
import { Button, Space } from 'antd';
import { PERMISSIONS } from '@scms/shared';
import { usePermission } from '@/hooks/usePermission';
import { AttendanceModal } from './AttendanceModal';
import { ClassRosterModal } from './ClassRosterModal';
/** Lối tắt từ buổi đang dạy; API vẫn kiểm tra coach phụ trách thực tế. */
export function TeachingEventActions({ event }) {
  const { can } = usePermission();
  const [mode, setMode] = useState(null);
  return (
    <Space wrap>
      {can(PERMISSIONS.CLASS_VIEW_ROSTER, PERMISSIONS.CLASS_READ_ALL) && (
        <Button onClick={() => setMode('roster')}>Danh sách hội viên</Button>
      )}
      {can(PERMISSIONS.ATTENDANCE_RECORD, PERMISSIONS.ATTENDANCE_MANAGE) && (
        <Button onClick={() => setMode('attendance')}>Điểm danh</Button>
      )}
      {mode === 'roster' && (
        <ClassRosterModal item={event.gymClass} onClose={() => setMode(null)} />
      )}
      {mode === 'attendance' && <AttendanceModal session={event} onClose={() => setMode(null)} />}
    </Space>
  );
}
