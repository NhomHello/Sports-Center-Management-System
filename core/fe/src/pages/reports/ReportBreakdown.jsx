import { useState } from 'react';
import { Card, Select, Table } from 'antd';
import { REPORT_DIMENSIONS } from '@/constants/reports';
import { formatCurrency } from '@/utils/format';
/** Chuyển chiều cơ cấu/top, thứ tự theo thuần do server cung cấp. */
export function ReportBreakdown({ breakdown }) {
  const [dimension, setDimension] = useState('byKind');
  return <Card title="Cơ cấu doanh thu và xếp hạng" extra={<Select aria-label="Chiều cơ cấu" value={dimension} onChange={setDimension} options={REPORT_DIMENSIONS} style={{ minWidth: 170 }} />}>
    <Table rowKey="id" dataSource={breakdown?.[dimension] ?? []} scroll={{ x: 540 }} pagination={{ hideOnSinglePage: true }}
      columns={[{ title: 'Nhóm', dataIndex: 'label' }, ...[['revenue', 'Thu'], ['refunded', 'Hoàn'], ['net', 'Thuần']].map(([key, title]) => ({ title, dataIndex: key, render: (value) => formatCurrency(value) }))]} />
  </Card>;
}
