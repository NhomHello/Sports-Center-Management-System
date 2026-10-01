import { Button, Input, Select, Space } from 'antd';
import { useState } from 'react';
import { INVOICE_STATUS_META } from '@/constants';

const STATUS_OPTIONS = Object.entries(INVOICE_STATUS_META).map(([value, meta]) => ({
  value,
  label: meta.label,
}));

/** Bộ lọc truyền thẳng đến API phân trang; không lọc riêng một trang dữ liệu. */
export function InvoiceFilters({ filters, onChange, loading }) {
  const [search, setSearch] = useState(filters.search ?? '');
  return (
    <Space wrap className="scms-invoice-filters">
      <Input.Search
        aria-label="Tìm hóa đơn"
        placeholder="Mã hóa đơn hoặc tên hội viên"
        value={search}
        allowClear
        onChange={(event) => setSearch(event.target.value)}
        onSearch={(value) => onChange({ search: value.trim() || undefined })}
        loading={loading}
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
        onClick={() => {
          setSearch('');
          onChange({ search: undefined, status: undefined });
        }}
      >
        Xóa bộ lọc
      </Button>
    </Space>
  );
}
