import { Empty, Table, Typography } from 'antd';
import { formatDate } from '@/utils/format';

const COLUMNS = [
  { title: 'Từ ngày', dataIndex: 'startAt', render: (value) => formatDate(value) },
  { title: 'Đến ngày', dataIndex: 'endAt', render: (value) => formatDate(value) },
  {
    title: 'Ngày được cộng',
    dataIndex: 'creditedDays',
    render: (value) => value ?? 'Chờ kết thúc',
  },
];

/** Lịch sử trống gọn; bảng có dữ liệu chỉ cuộn trong thẻ. */
export function FreezeHistory({ freezes }) {
  return (
    <section className="scms-freeze-history" aria-label="Lịch sử bảo lưu">
      <Typography.Title level={5}>Lịch sử bảo lưu</Typography.Title>
      {freezes.length ? (
        <Table
          rowKey="id"
          size="small"
          pagination={false}
          dataSource={freezes}
          columns={COLUMNS}
          scroll={{ x: 420 }}
        />
      ) : (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có lịch sử bảo lưu" />
      )}
    </section>
  );
}
