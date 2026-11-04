import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button, Input, Space, Table, Tag, Typography } from 'antd';
import { useAuth } from '@/hooks/useAuth';
import { useTableQuery } from '@/hooks/useTableQuery';
import { listCancellations } from '@/services/cancellationHistory.service';
import { formatCurrency, formatDateTime } from '@/utils/format';
import { QueryState } from '../schedule/QueryState';
import { CancellationDetails } from './CancellationDetails';
import { PAYOUT_LABELS } from './cancellationHistory';

const REFRESH_MS = 5000;
/** Hội viên xem chính chủ; admin xem lịch sử trong hồ sơ hội viên hoặc danh sách tổng. */
export function CancellationHistoryPanel({ memberId, all = false }) {
  const { user } = useAuth();
  const table = useTableQuery();
  const [selected, setSelected] = useState(null);
  const staff = Boolean(memberId || all);
  const query = useQuery({
    queryKey: ['course-cancellations', user?.id, staff, memberId, table.params],
    queryFn: () => listCancellations({ ...table.params, ...(memberId && { memberId }) }, staff),
    refetchInterval: REFRESH_MS,
  });
  const selectedItem = query.data?.data.find((row) => row.id === selected) ?? null;
  return (
    <Space orientation="vertical" className="scms-full-width">
      <Typography.Paragraph type="secondary">
        Lịch sử hủy khóa học đã thanh toán. Dùng mã hoàn tiền để liên hệ admin; hủy xong không tự có
        nghĩa tiền đã được chuyển trả.
      </Typography.Paragraph>
      <Input.Search
        allowClear
        placeholder="Tìm mã hoàn, mã hóa đơn, tên khóa học hoặc hội viên"
        aria-label="Tìm lịch sử hủy"
        onSearch={(search) => table.setFilters({ search })}
      />
      <QueryState query={query}>
        <Table
          rowKey="id"
          dataSource={query.data?.data}
          scroll={{ x: 900 }}
          pagination={table.paginationProps(query.data?.meta)}
          onChange={table.onTableChange}
          columns={[
            { title: 'Thời điểm hủy', dataIndex: 'cancelledAt', render: formatDateTime },
            { title: 'Hội viên', dataIndex: ['member', 'fullName'] },
            { title: 'Khóa học', dataIndex: 'courseName' },
            {
              title: 'Mã hoàn',
              render: (_, row) =>
                row.refund ? <Typography.Text copyable>{row.refund.code}</Typography.Text> : '—',
            },
            {
              title: 'Số tiền hoàn',
              dataIndex: 'refundAmount',
              render: (value) => formatCurrency(value),
            },
            {
              title: 'Trạng thái',
              dataIndex: 'payoutStatus',
              render: (status) => (
                <Tag color={status === 'PENDING' ? 'orange' : 'green'}>{PAYOUT_LABELS[status]}</Tag>
              ),
            },
            {
              title: 'Thao tác',
              render: (_, row) => <Button onClick={() => setSelected(row.id)}>Chi tiết hủy</Button>,
            },
          ]}
        />
      </QueryState>
      <CancellationDetails item={selectedItem} onClose={() => setSelected(null)} />
    </Space>
  );
}
