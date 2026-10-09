import { Button, Popconfirm, Table, Tag } from 'antd';
import { SESSION_STATUS, SESSION_STATUS_LABELS } from '@/constants/schedule';
import { formatDateTime } from '@/utils/format';
import { canCancelSession } from '@/utils/schedule';

const informationColumns = [
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

const cancelColumn = ({ onCancel, cancellingId }) => ({
  title: 'Thao tác',
  key: 'actions',
  render: (_, session) =>
    canCancelSession(session) ? (
      <Popconfirm
        title="Huỷ buổi học này?"
        description="Buổi học vẫn được giữ lại trong lịch sử."
        okText="Huỷ buổi"
        cancelText="Giữ buổi"
        onConfirm={() => onCancel(session.id)}
      >
        <Button danger loading={cancellingId === session.id}>
          Huỷ buổi
        </Button>
      </Popconfirm>
    ) : null,
});

/** Giữ cả buổi đã huỷ và đã diễn ra để người dùng xem lịch sử. */
export function ClassSessionsTable({ sessions, onCancel, cancellingId }) {
  const columns = onCancel
    ? [...informationColumns, cancelColumn({ onCancel, cancellingId })]
    : informationColumns;

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
