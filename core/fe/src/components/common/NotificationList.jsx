/* eslint-disable max-lines-per-function -- Bỏ giới hạn dòng theo yêu cầu Sprint 1. */
import { Alert, Button, Checkbox, Empty, List, Spin, Space, Tag, Typography } from 'antd';
import { NOTIFICATION_KIND_LABELS } from '@/constants';
import { getApiAvailabilityNotice } from '@/utils/apiAvailability';
import { formatDateTime } from '@/utils/format';

const getKindLabel = ({ kind, kindLabel }) => kindLabel ?? NOTIFICATION_KIND_LABELS[kind] ?? kind;

/** Danh sách thông báo của tài khoản hiện tại, dùng cho chuông và trang S21. */
export function NotificationList({
  query,
  notifications,
  mutation,
  compact,
  selectable,
  selectedIds = [],
  onSelectionChange,
  isBusy,
  failedIds,
}) {
  if (query.isPending) return <Spin />;
  if (query.isError) {
    const notice = getApiAvailabilityNotice(query.error, 'Thông báo');
    return (
      <Alert
        showIcon
        type={notice.type}
        message={notice.message}
        description={notice.description}
        action={
          notice.retryable && (
            <Button type="link" onClick={() => query.refetch()}>
              Thử lại
            </Button>
          )
        }
      />
    );
  }
  if (notifications.length === 0) {
    return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Không có thông báo" />;
  }

  return (
    <List
      className={`scms-notification-list${compact ? ' scms-notification-list--compact' : ''}`}
      dataSource={notifications}
      renderItem={(notification) => (
        <List.Item
          className={!notification.readAt ? 'scms-notification-list__item--unread' : undefined}
          actions={
            notification.readAt
              ? []
              : [
                  ...(selectable
                    ? [
                        <Checkbox
                          key="select"
                          checked={selectedIds.includes(notification.id)}
                          disabled={isBusy}
                          aria-label={`Chọn thông báo: ${notification.title}`}
                          onChange={(event) =>
                            onSelectionChange(notification.id, event.target.checked)
                          }
                        />,
                      ]
                    : []),
                  <Button
                    key="read"
                    type="link"
                    loading={mutation.isPending && mutation.variables === notification.id}
                    disabled={isBusy}
                    onClick={() => mutation.mutate(notification.id)}
                  >
                    Đánh dấu đã đọc
                  </Button>,
                ]
          }
        >
          <List.Item.Meta
            title={
              <Space wrap size={[6, 4]}>
                <Typography.Text strong={!notification.readAt}>
                  {notification.title}
                </Typography.Text>
                {notification.kind && <Tag>{getKindLabel(notification)}</Tag>}
                {failedIds?.includes(notification.id) && <Tag color="red">Chưa cập nhật được</Tag>}
                <Tag color={notification.readAt ? 'default' : 'blue'}>
                  {notification.readAt ? 'Đã đọc' : 'Chưa đọc'}
                </Tag>
              </Space>
            }
            description={
              <>
                <Typography.Paragraph className="scms-notification-message">
                  {notification.message}
                </Typography.Paragraph>
                <Typography.Text type="secondary">
                  {formatDateTime(notification.createdAt)}
                </Typography.Text>
              </>
            }
          />
        </List.Item>
      )}
    />
  );
}
