import { useState } from 'react';
import { PERMISSIONS as P } from '@scms/shared';
import { useLiveScheduleQuery } from '@/hooks/useLiveScheduleQuery';
import { Button, Input, Pagination, Space } from 'antd';
import { QUERY_KEYS } from '@/constants';
import { usePermission } from '@/hooks/usePermission';
import { useTableQuery } from '@/hooks/useTableQuery';
import { useScheduleMutation } from '@/hooks/useScheduleMutation';
import * as service from '@/services/schedule.service';
import { ClassCard } from './ClassCard';
import { ClassDetailDrawer } from './ClassDetailDrawer';
import { ClassFormModal } from './ClassFormModal';
import { QueryState } from './QueryState';

/** Container danh sách lớp mở; scope management và action dùng chung với FE Khôi. */
export function ClassListPanel({ scope = 'open', memberId, renderActions, renderFilters }) {
  const { can } = usePermission();
  const table = useTableQuery({ scope });
  const params = { ...table.params, memberId };
  const [detailId, setDetailId] = useState(null);
  const [editing, setEditing] = useState(null);
  const query = useLiveScheduleQuery({
    queryKey: [...QUERY_KEYS.SCHEDULE, 'classes', params],
    queryFn: () => service.listClasses(params),
  });
  const cancel = useScheduleMutation(service.cancelClass);
  const items = query.data?.data || [];
  return (
    <Space vertical className="scms-schedule-stack">
      <Space wrap>
        <Input.Search
          allowClear
          placeholder="Tìm tên lớp"
          onSearch={(search) => table.setFilters({ search })}
        />
        {can(P.CLASS_CREATE) && (
          <Button type="primary" onClick={() => setEditing({})}>
            Tạo lớp
          </Button>
        )}
      </Space>
      {renderFilters?.(table)}
      <QueryState query={query} isEmpty={!items.length}>
        <div className="scms-class-grid">
          {items.map((item) => (
            <ClassCard
              key={item.id}
              item={item}
              can={can}
              onDetail={() => setDetailId(item.id)}
              onEdit={() => setEditing(item)}
              onCancel={() => cancel.mutate(item.id)}
              loading={cancel.isPending}
            >
              {renderActions?.(item)}
            </ClassCard>
          ))}
        </div>
      </QueryState>
      <Pagination
        {...table.paginationProps(query.data?.meta)}
        onChange={(current, pageSize) => table.onTableChange({ current, pageSize })}
      />
      {detailId && (
        <ClassDetailDrawer
          id={detailId}
          memberId={memberId}
          onClose={() => setDetailId(null)}
          renderActions={renderActions}
        />
      )}
      {editing && (
        <ClassFormModal item={editing.id ? editing : null} onClose={() => setEditing(null)} />
      )}
    </Space>
  );
}
