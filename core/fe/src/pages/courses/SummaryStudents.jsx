import { useState } from 'react';
import { Alert, Button, Space, Table, Tag } from 'antd';
import { RESULT_LABELS } from '@/constants/courses';
import { SummaryItemModal } from './SummaryItemModal';

/** Các cột chuyên cần chỉ đọc từ API; không tự tính lại hoặc suy đoán dữ liệu chưa điểm danh. */
export function SummaryStudents({ summary, canEdit }) {
  const [item, setItem] = useState(null);
  const columns = [
    { title: 'Hội viên', dataIndex: ['member', 'fullName'] },
    ...[
      ['Có mặt', 'present'],
      ['Vắng', 'absent'],
      ['Xin nghỉ', 'excused'],
      ['Chưa điểm danh', 'missing'],
    ].map(([title, field]) => ({ title, dataIndex: ['attendance', field] })),
    { title: 'Chuyên cần', dataIndex: ['attendance', 'percent'], render: (value) => `${value}%` },
    { title: 'Gợi ý', dataIndex: 'suggestedResult', render: (v) => RESULT_LABELS[v] },
    {
      title: 'Kết quả',
      dataIndex: 'result',
      render: (v) => <Tag>{RESULT_LABELS[v] ?? 'Chưa nhập'}</Tag>,
    },
    { title: 'Tiến bộ', dataIndex: 'progress', render: (v) => (v ? `${v}/5` : 'Chưa nhập') },
    { title: 'Nhận xét', dataIndex: 'comment' },
    { title: 'Khóa tiếp', dataIndex: 'nextCourse' },
  ];
  if (canEdit)
    columns.push({
      title: 'Thao tác',
      render: (_, row) => <Button onClick={() => setItem(row)}>Nhập kết quả</Button>,
    });
  return (
    <Space vertical className="scms-full-width">
      {summary.items.some((row) => row.attendance.missing > 0) && (
        <Alert
          type="warning"
          showIcon
          title="Còn buổi chưa điểm danh. Hãy kiểm tra trước khi công bố."
        />
      )}
      <Table
        rowKey="id"
        columns={columns}
        dataSource={summary.items}
        pagination={false}
        scroll={{ x: 1200 }}
      />
      {item && (
        <SummaryItemModal item={item} classId={summary.classId} onClose={() => setItem(null)} />
      )}
    </Space>
  );
}
