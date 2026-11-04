import { Button, Table, Typography } from 'antd';
import { formatCurrency } from '@/utils/format';
/** Cùng bảng tra cứu mã cho hội viên và admin; hội viên không được có nút xác nhận chuyển trả. */
export function RefundHistoryTable({ query, table, own, onSelect }) {
  return (
    <Table
      rowKey="id"
      dataSource={query.data?.data}
      pagination={table.paginationProps(query.data?.meta)}
      onChange={table.onTableChange}
      scroll={{ x: 900 }}
      columns={[
        {
          title: 'Mã hoàn tiền',
          dataIndex: 'code',
          render: (code) => <Typography.Text copyable>{code}</Typography.Text>,
        },
        { title: 'Hội viên', dataIndex: ['invoice', 'user', 'fullName'] },
        { title: 'Hóa đơn', dataIndex: ['invoice', 'code'] },
        { title: 'Số tiền hoàn', dataIndex: 'amount', render: (v) => formatCurrency(v) },
        { title: 'Lý do', dataIndex: 'reason' },
        {
          title: 'Trạng thái',
          dataIndex: 'status',
          render: (v) => (v === 'PENDING' ? 'Chờ chuyển trả' : 'Đã hoàn tất'),
        },
        { title: 'Tham chiếu', dataIndex: 'reference' },
        {
          title: 'Thao tác',
          render: (_, row) =>
            !own &&
            row.status === 'PENDING' && (
              <Button onClick={() => onSelect(row)}>Xác nhận đã chuyển trả</Button>
            ),
        },
      ]}
    />
  );
}
