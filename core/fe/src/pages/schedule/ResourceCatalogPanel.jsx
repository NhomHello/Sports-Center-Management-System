import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button, Card, Pagination, Popconfirm, Space, Tag, Select } from 'antd';
import { SearchInput } from '@/components/common/SearchInput';
import { QUERY_KEYS } from '@/constants';
import { usePermission } from '@/hooks/usePermission';
import { useTableQuery } from '@/hooks/useTableQuery';
import { useScheduleMutation } from '@/hooks/useScheduleMutation';
import * as service from '@/services/schedule.service';
import { QueryState } from './QueryState';
import { RoomMaintenanceModal } from './RoomMaintenanceModal';
import { ResourceCard } from './ResourceCard';
import { ResourceFormModal } from './ResourceFormModal';

/** Container danh mục với tìm kiếm/phân trang, giữ dữ liệu ngừng hoạt động. */
export function ResourceCatalogPanel({ resource, permissions }) {
  const { can } = usePermission();
  const table = useTableQuery();
  const [editing, setEditing] = useState(null);
  const [maintenance, setMaintenance] = useState(null);
  const query = useQuery({
    queryKey: [...QUERY_KEYS.SCHEDULE, resource, table.params],
    queryFn: () => service.listResources(resource, table.params),
  });
  const save = useScheduleMutation(
    (values) =>
      service.saveResource(resource, { ...values, ...(editing?.id && { id: editing.id }) }),
    () => setEditing(null),
  );
  const stop = useScheduleMutation((id) => service.stopResource(resource, id));
  const reactivate = useScheduleMutation((id) =>
    service.saveResource(resource, { id, isActive: true }),
  );
  const items = query.data?.data || [];
  return (
    <Space vertical className="scms-schedule-stack">
      <Space wrap>
        <SearchInput
          placeholder="Tìm tên danh mục"
          allowClear
          onSearch={(search) => table.setFilters({ search })}
        />
        <Select
          aria-label="Trạng thái tài nguyên"
          placeholder="Tất cả trạng thái"
          allowClear
          options={[
            { value: 'true', label: 'Hoạt động' },
            { value: 'false', label: 'Ngừng hoạt động' },
          ]}
          onChange={(isActive) => table.setFilters({ isActive })}
        />
        {can(permissions.create) && (
          <Button type="primary" onClick={() => setEditing({})}>
            Thêm mới
          </Button>
        )}
      </Space>
      <QueryState query={query} isEmpty={!items.length}>
        <div className="scms-class-grid">
          {items.map((item) => (
            <ResourceCard
              key={item.id}
              item={item}
              resource={resource}
              permissions={permissions}
              can={can}
              onEdit={setEditing}
              onMaintenance={setMaintenance}
              stop={stop}
              reactivate={reactivate}
            />
          ))}
        </div>
      </QueryState>
      <Pagination
        align="end"
        {...table.paginationProps(query.data?.meta)}
        onChange={(current, pageSize) => table.onTableChange({ current, pageSize })}
      />
      {maintenance && (
        <RoomMaintenanceModal room={maintenance} onClose={() => setMaintenance(null)} />
      )}
      {editing && (
        <ResourceFormModal
          item={editing.id ? editing : null}
          resource={resource}
          loading={save.isPending}
          onClose={() => setEditing(null)}
          onSubmit={save.mutate}
        />
      )}
    </Space>
  );
}
