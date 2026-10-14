import { Select, Table } from 'antd';
import { formatDateTime } from '@/utils/format';
/** Phòng đề xuất do server kiểm tra sức chứa và xung đột. */
export function MaintenanceAssignments({ sessions, assignments, setAssignments }) {
  return (
    <Table
      rowKey="id"
      dataSource={sessions}
      pagination={false}
      scroll={{ x: 600 }}
      columns={[
        { title: 'Lớp', dataIndex: ['gymClass', 'name'] },
        { title: 'Buổi', dataIndex: 'startAt', render: formatDateTime },
        { title: 'Đã đăng ký', render: (_, s) => s.gymClass._count.enrollments },
        {
          title: 'Xử lý',
          render: (_, s) => (
            <Select
              placeholder="Chọn cách xử lý"
              style={{ width: 200 }}
              value={assignments[s.id]}
              onChange={(value) => setAssignments((old) => ({ ...old, [s.id]: value }))}
              options={[
                ...s.suggestions.map((r) => ({
                  value: r.id,
                  label: `${r.name} · ${r.capacity} chỗ`,
                })),
                { value: null, label: 'Huỷ buổi (thông báo hội viên)' },
              ]}
            />
          ),
        },
      ]}
    />
  );
}
