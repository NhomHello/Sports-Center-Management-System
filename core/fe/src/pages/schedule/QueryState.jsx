import { Alert, Button, Empty, Spin } from 'antd';

/** Hiển thị thống nhất trạng thái tải, lỗi và không có dữ liệu. */
export function QueryState({ query, isEmpty, children }) {
  if (query.isPending) return <Spin aria-label="Đang tải dữ liệu" />;
  if (query.isError) {
    return (
      <Alert
        type="error"
        showIcon
        title={query.error.message}
        action={<Button onClick={() => query.refetch()}>Thử lại</Button>}
      />
    );
  }
  if (isEmpty) return <Empty description="Chưa có dữ liệu phù hợp" />;
  return children;
}
