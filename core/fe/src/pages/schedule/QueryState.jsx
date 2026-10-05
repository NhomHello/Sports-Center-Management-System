import { Alert, Button, Empty, Spin } from 'antd';
/** Tải/lỗi/rỗng thống nhất; mỗi lỗi có nút thử lại. */
export function QueryState({ query, isEmpty, children }) {
  if (query.isPending) return <Spin aria-label="Đang tải lịch" />;
  if (query.isError)
    return (
      <Alert
        type="error"
        showIcon
        title={query.error.message}
        action={<Button onClick={() => query.refetch()}>Thử lại</Button>}
      />
    );
  if (isEmpty) return <Empty description="Chưa có dữ liệu phù hợp" />;
  return children;
}
