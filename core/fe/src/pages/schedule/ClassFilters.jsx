import { useLiveScheduleQuery } from '@/hooks/useLiveScheduleQuery';
import { Alert, Button, DatePicker, Select } from 'antd';
import dayjs from 'dayjs';
import { DATE_FORMATS, QUERY_KEYS } from '@/constants';
import { CLASS_STATUS, SCHEDULE_STATUS_LABELS, SCHEDULE_UI } from '@/constants/schedule';
import * as service from '@/services/schedule.service';
const options = (items) =>
  items.map((item) => ({ value: item.id, label: item.name || item.fullName }));
const FILTER_KEYS = ['date', 'status', 'subjectId', 'coachId'];
const selectFilters = (data) => [
  {
    key: 'status',
    label: 'Trạng thái',
    options: Object.values(CLASS_STATUS).map((value) => ({
      value,
      label: SCHEDULE_STATUS_LABELS[value],
    })),
  },
  { key: 'subjectId', label: 'Bộ môn', options: options(data?.subjects || []) },
  { key: 'coachId', label: 'Huấn luyện viên', options: options(data?.coaches || []) },
];
/** Bộ lọc lấy đúng bộ môn/HLV trong phạm vi quyền, không lấy danh mục quản trị. */
export function ClassFilters({ table }) {
  const query = useLiveScheduleQuery({
    queryKey: [...QUERY_KEYS.SCHEDULE, 'filters'],
    queryFn: service.getClassFilters,
  });
  return (
    <>
      {query.isError && <Alert type="error" title={query.error.message} />}
      <div className="scms-class-filters">
        <div className="scms-filter-field">
          <span>Ngày học</span>
          <DatePicker
            aria-label="Lọc theo ngày học"
            format={DATE_FORMATS.DATE}
            placeholder="Ngày học"
            value={table.params.date ? dayjs(table.params.date) : null}
            onChange={(date) =>
              table.setFilters({
                date: date?.format(SCHEDULE_UI.DATE_PATTERN),
              })
            }
          />
        </div>
        {selectFilters(query.data?.data).map((filter) => (
          <div key={filter.key} className="scms-filter-field">
            <span>{filter.label}</span>
            <Select
              aria-label={`Lọc theo ${filter.label.toLowerCase()}`}
              placeholder={filter.label}
              allowClear
              value={table.params[filter.key]}
              options={filter.options}
              loading={query.isPending}
              onChange={(value) => table.setFilters({ [filter.key]: value })}
            />
          </div>
        ))}
        {FILTER_KEYS.some((key) => table.params[key]) && (
          <Button
            type="text"
            onClick={() =>
              table.setFilters(Object.fromEntries(FILTER_KEYS.map((key) => [key, undefined])))
            }
          >
            Xoá bộ lọc
          </Button>
        )}
      </div>
    </>
  );
}
