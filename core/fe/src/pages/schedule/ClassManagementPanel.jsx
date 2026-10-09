import { useState } from 'react';
import { PERMISSIONS } from '@scms/shared';
import { useQuery } from '@tanstack/react-query';
import { Button, Input, Pagination, Popconfirm, Space } from 'antd';
import { QUERY_KEYS } from '@/constants';
import { CLASS_STATUS } from '@/constants/schedule';
import { usePermission } from '@/hooks/usePermission';
import { useScheduleMutation } from '@/hooks/useScheduleMutation';
import { useTableQuery } from '@/hooks/useTableQuery';
import * as scheduleService from '@/services/schedule.service';
import { ClassCard } from './ClassCard';
import { ClassDetailDrawer } from './ClassDetailDrawer';
import { ClassFormModal } from './ClassFormModal';
import { QueryState } from './QueryState';

/** Danh sách quản lý dùng để tạo lớp mới hoặc chọn lớp cần sửa. */
export function ClassManagementPanel() {
  const { can } = usePermission();
  const table = useTableQuery({ scope: 'management' });
  const [editingItem, setEditingItem] = useState(null);
  const [detailId, setDetailId] = useState(null);
  const listQuery = useQuery({
    queryKey: [...QUERY_KEYS.SCHEDULE, 'classes', table.params],
    queryFn: () => scheduleService.listClasses(table.params),
  });
  const cancelMutation = useScheduleMutation(scheduleService.cancelClass);
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
            <ClassCard key={item.id} item={item} onDetail={() => setDetailId(item.id)}>
              {can(PERMISSIONS.CLASS_UPDATE) && item.status !== CLASS_STATUS.CANCELLED && (
                <Button onClick={() => setEditingItem(item)}>Sửa lớp / đổi lịch</Button>
              )}
              {can(PERMISSIONS.CLASS_DELETE) && item.status !== CLASS_STATUS.CANCELLED && (
                <Popconfirm
                  title="Huỷ toàn bộ lớp và thông báo hội viên?"
                  okText="Huỷ lớp"
                  cancelText="Giữ lớp"
                  onConfirm={() => cancelMutation.mutate(item.id)}
                >
                  <Button danger loading={cancelMutation.isPending}>
                    Huỷ lớp
                  </Button>
                </Popconfirm>
              )}
            </ClassCard>
          ))}
        </div>
      </QueryState>
      <Pagination
        {...table.paginationProps(listQuery.data?.meta)}
        onChange={(current, pageSize) => table.onTableChange({ current, pageSize })}
      />
      {detailId && <ClassDetailDrawer id={detailId} onClose={() => setDetailId(null)} />}
      {editingItem && (
        <ClassFormModal
          item={editingItem.id ? editingItem : null}
          onClose={() => setEditingItem(null)}
        />
      )}
    </Space>
  );
}
