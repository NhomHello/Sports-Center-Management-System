import { Rate, Table, Tag, Typography } from 'antd';
import { formatDateTime } from '@/utils/format';
import { sessionAttendance } from '@/utils/courseHistory';

function AttendanceCell({ session, asOf }) {
  const status = sessionAttendance(session, asOf);
  return <Tag color={status.color}>{status.label}</Tag>;
}
function SessionTime({ session }) {
  return (
    <div>
      <Typography.Text strong>{formatDateTime(session.startAt)}</Typography.Text>
      <br />
      <Typography.Text type="secondary">Đến {formatDateTime(session.endAt)}</Typography.Text>
      {session.status === 'CANCELLED' && (
        <div>
          <Tag>Buổi đã hủy</Tag>
        </div>
      )}
    </div>
  );
}
/** Hiện mọi buổi theo thứ tự, kể cả buổi chưa có điểm danh hoặc nhận xét. */
export function CourseSessionTable({ sessions, asOf }) {
  return (
    <Table
      rowKey="id"
      className="scms-course-session-history"
      dataSource={sessions}
      pagination={false}
      scroll={{ x: 1250 }}
      columns={[
        {
          title: 'Buổi',
          dataIndex: 'number',
          width: 80,
          render: (number) => <strong>Buổi {number}</strong>,
        },
        {
          title: 'Thời gian',
          width: 210,
          render: (_, session) => <SessionTime session={session} />,
        },
        {
          title: 'HLV buổi học',
          width: 170,
          render: (_, session) => session.coach.fullName ?? 'Chưa phân công',
        },
        {
          title: 'Điểm danh',
          width: 180,
          render: (_, session) => <AttendanceCell session={session} asOf={asOf} />,
        },
        {
          title: 'Đánh giá',
          width: 150,
          render: (_, session) =>
            session.feedback?.rating ? (
              <Rate disabled value={session.feedback.rating} style={{ fontSize: 14 }} />
            ) : (
              'Chưa đánh giá'
            ),
        },
        {
          title: 'Nhận xét của HLV',
          width: 320,
          render: (_, session) => (
            <div style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
              {session.feedback?.note || 'Chưa có nhận xét'}
            </div>
          ),
        },
        {
          title: 'Người nhận xét',
          width: 180,
          render: (_, session) => session.feedback?.author.fullName ?? '—',
        },
      ]}
    />
  );
}
