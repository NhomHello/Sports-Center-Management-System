import { useState } from 'react';
import { Button, Space, Table } from 'antd';
import { PERMISSIONS as P } from '@scms/shared';
import { SESSION_STATUS } from '@/constants/schedule';
import { usePermission } from '@/hooks/usePermission';
import { formatDateTime } from '@/utils/format';
import { ScheduleStatusTag } from './ScheduleStatusTag';
import { SessionActionModal } from './SessionActionModal';
import { AttendanceModal } from './AttendanceModal';

/** Giữ lịch sử buổi; thao tác theo permission và thời điểm bắt đầu. */
export function ClassSessionsTable({ sessions, memberCount = 0 }) {
  const { can } = usePermission();
  const [action, setAction] = useState(null);
  const columns = [
    { title: 'Bắt đầu', dataIndex: 'startAt', render: formatDateTime },
    { title: 'Kết thúc', dataIndex: 'endAt', render: formatDateTime },
    { title: 'Phòng', dataIndex: 'roomName' },
    { title: 'HLV', dataIndex: 'coachName' },
    {
      title: 'Trạng thái',
      render: (_, s) => <ScheduleStatusTag status={s.status} endAt={s.endAt} />,
    },
    {
      title: 'Thao tác',
      render: (_, session) => {
        const future =
          new Date(session.startAt) > new Date() && session.status === SESSION_STATUS.SCHEDULED;
        return (
          <Space wrap>
            {future && can(P.CLASS_UPDATE) && (
              <Button size="small" onClick={() => setAction({ session, mode: 'reschedule' })}>
                Đổi giờ
              </Button>
            )}
            {future && can(P.CLASS_DELETE) && (
              <Button danger size="small" onClick={() => setAction({ session, mode: 'cancel' })}>
                Huỷ buổi
              </Button>
            )}
            {can(P.ATTENDANCE_RECORD, P.ATTENDANCE_MANAGE) &&
              session.status !== SESSION_STATUS.CANCELLED && (
                <Button size="small" onClick={() => setAction({ session, mode: 'attendance' })}>
                  Điểm danh
                </Button>
              )}
          </Space>
        );
      },
    },
  ];
  return (
    <>
      <Table
        rowKey="id"
        columns={columns}
        dataSource={sessions}
        pagination={false}
        scroll={{ x: 800 }}
      />
      {action &&
        (action.mode === 'attendance' ? (
          <AttendanceModal session={action.session} onClose={() => setAction(null)} />
        ) : (
          <SessionActionModal
            {...action}
            memberCount={memberCount}
            onClose={() => setAction(null)}
          />
        ))}
    </>
  );
}
