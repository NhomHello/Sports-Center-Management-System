import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button, Card, Pagination, Popconfirm, Space, Tag } from 'antd';
import { SearchInput } from '@/components/common/SearchInput';
import { QUERY_KEYS } from '@/constants';
import { usePermission } from '@/hooks/usePermission';
import { useTableQuery } from '@/hooks/useTableQuery';
import { useScheduleMutation } from '@/hooks/useScheduleMutation';
import * as service from '@/services/schedule.service';
import { QueryState } from './QueryState';
import { ResourceFormModal } from './ResourceFormModal';

/** Container danh mục với tìm kiếm/phân trang, giữ dữ liệu ngừng hoạt động. */
export function ResourceCatalogPanel({ resource, permissions }) {
  const { can } = usePermission();
  const table = useTableQuery();
  const [editing, setEditing] = useState(null);
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
  const items = query.data?.data || [];
  return (
    <Space vertical className="scms-schedule-stack">
      <Space wrap>
        <SearchInput
          placeholder="Tìm tên danh mục"
          allowClear
          onSearch={(search) => table.setFilters({ search })}
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
            <Card key={item.id} title={item.name}>
              <p>{item.description || 'Chưa có mô tả'}</p>
              {item.capacity && <p>Sức chứa: {item.capacity}</p>}
              <Tag color={item.isActive ? 'green' : 'default'}>
                {item.isActive ? 'Hoạt động' : 'Ngừng hoạt động'}
              </Tag>
              <Space wrap>
                {can(permissions.update) && <Button onClick={() => setEditing(item)}>Sửa</Button>}
                {item.isActive && can(permissions.delete) && (
                  <Popconfirm
                    title="Ngừng hoạt động tài nguyên?"
                    onConfirm={() => stop.mutate(item.id)}
                    okText="Đồng ý"
                    cancelText="Huỷ"
                  >
                    <Button danger loading={stop.isPending}>
                      Ngừng hoạt động
                    </Button>
                  </Popconfirm>
                )}
              </Space>
            </Card>
          ))}
        </div>
      </QueryState>
      <Pagination
        {...table.paginationProps(query.data?.meta)}
        onChange={(current, pageSize) => table.onTableChange({ current, pageSize })}
      />
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
