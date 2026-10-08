import { useLiveScheduleQuery } from '@/hooks/useLiveScheduleQuery';
import { Alert, DatePicker, Select, Space } from 'antd';
import { QUERY_KEYS } from '@/constants';
import { CLASS_STATUS, SCHEDULE_STATUS_LABELS, SCHEDULE_UI } from '@/constants/schedule';
import * as service from '@/services/schedule.service';
const options = (items) =>
  items.map((item) => ({ value: item.id, label: item.name || item.fullName }));
/** Bộ lọc lấy đúng bộ môn/HLV trong phạm vi quyền, không lấy danh mục quản trị. */
export function ClassFilters({ table }) {
  const query = useLiveScheduleQuery({
    queryKey: [...QUERY_KEYS.SCHEDULE, 'filters'],
    queryFn: service.getClassFilters,
  });
  return (
    <>
      {query.isError && <Alert type="error" title={query.error.message} />}
      <Space wrap className="scms-class-filters">
        <DatePicker
          placeholder="Ngày học"
          onChange={(date) =>
            table.setFilters({
              date: date?.format(SCHEDULE_UI.DATE_PATTERN),
            })
          }
        />
        <Select
          placeholder="Trạng thái"
          allowClear
          options={Object.values(CLASS_STATUS).map((value) => ({
            value,
            label: SCHEDULE_STATUS_LABELS[value],
          }))}
          onChange={(status) => table.setFilters({ status })}
        />
        <Select
          placeholder="Bộ môn"
          allowClear
          loading={query.isPending}
          options={options(query.data?.data.subjects || [])}
          onChange={(subjectId) => table.setFilters({ subjectId })}
        />
        <Select
          placeholder="Huấn luyện viên"
          allowClear
          loading={query.isPending}
          options={options(query.data?.data.coaches || [])}
          onChange={(coachId) => table.setFilters({ coachId })}
        />
      </Space>
    </>
  );
}
