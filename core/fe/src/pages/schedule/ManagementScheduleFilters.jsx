import { useQuery } from '@tanstack/react-query';
import { Select, Space } from 'antd';
import { QUERY_KEYS } from '@/constants';
import { getClassFilters } from '@/services/schedule.service';
import { QueryState } from './QueryState';

/** Danh mục bộ lọc lấy từ API theo phạm vi người dùng. */
export function ManagementScheduleFilters({ calendar }) {
  const query = useQuery({
    queryKey: [...QUERY_KEYS.SCHEDULE, 'filters'],
    queryFn: getClassFilters,
  });
  return (
    <QueryState query={query}>
      <Space wrap>
        {[
          ['roomId', 'rooms', 'Phòng'],
          ['coachId', 'coaches', 'HLV'],
          ['subjectId', 'subjects', 'Bộ môn'],
        ].map(([key, source, label]) => (
          <Select
            key={key}
            aria-label={label}
            placeholder={label}
            allowClear
            style={{ width: 180 }}
            value={calendar.filters[key]}
            options={(query.data?.data[source] || []).map((item) => ({
              value: item.id,
              label: item.name || item.fullName,
            }))}
            onChange={(value) => calendar.setFilters((previous) => ({ ...previous, [key]: value }))}
          />
        ))}
      </Space>
    </QueryState>
  );
}
