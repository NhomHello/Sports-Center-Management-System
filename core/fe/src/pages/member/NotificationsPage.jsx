import { Card, Pagination, Space } from 'antd';
import { useState } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { NotificationList } from '@/components/common/NotificationList';
import { useNotifications, useNotificationReadActions } from '@/hooks/useNotifications';
import { useTableQuery } from '@/hooks/useTableQuery';
import {
  NotificationFeedback,
  NotificationFilters,
  NotificationSelection,
} from './NotificationActions';

/** S21: lọc/phân trang, đọc từng mục hoặc nhóm; các mục lỗi vẫn giữ để retry. */
export default function NotificationsPage() {
  const table = useTableQuery();
  const query = useNotifications(table.params);
  const actions = useNotificationReadActions();
  const { mutation, bulkMutation, failedResults } = actions;
  const [selectedIds, setSelectedIds] = useState([]);
  const notifications = query.data?.data ?? [];
  const unreadIds = notifications.filter((item) => !item.readAt).map((item) => item.id);
  const selectedUnreadIds = selectedIds.filter((id) => unreadIds.includes(id));
  const isBusy = mutation.isPending || bulkMutation.isPending;
  const failedIds = failedResults.map((item) => item.id);
  const handleSelectionChange = (id, checked) =>
    setSelectedIds((ids) =>
      checked ? [...new Set([...ids, id])] : ids.filter((item) => item !== id),
    );
  return (
    <>
      <PageHeader
        title="Thông báo"
        subtitle="Nội dung, sự kiện và trạng thái đọc của tài khoản hiện tại"
      />
      <Card bordered={false} className="scms-workspace-card">
        <NotificationFilters
          table={table}
          query={query}
          onFilter={(value) => {
            table.setFilters({ readStatus: value || undefined });
            setSelectedIds([]);
          }}
        />
        <NotificationFeedback actions={actions} isBusy={isBusy} />
        {!query.isError && (
          <NotificationSelection
            unreadIds={unreadIds}
            selectedIds={selectedUnreadIds}
            isBusy={isBusy}
            bulkMutation={bulkMutation}
            onSelection={setSelectedIds}
          />
        )}
        <NotificationList
          query={query}
          notifications={notifications}
          mutation={mutation}
          selectable
          selectedIds={selectedUnreadIds}
          onSelectionChange={handleSelectionChange}
          isBusy={isBusy}
          failedIds={failedIds}
        />
        {!query.isError && (
          <Space className="scms-list-pagination">
            <Pagination
              {...table.paginationProps(query.data?.meta)}
              onChange={(page, pageSize) => {
                table.onTableChange({ current: page, pageSize });
                setSelectedIds([]);
              }}
            />
          </Space>
        )}
      </Card>
    </>
  );
}
