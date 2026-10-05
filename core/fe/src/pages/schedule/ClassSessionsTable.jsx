import { Table, Tag } from 'antd';
import { SCHEDULE_STATUS_LABELS, SESSION_STATUS } from '@/constants/schedule';
import { formatDateTime } from '@/utils/format';
const columns = [
  { title: 'Bắt đầu', dataIndex: 'startAt', render: formatDateTime },
  { title: 'Kết thúc', dataIndex: 'endAt', render: formatDateTime },
  { title: 'Phòng', dataIndex: 'roomName' },
  { title: 'HLV', dataIndex: 'coachName' },
  {
    title: 'Trạng thái',
    dataIndex: 'status',
    render: (v) => (
      <Tag color={v === SESSION_STATUS.CANCELLED ? 'red' : 'blue'}>{SCHEDULE_STATUS_LABELS[v]}</Tag>
    ),
  },
];
/** Giữ các buổi đã huỷ và đã diễn ra để người dùng xem lịch sử. */
export function ClassSessionsTable({ sessions }) {
  return (
    <Table
      rowKey="id"
      columns={columns}
      dataSource={sessions}
      pagination={false}
      scroll={{ x: 640 }}
    />
  );
}
