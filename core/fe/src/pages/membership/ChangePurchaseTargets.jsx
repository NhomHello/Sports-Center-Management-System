import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Alert, Input, Select, Space, Button, Typography } from 'antd';
import { TABLE } from '@/constants';
import { useAuth } from '@/hooks/useAuth';
import { listMembershipPlans } from '@/services/membershipPlan.service';
import { listClasses } from '@/services/schedule.service';

const buildOptions = (rows, kind, currentId) =>
  rows
    .filter((row) => row.id !== currentId)
    .filter((row) => kind === 'membership' || row.seatsRemaining > 0)
    .map((row) => ({ value: row.id, label: row.name }));
const TARGET_LABELS = Object.freeze({ membership: 'Gói mới', enrollment: 'Lớp mới' });

/** Chỉ nạp danh mục có phân trang; lớp hết chỗ không được chọn để đổi. */
export function ChangePurchaseTargets({ kind, currentId, memberId, value, onChange, disabled }) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(TABLE.DEFAULT_PAGE);
  const { user } = useAuth();
  const params = { page, pageSize: TABLE.DEFAULT_PAGE_SIZE, search };
  const query = useQuery({
    queryKey: ['purchase', 'targets', user?.id, kind, memberId, params],
    queryFn: () =>
      kind === 'membership'
        ? listMembershipPlans({ ...params, isActive: true })
        : listClasses({ ...params, status: 'OPEN', ...(memberId !== user?.id && { memberId }) }),
    retry: false,
  });
  const rows = Array.isArray(query.data?.data) ? query.data.data : [];
  const options = buildOptions(rows, kind, currentId);
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
        disabled={disabled || query.isError || query.isFetching}
        notFoundContent="Không có lựa chọn phù hợp"
      />
      {query.isError && (
        <Alert
          type="error"
          title={query.error.message}
          action={<Button onClick={() => query.refetch()}>Thử lại</Button>}
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
