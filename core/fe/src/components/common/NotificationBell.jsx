import { BellOutlined } from '@ant-design/icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { App, Badge, Button, Popover } from 'antd';
import { useState } from 'react';
import { Link } from 'react-router';
import { NotificationList } from '@/components/common/NotificationList';
import { QUERY_KEYS, ROUTES } from '@/constants';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';
import * as notificationService from '@/services/notification.service';
import { getApiOperationErrorMessage } from '@/utils/apiAvailability';

const PANEL_WIDTH = 'min(360px, calc(100vw - 32px))';

/** Chuông hiển thị và đánh dấu đã đọc thông báo của tài khoản hiện tại. */
export function NotificationBell() {
  const { message } = App.useApp();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const queryKey = [...QUERY_KEYS.NOTIFICATIONS, user?.id];
  const query = useNotifications();
  const mutation = useMutation({
    mutationFn: notificationService.markNotificationRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
    onError: (error) =>
      message.error(getApiOperationErrorMessage(error, 'đánh dấu thông báo đã đọc')),
  });
  const notifications = query.data?.data ?? [];
  const unreadCount = query.data?.meta?.unreadCount ?? 0;

  return (
    <Popover
      title="Thông báo"
      content={
        <div className="scms-notification-panel" style={{ width: PANEL_WIDTH }}>
          <NotificationList
            query={query}
            notifications={notifications}
            mutation={mutation}
            compact
          />
          <div className="scms-notification-panel__footer">
            <Link to={ROUTES.NOTIFICATIONS} onClick={() => setOpen(false)}>
              Xem tất cả thông báo
            </Link>
          </div>
        </div>
      }
      trigger="click"
      placement="bottomRight"
      open={open}
      onOpenChange={setOpen}
    >
      <Badge count={unreadCount} size="small" offset={[-3, 4]}>
        <Button type="text" shape="circle" icon={<BellOutlined />} aria-label="Thông báo" />
      </Badge>
    </Popover>
  );
}
