import { useQuery } from '@tanstack/react-query';
import { Input, Pagination, Space } from 'antd';
import { QUERY_KEYS } from '@/constants';
import { useTableQuery } from '@/hooks/useTableQuery';
import * as scheduleService from '@/services/schedule.service';
import { ClassCard } from './ClassCard';
import { QueryState } from './QueryState';

/** Danh sách lớp đang nhận đăng ký trong thời gian hiện tại. */
export function OpenClassListPanel() {
  const table = useTableQuery({ scope: 'open' });
  const listQuery = useQuery({
    queryKey: [...QUERY_KEYS.SCHEDULE, 'open-classes', table.params],
    queryFn: () => scheduleService.listClasses(table.params),
  });
  const items = listQuery.data?.data || [];

  return (
    <Space vertical className="scms-schedule-stack">
      <Input.Search
        allowClear
        placeholder="Tìm tên lớp"
        onSearch={(search) => table.setFilters({ search })}
      />
      <QueryState query={listQuery} isEmpty={!items.length}>
        <div className="scms-class-grid">
          {items.map((item) => (
            <ClassCard key={item.id} item={item} />
          ))}
        </div>
      </QueryState>
      <Pagination
        {...table.paginationProps(listQuery.data?.meta)}
        onChange={(current, pageSize) => table.onTableChange({ current, pageSize })}
      />
    </Space>
  );
}
