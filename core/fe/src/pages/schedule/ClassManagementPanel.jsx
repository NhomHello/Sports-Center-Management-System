import { useState } from 'react';
import { PERMISSIONS } from '@scms/shared';
import { useQuery } from '@tanstack/react-query';
import { Button, Card, Input, Pagination, Space, Tag } from 'antd';
import { QUERY_KEYS } from '@/constants';
import { CLASS_STATUS, CLASS_STATUS_LABELS } from '@/constants/schedule';
import { usePermission } from '@/hooks/usePermission';
import { useTableQuery } from '@/hooks/useTableQuery';
import * as scheduleService from '@/services/schedule.service';
import { ClassFormModal } from './ClassFormModal';
import { QueryState } from './QueryState';

/** Danh sách quản lý dùng để tạo lớp mới hoặc chọn lớp cần sửa. */
export function ClassManagementPanel() {
  const { can } = usePermission();
  const table = useTableQuery({ scope: 'management' });
  const [editingItem, setEditingItem] = useState(null);
  const listQuery = useQuery({
    queryKey: [...QUERY_KEYS.SCHEDULE, 'classes', table.params],
    queryFn: () => scheduleService.listClasses(table.params),
  });
  const items = listQuery.data?.data || [];

  return (
    <Space vertical className="scms-schedule-stack">
      <Space wrap>
        <Input.Search
          allowClear
          placeholder="Tìm tên lớp"
          onSearch={(search) => table.setFilters({ search })}
        />
        {can(PERMISSIONS.CLASS_CREATE) && (
          <Button type="primary" onClick={() => setEditingItem({})}>
            Tạo lớp
          </Button>
        )}
      </Space>
      <QueryState query={listQuery} isEmpty={!items.length}>
        <div className="scms-class-grid">
          {items.map((item) => (
            <Card key={item.id} title={item.name}>
              <Space vertical className="scms-schedule-stack">
                <Tag>{CLASS_STATUS_LABELS[item.status]}</Tag>
                <span>
                  {item.subject.name} · {item.room.name}
                </span>
                <span>Huấn luyện viên: {item.coach.fullName}</span>
                <span>Sức chứa: {item.capacity}</span>
                {can(PERMISSIONS.CLASS_UPDATE) && item.status !== CLASS_STATUS.CANCELLED && (
                  <Button onClick={() => setEditingItem(item)}>Sửa lớp / đổi lịch</Button>
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
        <ClassFormModal
          item={editingItem.id ? editingItem : null}
          onClose={() => setEditingItem(null)}
        />
      )}
    </Space>
  );
}
