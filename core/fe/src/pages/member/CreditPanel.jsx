import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Alert, Button, Card, Empty, Space, Table, Typography } from 'antd';
import { PERMISSIONS as P } from '@scms/shared';
import { TABLE } from '@/constants';
import { useAuth } from '@/hooks/useAuth';
import { usePermission } from '@/hooks/usePermission';
import { getOwnCredit, getMemberCredit } from '@/services/credit.service';
import { formatCurrency, formatDateTime } from '@/utils/format';

const REASONS = Object.freeze({
  CANCELLATION: 'Hủy gói / khóa',
  CHANGE: 'Đổi gói / lớp',
  PAYMENT: 'Thanh toán',
  ADJUSTMENT: 'Điều chỉnh',
});
const COLUMNS = [
  { title: 'Thời gian', dataIndex: 'createdAt', render: formatDateTime },
  { title: 'Nội dung', dataIndex: 'reason', render: (value) => REASONS[value] ?? value },
  { title: 'Biến động', dataIndex: 'amount', render: (value) => formatCurrency(value) },
  { title: 'Số dư sau', dataIndex: 'balanceAfter', render: (value) => formatCurrency(value) },
  { title: 'Ghi chú', dataIndex: 'note' },
];

/** GY-34: gắn vào hồ sơ hoặc chi tiết hội viên; không trộn cache giữa hai tài khoản. */
function useCreditLedger(memberId) {
  const { user } = useAuth();
  const { can } = usePermission();
  const [page, setPage] = useState(TABLE.DEFAULT_PAGE);
  const other = Boolean(memberId && memberId !== user?.id);
  const allowed = can(other ? P.PAYMENT_READ_ALL : P.PAYMENT_READ_OWN);
  const params = { page, pageSize: TABLE.DEFAULT_PAGE_SIZE };
  const query = useQuery({
    queryKey: ['credit', user?.id, memberId ?? user?.id, params],
    queryFn: () => (other ? getMemberCredit(memberId, params) : getOwnCredit(params)),
    enabled: Boolean(user?.id) && allowed,
    retry: false,
  });
  return { query, allowed, page, setPage };
}

/** GY-34: số dư và lịch sử dùng chung cho hồ sơ cá nhân và chi tiết hội viên. */
export function CreditPanel({ memberId }) {
  const { query, allowed, page, setPage } = useCreditLedger(memberId);
  if (!allowed) return null;
  const data = query.data?.data;
  const rows = Array.isArray(data?.items) ? data.items : [];
  return (
    <Card title="Số dư tài khoản" loading={query.isPending}>
      {query.isError && (
        <Alert
          showIcon
          type="error"
          title={query.error.message}
          action={<Button onClick={() => query.refetch()}>Thử lại</Button>}
        />
      )}
      {data && (
        <Space orientation="vertical" className="scms-full-width">
          <Typography.Title level={3}>{formatCurrency(data.balance)}</Typography.Title>
          <Typography.Text type="secondary">
            Số dư dùng thanh toán cho lần mua tiếp theo. Lịch sử được giữ nguyên.
          </Typography.Text>
          <Table
            rowKey="id"
            size="small"
            columns={COLUMNS}
            dataSource={rows}
            pagination={false}
            scroll={{ x: true }}
            locale={{ emptyText: <Empty description="Chưa có biến động số dư" /> }}
          />
          <Space>
            <Button
              disabled={page === TABLE.DEFAULT_PAGE || query.isFetching}
              onClick={() => setPage(page - 1)}
            >
              Trang trước
            </Button>
            <Typography.Text>Trang {page}</Typography.Text>
            <Button
              disabled={rows.length < TABLE.DEFAULT_PAGE_SIZE || query.isFetching}
              onClick={() => setPage(page + 1)}
            >
              Trang sau
            </Button>
          </Space>
        </Space>
      )}
    </Card>
  );
}
