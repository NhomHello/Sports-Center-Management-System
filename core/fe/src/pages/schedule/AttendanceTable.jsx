import { Form, Select, Table } from 'antd';
const EXCUSED = 'EXCUSED';
// "Xin nghỉ" do hội viên báo trước hạn (GY-30): giữ hiển thị, ghi vắng không ghi đè được ở server.
const OPTIONS = [
  { value: 'PRESENT', label: 'Có mặt' },
  { value: 'ABSENT', label: 'Vắng mặt' },
  { value: EXCUSED, label: 'Xin nghỉ', disabled: true },
];
/** Chỉ cho ghi vắng sau giờ kết thúc, backend kiểm tra lại toàn bộ danh sách. */
export function AttendanceTable({ data, session }) {
  return (
    <Table
      rowKey={(row) => row.member.id}
      dataSource={data.items}
      pagination={false}
      columns={[
        { title: 'Hội viên', render: (_, row) => row.member.fullName },
        {
          title: 'Điểm danh',
          render: (_, row) => (
            <Form.Item name={String(row.member.id)} noStyle>
              <Select
                allowClear
                aria-label={`Điểm danh ${row.member.fullName}`}
                placeholder="Chưa ghi"
                style={{ width: 180 }}
                options={OPTIONS.map((o) => ({
                  ...o,
                  disabled:
                    o.disabled || (o.value === 'ABSENT' && new Date(session.endAt) > new Date()),
                }))}
              />
            </Form.Item>
          ),
        },
      ]}
    />
  );
}
