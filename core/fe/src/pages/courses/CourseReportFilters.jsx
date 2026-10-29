import { useQuery } from '@tanstack/react-query';
import { Alert, Button, DatePicker, Form, Select, Space } from 'antd';
import { DATE_FORMATS } from '@/constants';
import { COURSE_KEYS } from '@/constants/courses';
import { getCourseReportFilters } from '@/services/course.service';

/** Bộ lọc nháp chưa ảnh hưởng file xuất cho đến khi người xem bấm áp dụng. */
export function CourseReportFilters({ today, onApply }) {
  const query = useQuery({
    queryKey: [...COURSE_KEYS.REPORT, 'filters'],
    queryFn: getCourseReportFilters,
  });
  return (
    <>
      {query.isError && <Alert type="error" title={query.error.message} />}
      <Form
        layout="vertical"
        initialValues={{ dates: [today.startOf('month'), today] }}
        onFinish={({ dates, subjectId, coachId }) =>
          onApply({
            from: dates[0].format('YYYY-MM-DD'),
            to: dates[1].format('YYYY-MM-DD'),
            ...(subjectId && { subjectId }),
            ...(coachId && { coachId }),
          })
        }
      >
        <Space wrap align="end">
          <Form.Item
            name="dates"
            label="Ngày khóa kết thúc"
            rules={[{ required: true, message: 'Chọn khoảng ngày' }]}
          >
            <DatePicker.RangePicker format={DATE_FORMATS.DATE} />
          </Form.Item>
          <Form.Item name="subjectId" label="Bộ môn">
            <Select
              placeholder="Tất cả bộ môn"
              allowClear
              loading={query.isPending}
              options={(query.data?.data.subjects ?? []).map((row) => ({
                value: row.id,
                label: row.name,
              }))}
            />
          </Form.Item>
          <Form.Item name="coachId" label="HLV">
            <Select
              placeholder="Tất cả HLV"
              allowClear
              loading={query.isPending}
              options={(query.data?.data.coaches ?? []).map((row) => ({
                value: row.id,
                label: row.fullName,
              }))}
            />
          </Form.Item>
          <Form.Item>
            <Button htmlType="submit" type="primary">
              Áp dụng tổng kết
            </Button>
          </Form.Item>
        </Space>
      </Form>
    </>
  );
}
