import { Alert, Button, Empty, Spin } from 'antd';
/** Tải/lỗi/rỗng thống nhất; mỗi lỗi có nút thử lại. */
export function QueryState({ query, isEmpty, children }) {
  if (query.isPending)
    return (
      <div className="scms-query-state" role="status">
        <Spin aria-label="Đang tải lịch" />
        <span>Đang tải dữ liệu…</span>
      </div>
    );
  if (query.isError)
    return (
      <Alert
        type="error"
        showIcon
        title={query.error.message}
        action={<Button onClick={() => query.refetch()}>Thử lại</Button>}
      />
    );
  if (isEmpty)
    return (
      <div className="scms-query-state">
        <Empty description="Chưa có dữ liệu phù hợp" />
        <p>Thử thay đổi từ khóa hoặc bộ lọc để tìm kết quả phù hợp.</p>
      </div>
    );
  return children;
}
