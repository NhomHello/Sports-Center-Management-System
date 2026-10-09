import { useState } from 'react';
import { PlusOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { Button, Card, Input, Pagination, Popconfirm, Space, Tag } from 'antd';
import { QUERY_KEYS } from '@/constants';
import { usePermission } from '@/hooks/usePermission';
import { useScheduleMutation } from '@/hooks/useScheduleMutation';
import { useTableQuery } from '@/hooks/useTableQuery';
import * as scheduleService from '@/services/schedule.service';
import { QueryState } from './QueryState';
import { ResourceFormModal } from './ResourceFormModal';

/** Danh sách bộ môn/phòng tập có tìm kiếm, phân trang và thao tác theo quyền. */
export function ResourceCatalogPanel({ resource, permissions }) {
  const { can } = usePermission();
  const table = useTableQuery();
  const [editingItem, setEditingItem] = useState(null);
  const listQuery = useQuery({
    queryKey: [...QUERY_KEYS.SCHEDULE, resource, table.params],
    queryFn: () => scheduleService.listResources(resource, table.params),
  });
  const saveMutation = useScheduleMutation(
    (values) =>
      scheduleService.saveResource(resource, {
        ...values,
        ...(editingItem?.id && { id: editingItem.id }),
      }),
    () => setEditingItem(null),
  );
  const stopMutation = useScheduleMutation((id) => scheduleService.stopResource(resource, id));
  const items = listQuery.data?.data || [];

  return (
    <Space vertical className="scms-schedule-stack">
      <Space wrap>
        <Input.Search
          placeholder="Tìm tên danh mục"
          allowClear
          onSearch={(search) => table.setFilters({ search })}
        />
        {can(permissions.create) && (
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setEditingItem({})}>
            Thêm mới
          </Button>
        )}
      </Space>
      <QueryState query={listQuery} isEmpty={!items.length}>
        <div className="scms-class-grid">
          {items.map((item) => (
            <Card key={item.id} title={item.name} className="scms-resource-card">
              <p>{item.description || 'Chưa có mô tả'}</p>
              {item.capacity && <p>Sức chứa: {item.capacity}</p>}
              <Tag color={item.isActive ? 'green' : 'default'}>
                {item.isActive ? 'Hoạt động' : 'Ngừng hoạt động'}
              </Tag>
              <Space wrap>
                {can(permissions.update) && (
                  <Button onClick={() => setEditingItem(item)}>Sửa</Button>
                )}
                {item.isActive && can(permissions.delete) && (
                  <Popconfirm
                    title="Ngừng hoạt động tài nguyên?"
                    okText="Đồng ý"
                    cancelText="Huỷ"
                    onConfirm={() => stopMutation.mutate(item.id)}
                  >
                    <Button danger loading={stopMutation.isPending}>
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
        {...table.paginationProps(listQuery.data?.meta)}
        onChange={(current, pageSize) => table.onTableChange({ current, pageSize })}
      />
      {editingItem && (
        <ResourceFormModal
          item={editingItem.id ? editingItem : null}
          resource={resource}
          loading={saveMutation.isPending}
          onSubmit={saveMutation.mutate}
          onClose={() => setEditingItem(null)}
        />
      )}
    </Space>
  );
}
