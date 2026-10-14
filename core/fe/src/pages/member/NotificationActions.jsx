import { Alert, Button, Checkbox, Segmented, Typography } from 'antd';
import { NOTIFICATION_READ_STATUS } from '@/constants';
import { getApiOperationErrorMessage, shouldRetryApiQuery } from '@/utils/apiAvailability';

const READ_FILTERS = [
  { label: 'Tất cả', value: '' },
  { label: 'Chưa đọc', value: NOTIFICATION_READ_STATUS.UNREAD },
  { label: 'Đã đọc', value: NOTIFICATION_READ_STATUS.READ },
];

/** Bộ lọc server và bộ đếm tổng từ API, không đếm riêng trang đang mở. */
export function NotificationFilters({ table, query, onFilter }) {
  return (
    <div className="scms-notification-page__summary">
      <Segmented
        options={READ_FILTERS}
        value={table.filters.readStatus ?? ''}
        onChange={onFilter}
      />
      {query.isSuccess && (
        <Typography.Text>Chưa đọc: {query.data?.meta?.unreadCount ?? 0}</Typography.Text>
      )}
    </div>
  );
}

/** Lỗi thao tác giữ trên màn hình và cho thử lại đúng các mục chưa thành công. */
export function NotificationFeedback({ actions, isBusy }) {
  const { mutation, bulkMutation, failedResults } = actions;
  const retryIds = failedResults
    .filter((item) => shouldRetryApiQuery(0, item.error))
    .map((item) => item.id);
  return (
    <>
      {mutation.isError && (
        <Alert
          showIcon
          type="error"
          message={getApiOperationErrorMessage(mutation.error, 'đánh dấu đã đọc')}
          action={
            shouldRetryApiQuery(0, mutation.error) && (
              <Button loading={isBusy} onClick={() => mutation.mutate(mutation.variables)}>
                Thử lại
              </Button>
            )
          }
        />
      )}
      {failedResults.length > 0 && (
        <Alert
          showIcon
          type="warning"
          message={`${failedResults.length} thông báo chưa cập nhật được`}
          description={getApiOperationErrorMessage(failedResults[0].error, 'đánh dấu đã đọc')}
          action={
            retryIds.length > 0 && (
              <Button loading={isBusy} onClick={() => bulkMutation.mutate(retryIds)}>
                Thử lại các mục lỗi
              </Button>
            )
          }
        />
      )}
      {bulkMutation.isSuccess && failedResults.length === 0 && (
        <Alert type="success" showIcon message="Đã đánh dấu các thông báo được chọn." />
      )}
    </>
  );
}

/** Chỉ chọn thông báo chưa đọc trên trang hiện tại. */
export function NotificationSelection({
  unreadIds,
  selectedIds,
  isBusy,
  bulkMutation,
  onSelection,
}) {
  if (!unreadIds.length) return null;
  return (
    <div className="scms-notification-page__actions">
      <Checkbox
        disabled={isBusy}
        checked={selectedIds.length === unreadIds.length}
        indeterminate={selectedIds.length > 0 && selectedIds.length < unreadIds.length}
        onChange={(event) => onSelection(event.target.checked ? unreadIds : [])}
      >
        Chọn mục chưa đọc trên trang
      </Checkbox>
      <Button
        type="primary"
        disabled={selectedIds.length === 0 || isBusy}
        loading={bulkMutation.isPending}
        onClick={() => bulkMutation.mutate(selectedIds)}
      >
        Đánh dấu đã đọc ({selectedIds.length})
      </Button>
    </div>
  );
}
