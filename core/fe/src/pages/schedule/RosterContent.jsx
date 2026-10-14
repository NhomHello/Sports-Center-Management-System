import { Button, Select, Space, Table, Typography } from 'antd';
import { PERMISSIONS as P } from '@scms/shared';
import { formatDateTime } from '@/utils/format';
import { ScheduleStatusTag } from './ScheduleStatusTag';
const columns = [
  { title: 'Hội viên', dataIndex: ['member', 'fullName'] },
  { title: 'Email', dataIndex: ['member', 'email'] },
  { title: 'Điện thoại', dataIndex: ['member', 'phone'] },
  { title: 'Đăng ký', dataIndex: 'enrolledAt', render: formatDateTime },
  { title: 'Trạng thái', render: (_, row) => <ScheduleStatusTag status={row.status} /> },
];
/** Bản danh sách có thể in, tên người thao tác thay cho ID nội bộ. */
const actorName = (row) =>
  row.actor ? `${row.actor.fullName} · ${row.actor.role.name}` : 'Hệ thống';

const sessionOptions = (detail) =>
  (detail.data?.data.sessions || []).map((s) => ({
    value: s.id,
    label: `${formatDateTime(s.startAt)} · ${s.status === 'CANCELLED' ? 'Đã hủy' : 'Buổi học'}`,
  }));

export function RosterContent({
  item,
  data,
  detail,
  count,
  session,
  sessionId,
  onSessionChange,
  onAttendance,
  can,
}) {
  return (
    <div className="scms-printable scms-roster-print">
      <Typography.Title level={5}>
        Đã đăng ký {count}/{item.capacity}
      </Typography.Title>
      <Space wrap className="scms-no-print">
        <Select
          aria-label="Chọn buổi"
          placeholder="Chọn buổi"
          style={{ width: 280 }}
          value={sessionId}
          onChange={onSessionChange}
          loading={detail.isPending}
          options={sessionOptions(detail)}
        />
        {session && can(P.ATTENDANCE_RECORD, P.ATTENDANCE_MANAGE) && (
          <Button onClick={() => onAttendance()}>Xem / ghi điểm danh</Button>
        )}
        <Button onClick={() => window.print()}>In danh sách</Button>
      </Space>
      {detail.isError && <Typography.Text type="danger">{detail.error.message}</Typography.Text>}
      {session && (
        <>
          <Typography.Paragraph>{formatDateTime(session.startAt)}</Typography.Paragraph>
          <ScheduleStatusTag status={session.status} endAt={session.endAt} />
        </>
      )}
      <Table
        rowKey="id"
        columns={columns}
        dataSource={data?.items || []}
        scroll={{ x: 640 }}
        pagination={{ hideOnSinglePage: true }}
      />
      <Typography.Title level={5}>Lịch sử đăng ký / hủy</Typography.Title>
      <Table
        rowKey="id"
        size="small"
        dataSource={data?.history || []}
        columns={[
          {
            title: 'Thao tác',
            dataIndex: 'action',
            render: (v) => (v === 'CREATE' ? 'Đăng ký' : 'Hủy'),
          },
          { title: 'Người thực hiện', render: (_, row) => actorName(row) },
          { title: 'Thời gian', dataIndex: 'createdAt', render: formatDateTime },
        ]}
        pagination={{ hideOnSinglePage: true }}
      />
    </div>
  );
}
