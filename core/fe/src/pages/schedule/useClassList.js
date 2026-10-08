import { useState } from 'react';
import { useLiveScheduleQuery } from '@/hooks/useLiveScheduleQuery';
import { QUERY_KEYS } from '@/constants';
import { usePermission } from '@/hooks/usePermission';
import { useTableQuery } from '@/hooks/useTableQuery';
import { useScheduleMutation } from '@/hooks/useScheduleMutation';
import * as service from '@/services/schedule.service';

/** Giữ phạm vi API khi xoá điều kiện; từ khóa hiển thị và query được reset cùng nhau. */
export const useClassList = ({ scope, memberId }) => {
  const { can } = usePermission();
  const table = useTableQuery({ scope });
  const params = { ...table.params, memberId };
  const [detailId, setDetailId] = useState(null);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState('');
  const query = useLiveScheduleQuery({
    queryKey: [...QUERY_KEYS.SCHEDULE, 'classes', params],
    queryFn: () => service.listClasses(params),
  });
  const cancel = useScheduleMutation(service.cancelClass);
  const items = query.data?.data || [];
  const filtered = Object.entries(table.filters).some(
    ([key, value]) => key !== 'scope' && Boolean(value),
  );
  const reset = () => {
    setSearch('');
    table.setFilters(
      Object.fromEntries(
        Object.keys(table.filters)
          .filter((key) => key !== 'scope')
          .map((key) => [key, undefined]),
      ),
    );
  };
  return {
    can,
    table,
    query,
    hasPages: Boolean(query.data?.meta?.total),
    cancel,
    items,
    filtered,
    reset,
    detailId,
    setDetailId,
    editing,
    setEditing,
    search,
    setSearch,
  };
};
