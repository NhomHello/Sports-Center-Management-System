import { StudentProfileButton } from '@/pages/profiles/StudentProfileButton';
import { Form, Select, Table } from 'antd';
const EXCUSED = 'EXCUSED';
// "Xin nghỉ" do hội viên báo trước hạn (GY-30): giữ hiển thị, ghi vắng không ghi đè được ở server.
const OPTIONS = [
  { value: 'PRESENT', label: 'Có mặt' },
  { value: 'ABSENT', label: 'Vắng mặt' },
  { value: EXCUSED, label: 'Xin nghỉ', disabled: true },
];
/** Cho phép đổi Có mặt/Vắng mặt trong thời gian buổi học; backend luôn xác nhận lại hạn. */
export function AttendanceTable({ data }) {
  return (
    <Table
      rowKey={(row) => row.member.id}
      dataSource={data.items}
      pagination={false}
      columns={[
        { title: 'Hội viên', render: (_, row) => <StudentProfileButton member={row.member} /> },
        {
          title: 'Điểm danh',
          render: (_, row) => (
            <Form.Item name={String(row.member.id)} noStyle>
              <Select
                allowClear
                aria-label={`Điểm danh ${row.member.fullName}`}
                placeholder="Chưa ghi"
                style={{ width: 180 }}
                options={OPTIONS}
              />
            </Form.Item>
          ),
        },
      ]}
    />
  );
}
