import { Button, Checkbox, Space, Tag, Typography } from 'antd';
import { NOTIFICATION_KIND_LABELS } from '@/constants';
import { formatDateTime } from '@/utils/format';

const getKindLabel = ({ kind, kindLabel }) => kindLabel ?? NOTIFICATION_KIND_LABELS[kind] ?? kind;

/** Nội dung và thao tác của một thông báo trong danh sách. */
export function NotificationItem({
  notification,
  mutation,
  selectable,
  selectedIds,
  onSelectionChange,
  isBusy,
  failedIds,
}) {
  const { kind, readAt, id } = notification;
  return (
    <div
      className={`scms-notification-item${!readAt ? ' scms-notification-list__item--unread' : ''}`}
    >
      <div className="scms-notification-meta">
        <div className="scms-notification-title">
          <Space wrap size={[6, 4]}>
            <Typography.Text strong={!readAt}>{notification.title}</Typography.Text>
            {kind && <Tag>{getKindLabel(notification)}</Tag>}
            {failedIds?.includes(id) && <Tag color="red">Chưa cập nhật được</Tag>}
            <Tag color={readAt ? 'default' : 'blue'}>{readAt ? 'Đã đọc' : 'Chưa đọc'}</Tag>
          </Space>
        </div>
        <div className="scms-notification-description">
          <Typography.Paragraph className="scms-notification-message">
            {notification.message}
          </Typography.Paragraph>
          <Typography.Text type="secondary">
            {formatDateTime(notification.createdAt)}
          </Typography.Text>
        </div>
      </div>
      {!readAt && (
        <Space className="scms-notification-actions">
          {selectable && (
            <Checkbox
              checked={selectedIds.includes(id)}
              disabled={isBusy}
              aria-label={`Chọn thông báo: ${notification.title}`}
              onChange={(event) => onSelectionChange(id, event.target.checked)}
            />
          )}
          <Button
            type="link"
            loading={mutation.isPending && mutation.variables === id}
            disabled={isBusy}
            onClick={() => mutation.mutate(id)}
          >
            Đánh dấu đã đọc
          </Button>
        </Space>
      )}
    </div>
  );
}
