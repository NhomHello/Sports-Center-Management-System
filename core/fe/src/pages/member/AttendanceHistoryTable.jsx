import dayjs from 'dayjs';
import { Button, Empty, Table, Tag, Typography } from 'antd';
import { VIETNAM_TIME_ZONE } from '@/constants';
import { formatDateTime } from '@/utils/format';

const STATUS = {
  PRESENT: { color: 'success', label: 'Có mặt' },
  ABSENT: { color: 'error', label: 'Vắng mặt' },
  EXCUSED: { color: 'processing', label: 'Xin nghỉ' },
};

/** Không chuyển trạng thái chưa biết thành vắng mặt. */
export function AttendanceStatus({ status }) {
  const presentation = STATUS[status] ?? { label: 'Chưa xác định' };
  return <Tag color={presentation.color}>{presentation.label}</Tag>;
}

/** Ngày/giờ luôn cùng múi giờ Việt Nam. */
export function AttendanceSession({ session }) {
  if (!session?.startAt || !dayjs(session.startAt).isValid())
    return <Typography.Text type="secondary">Chưa cập nhật</Typography.Text>;
  const date = formatDateTime(session.startAt).split(' ')[0];
  const start = dayjs(session.startAt).tz(VIETNAM_TIME_ZONE).format('HH:mm');
  const end = session.endAt ? dayjs(session.endAt).tz(VIETNAM_TIME_ZONE).format('HH:mm') : null;
  return (
    <div className="scms-attendance-history__session">
      <Typography.Text strong>{date}</Typography.Text>
      <Typography.Text type="secondary">
        {start}
        {end && ` – ${end}`}
      </Typography.Text>
    </div>
  );
}

const getAttendanceColumns = () => [
  {
    title: 'Lớp học',
    key: 'class',
    width: '40%',
    render: (_, row) => (
      <div className="scms-attendance-history__class">
        <Typography.Text strong>
          {row.session?.gymClass?.name || 'Lớp chưa cập nhật'}
        </Typography.Text>
        <Typography.Text type="secondary">
          Mã lớp #{row.session?.gymClass?.id || '—'}
        </Typography.Text>
      </div>
    ),
  },
  {
    title: 'Buổi học',
    key: 'session',
    width: 180,
    render: (_, row) => <AttendanceSession session={row.session} />,
  },
  {
    title: 'Kết quả',
    dataIndex: 'status',
    width: 150,
    render: (status) => <AttendanceStatus status={status} />,
  },
  { title: 'Người ghi nhận', key: 'actor', render: (_, row) => row.actor?.fullName || 'Hệ thống' },
];

/** Phân biệt chưa có lịch sử và không có kết quả lọc. */
export function AttendanceEmpty({ filtered, onReset }) {
  return (
    <div className="scms-attendance-history__empty">
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description={
          <Typography.Text strong>
            {filtered ? 'Không tìm thấy kết quả' : 'Chưa có lịch sử điểm danh'}
          </Typography.Text>
        }
      />
      <Typography.Paragraph type="secondary">
        {filtered
          ? 'Thử thay đổi khoảng ngày, mã lớp hoặc trạng thái.'
          : 'Kết quả sẽ xuất hiện sau khi buổi học được ghi nhận điểm danh.'}
      </Typography.Paragraph>
      {filtered && <Button onClick={onReset}>Xóa bộ lọc</Button>}
    </div>
  );
}

/** Bảng cuộn độc lập, không làm tràn trang trên mobile. */
export function AttendanceHistoryTable(props) {
  return (
    <Table
      {...props}
      className="scms-attendance-history__table"
      rowKey="id"
      scroll={{ x: 760 }}
      columns={getAttendanceColumns()}
    />
  );
}
