import { CloseCircleOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, Select } from 'antd';
import { useState } from 'react';
import { SearchInput } from '@/components/common/SearchInput';
import { INVOICE_STATUS_META } from '@/constants';

const STATUS_OPTIONS = Object.entries(INVOICE_STATUS_META).map(([value, meta]) => ({
  value,
  label: meta.label,
}));

/** Bộ lọc truyền thẳng đến API phân trang; không lọc riêng một trang dữ liệu. */
export function InvoiceFilters({ filters, onChange, loading }) {
  const [search, setSearch] = useState(filters.search ?? '');

  const applySearch = () => onChange({ search: search.trim() || undefined });

  return (
    <div className="scms-invoice-filters">
      <SearchInput
        showButton={false}
        aria-label="Tìm hóa đơn"
        placeholder="Mã hóa đơn hoặc tên hội viên"
        prefix={<SearchOutlined />}
        value={search}
        allowClear
        disabled={loading}
        onChange={(event) => {
          const value = event.target.value;
          setSearch(value);
          if (!value) onChange({ search: undefined });
        }}
        onPressEnter={applySearch}
        onBlur={applySearch}
      />
      <Select
        aria-label="Lọc trạng thái hóa đơn"
        placeholder="Tất cả trạng thái"
        allowClear
        options={STATUS_OPTIONS}
        value={filters.status}
        onChange={(status) => onChange({ status })}
      />
      <Button
        type="text"
        icon={<CloseCircleOutlined />}
        disabled={!search && !filters.status}
        onClick={() => {
          setSearch('');
          onChange({ search: undefined, status: undefined });
        }}
      >
        Xóa lọc
      </Button>
    </div>
  );
}
