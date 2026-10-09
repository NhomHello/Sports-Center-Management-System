import { useQuery } from '@tanstack/react-query';
import { Descriptions, Drawer, List, Space, Tag, Typography } from 'antd';
import { QUERY_KEYS } from '@/constants';
import { CLASS_STATUS_LABELS, ENROLLMENT_STATUS_LABELS } from '@/constants/schedule';
import * as scheduleService from '@/services/schedule.service';
import { formatDateTime } from '@/utils/format';
import { ClassSessionsTable } from './ClassSessionsTable';
import { QueryState } from './QueryState';

function cancellationText(item) {
  const deadline = item.cancellationExceptionUntil || item.cancelDeadline;
  if (!deadline) return 'Chưa có mốc huỷ';
  const suffix = item.canCancel ? '' : ' (đã hết hạn)';
  return `${formatDateTime(deadline)}${suffix}`;
}

function detailItems(item) {
  return [
    { key: 'subject', label: 'Bộ môn', children: item.subject.name },
    { key: 'room', label: 'Phòng', children: item.room.name },
    { key: 'teacher', label: 'HLV', children: item.coach.fullName },
    {
      key: 'seats',
      label: 'Chỗ còn lại',
      children: `${item.seatsRemaining}/${item.capacity}`,
    },
    {
      key: 'registration',
      label: 'Đăng ký',
      children: `${formatDateTime(item.registrationStartAt)} – ${formatDateTime(item.registrationEndAt)}`,
    },
    {
      key: 'status',
      label: 'Trạng thái lớp',
      children: <Tag>{CLASS_STATUS_LABELS[item.status] || item.status}</Tag>,
    },
    {
      key: 'enrollment',
      label: 'Trạng thái đăng ký',
      children: item.enrollment ? (
        <Tag>{ENROLLMENT_STATUS_LABELS[item.enrollment.status] || item.enrollment.status}</Tag>
      ) : (
        'Chưa đăng ký'
      ),
    },
    { key: 'cancel', label: 'Được phép huỷ đến', children: cancellationText(item) },
  ];
}

/** Hiển thị đầy đủ thông tin lớp, lịch từng buổi và lịch sử thay đổi. */
export function ClassDetailDrawer({ id, onClose }) {
  const query = useQuery({
    queryKey: [...QUERY_KEYS.SCHEDULE, 'detail', id],
    queryFn: () => scheduleService.getClass(id),
  });
  const item = query.data?.data;

  return (
    <Drawer
      className="scms-class-detail"
      open
      title={item?.name || 'Chi tiết lớp'}
      onClose={onClose}
      size="large"
    >
      <QueryState query={query}>
        {item && (
          <Space vertical className="scms-schedule-stack">
            <Descriptions column={1} items={detailItems(item)} />
            {item.description && <Typography.Paragraph>{item.description}</Typography.Paragraph>}
            <Typography.Title level={5}>Các buổi học</Typography.Title>
            <ClassSessionsTable sessions={item.sessions} />
            <Typography.Title level={5}>Thay đổi lịch</Typography.Title>
            <List
              dataSource={item.events || []}
              locale={{ emptyText: 'Chưa có thay đổi lịch' }}
              renderItem={(event) => (
                <List.Item>
                  <Space vertical>
                    <Typography.Text strong>
                      {event.title} · {formatDateTime(event.createdAt)}
                    </Typography.Text>
                    <Typography.Text>{event.message}</Typography.Text>
                  </Space>
                </List.Item>
              )}
            />
          </Space>
        )}
      </QueryState>
    </Drawer>
  );
}
