import { useState } from 'react';
import { Alert, Input, Select, Space, Button, Typography } from 'antd';
import { TABLE } from '@/constants';
import { useChangePurchaseTargets } from './useChangePurchaseTargets';

const buildOptions = (rows, currentId) =>
  rows
    .filter((row) => row.id !== currentId)
    .filter((row) => row.seatsRemaining > 0)
    .map((row) => ({ value: row.id, label: row.name }));
const TARGET_LABELS = Object.freeze({ enrollment: 'Khóa học mới' });

/** Chỉ nạp danh mục có phân trang; lớp hết chỗ không được chọn để đổi. */
export function ChangePurchaseTargets({ kind, currentId, memberId, value, onChange, disabled }) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(TABLE.DEFAULT_PAGE);
  const query = useChangePurchaseTargets({ kind, currentId, memberId, search, page });
  const rows = query.rows;
  const options = buildOptions(rows, currentId);
  return (
    <Space orientation="vertical" className="scms-full-width">
      <Input.Search
        disabled={disabled}
        aria-label="Tìm sản phẩm đích"
        placeholder="Tìm tên"
        allowClear
        onSearch={(text) => {
          setSearch(text);
          setPage(TABLE.DEFAULT_PAGE);
        }}
      />
      <Select
        aria-label={TARGET_LABELS[kind]}
        className="scms-full-width"
        placeholder={`Chọn ${TARGET_LABELS[kind].toLowerCase()} còn khả dụng`}
        value={value}
        onChange={onChange}
        options={options}
        loading={query.isFetching}
        disabled={disabled || query.unavailable}
        notFoundContent="Không có lựa chọn phù hợp"
      />
      <Typography.Text type="secondary">
        Chuyển đăng ký cả khóa sang khóa cùng bộ môn còn chỗ.
      </Typography.Text>
      {query.error && (
        <Alert
          type="error"
          title={query.error.message}
          action={<Button onClick={query.refetch}>Thử lại</Button>}
        />
      )}
      <Space>
        <Button
          disabled={page === TABLE.DEFAULT_PAGE || query.isFetching}
          onClick={() => setPage(page - 1)}
        >
          Trang trước
        </Button>
        <Typography.Text>Trang {page}</Typography.Text>
        <Button
          disabled={rows.length < TABLE.DEFAULT_PAGE_SIZE || query.isFetching}
          onClick={() => setPage(page + 1)}
        >
          Trang sau
        </Button>
      </Space>
    </Space>
  );
}
