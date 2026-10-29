import { Alert, Button, Empty, Listy, Spin } from 'antd';
import { getApiAvailabilityNotice } from '@/utils/apiAvailability';
import { NotificationItem } from './NotificationItem';

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
        title={notice.message}
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
    <Listy
      className={`scms-notification-list${compact ? ' scms-notification-list--compact' : ''}`}
      rowKey="id"
      items={notifications}
      styles={{ item: { padding: 0, border: 0 } }}
      itemRender={(notification) => (
        <NotificationItem
          {...{
            notification,
            mutation,
            selectable,
            selectedIds,
            onSelectionChange,
            isBusy,
            failedIds,
          }}
        />
      )}
    />
  );
}
