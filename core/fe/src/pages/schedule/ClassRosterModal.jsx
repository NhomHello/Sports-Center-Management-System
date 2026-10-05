import { useQuery } from '@tanstack/react-query';
import { Modal, Table, Tag, Typography } from 'antd';
import { QUERY_KEYS } from '@/constants';
import { SCHEDULE_STATUS_LABELS } from '@/constants/schedule';
import * as service from '@/services/schedule.service';
import { formatDateTime } from '@/utils/format';
import { QueryState } from './QueryState';
const columns = [
  { title: 'Hội viên', render: (_, row) => row.member.fullName },
  { title: 'Email', render: (_, row) => row.member.email || '—' },
  { title: 'Điện thoại', render: (_, row) => row.member.phone || '—' },
  { title: 'Đăng ký', dataIndex: 'enrolledAt', render: formatDateTime },
  {
    title: 'Trạng thái',
    dataIndex: 'status',
    render: (v) => <Tag>{SCHEDULE_STATUS_LABELS[v]}</Tag>,
  },
];
/** Roster và audit booking lấy từ endpoint có kiểm tra phạm vi tại server. */
export function ClassRosterModal({ item, onClose }) {
  const query = useQuery({
    queryKey: [...QUERY_KEYS.SCHEDULE, 'roster', item.id],
    queryFn: () => service.getRoster(item.id),
  });
  return (
    <Modal open title={`Học viên · ${item.name}`} onCancel={onClose} footer={null} width={800}>
      <QueryState query={query}>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={query.data?.data.items || []}
          scroll={{ x: 640 }}
          pagination={{ pageSize: 10 }}
        />
        <Typography.Title level={5}>Lịch sử đăng ký / huỷ</Typography.Title>
        <Table
          rowKey="id"
          size="small"
          dataSource={query.data?.data.history || []}
          columns={[
            {
              title: 'Thao tác',
              dataIndex: 'action',
              render: (v) => (v === 'CREATE' ? 'Đăng ký' : 'Huỷ'),
            },
            { title: 'Nhân viên / hội viên thực hiện', dataIndex: 'userId' },
            { title: 'Thời gian', dataIndex: 'createdAt', render: formatDateTime },
          ]}
          pagination={{ pageSize: 10 }}
        />
      </QueryState>
    </Modal>
  );
}
