import { Table, Tag } from 'antd';
import { SESSION_STATUS, SESSION_STATUS_LABELS } from '@/constants/schedule';
import { formatDateTime } from '@/utils/format';

const columns = [
  { title: 'Bắt đầu', dataIndex: 'startAt', render: formatDateTime },
  { title: 'Kết thúc', dataIndex: 'endAt', render: formatDateTime },
  { title: 'Phòng', dataIndex: 'roomName' },
  { title: 'HLV', dataIndex: 'coachName' },
  {
    title: 'Trạng thái',
    dataIndex: 'status',
    render: (status) => (
      <Tag color={status === SESSION_STATUS.CANCELLED ? 'red' : 'blue'}>
        {SESSION_STATUS_LABELS[status] || status}
      </Tag>
    ),
  },
];

/** Giữ cả buổi đã huỷ và đã diễn ra để người dùng xem lịch sử. */
export function ClassSessionsTable({ sessions }) {
  return (
    <Table
      rowKey="id"
      columns={columns}
      dataSource={sessions || []}
      pagination={false}
      scroll={{ x: 640 }}
    />
  );
}
