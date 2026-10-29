import { Button, Table, Tag } from 'antd';
import { Link } from 'react-router';
import { ROUTES, TABLE } from '@/constants';

const percent = (value) =>
  `${Number(value).toLocaleString('vi-VN', { maximumFractionDigits: 2 })}%`;
/** Giữ số liệu server, dùng cùng tập dữ liệu với exporter. */
export function CourseReportTable({ report }) {
  const columns = [
    { title: 'Khóa học', dataIndex: 'className' },
    { title: 'Bộ môn', dataIndex: 'subjectName' },
    { title: 'HLV', render: (_, row) => row.coach.fullName },
    {
      title: 'Nộp tổng kết',
      render: (_, row) => (
        <Tag color={row.submitted ? 'green' : 'orange'}>
          {row.submitted ? 'Đã nộp' : row.overdue ? 'Quá hạn nộp' : 'Chưa nộp'}
        </Tag>
      ),
    },
    { title: 'Hội viên', dataIndex: 'studentCount' },
    { title: 'Chuyên cần TB', dataIndex: 'attendancePercent', render: percent },
    { title: '% Đạt', dataIndex: 'passPercent', render: percent },
    { title: 'Điểm khóa', dataIndex: 'courseStars' },
    { title: 'Điểm HLV', dataIndex: 'coachStars' },
    {
      title: 'Thao tác',
      render: (_, row) => (
        <Link to={ROUTES.COURSE_SUMMARY.replace(':id', row.classId)}>
          <Button>Xem tổng kết</Button>
        </Link>
      ),
    },
  ];
  return (
    <Table
      rowKey="id"
      columns={columns}
      dataSource={report.items}
      pagination={{ pageSize: TABLE.DEFAULT_PAGE_SIZE }}
      scroll={{ x: 1200 }}
    />
  );
}
