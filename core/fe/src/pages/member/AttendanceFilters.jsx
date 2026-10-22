import dayjs from 'dayjs';
import { ClearOutlined } from '@ant-design/icons';
import { Button, InputNumber, Select } from 'antd';
import { ResponsiveRangePicker } from '@/components/common/ResponsiveRangePicker';
import { DATE_FORMATS } from '@/constants';

const STATUS_OPTIONS = [
  { value: 'PRESENT', label: 'Có mặt' },
  { value: 'ABSENT', label: 'Vắng mặt' },
];

/** Xóa bộ lọc đồng thời trên màn hình và request. */
export function AttendanceFilters({ filters, onChange, onReset, hasFilters }) {
  const range = filters.from && filters.to ? [dayjs(filters.from), dayjs(filters.to)] : null;
  return (
    <div className="scms-attendance-history__filters" role="search" aria-label="Bộ lọc điểm danh">
      <label className="scms-attendance-history__field scms-attendance-history__field--date">
        <span>Khoảng thời gian</span>
        <ResponsiveRangePicker
          value={range}
          format={DATE_FORMATS.DATE}
          placeholder={['Từ ngày', 'Đến ngày']}
          onChange={(dates) =>
            onChange({
              from: dates?.[0]?.format('YYYY-MM-DD'),
              to: dates?.[1]?.format('YYYY-MM-DD'),
            })
          }
        />
      </label>
      <label className="scms-attendance-history__field">
        <span>Mã lớp</span>
        <InputNumber
          aria-label="Mã lớp"
          placeholder="Nhập mã lớp"
          min={1}
          precision={0}
          value={filters.classId ?? null}
          onChange={(classId) => onChange({ classId: classId || undefined })}
        />
      </label>
      <label className="scms-attendance-history__field scms-attendance-history__field--status">
        <span>Trạng thái</span>
        <Select
          allowClear
          aria-label="Trạng thái điểm danh"
          placeholder="Tất cả trạng thái"
          options={STATUS_OPTIONS}
          value={filters.status}
          onChange={(status) => onChange({ status })}
        />
      </label>
      <Button icon={<ClearOutlined aria-hidden />} disabled={!hasFilters} onClick={onReset}>
        Xóa bộ lọc
      </Button>
    </div>
  );
}
