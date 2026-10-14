import { Form, Select, Table } from 'antd';
const OPTIONS = [
  { value: 'PRESENT', label: 'Có mặt' },
  { value: 'ABSENT', label: 'Vắng mặt' },
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
                  disabled: o.value === 'ABSENT' && new Date(session.endAt) > new Date(),
                }))}
              />
            </Form.Item>
          ),
        },
      ]}
    />
  );
}
