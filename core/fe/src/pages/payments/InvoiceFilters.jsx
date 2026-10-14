import dayjs from 'dayjs';
import { CloseCircleOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, Select, DatePicker } from 'antd';
import { useState } from 'react';
import { SearchInput } from '@/components/common/SearchInput';
import { DATE_FORMATS, INVOICE_CHANNEL_LABELS, INVOICE_STATUS_META } from '@/constants';

const STATUS_OPTIONS = Object.entries(INVOICE_STATUS_META).map(([value, meta]) => ({
  value,
  label: meta.label,
}));

const CHANNEL_OPTIONS = Object.entries(INVOICE_CHANNEL_LABELS).map(([value, label]) => ({
  value,
  label,
}));

const rangeValue = ({ from, to }) => from && to ? [dayjs(from), dayjs(to)] : null;

/** Bộ lọc truyền thẳng đến API phân trang; không lọc riêng một trang dữ liệu. */
export function InvoiceFilters({ filters, onChange, loading, staff = false }) {
  const [search, setSearch] = useState(filters.search ?? '');

  const applySearch = () => onChange({ search: search.trim() || undefined });

  return (
    <div className="scms-invoice-filters">
      <SearchInput
        showButton={false}
        aria-label="Tìm hóa đơn"
        placeholder={staff ? 'Mã hóa đơn hoặc tên hội viên' : 'Tìm mã hóa đơn'}
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
      {staff && (
        <Select
          aria-label="Lọc kênh thanh toán"
          placeholder="Tất cả kênh"
          allowClear
          options={CHANNEL_OPTIONS}
          value={filters.channel}
          onChange={(channel) => onChange({ channel })}
        />
      )}
      {staff && (
        <DatePicker.RangePicker
          aria-label="Khoảng ngày hóa đơn"
          value={rangeValue(filters)}
          format={DATE_FORMATS.DATE}
          onChange={(dates) =>
            onChange({
              from: dates?.[0].startOf('day').toISOString(),
              to: dates?.[1].endOf('day').toISOString(),
            })
          }
        />
      )}
      <Button
        type="text"
        icon={<CloseCircleOutlined />}
        disabled={!search && !filters.status && !filters.channel && !filters.from && !filters.to}
        onClick={() => {
          setSearch('');
          onChange({
            search: undefined,
            status: undefined,
            channel: undefined,
            from: undefined,
            to: undefined,
          });
        }}
      >
        Xóa lọc
      </Button>
    </div>
  );
}
