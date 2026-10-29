import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PERMISSIONS as P } from '@scms/shared';
import { Alert, Button, Card, Empty, Space, Table, Tag, Typography } from 'antd';
import { QUERY_KEYS } from '@/constants';
import { usePermission } from '@/hooks/usePermission';
import * as service from '@/services/schedule.service';
import { OperatingFrameForm } from './OperatingFrameForm';

function frameColumns(canEdit, onEdit) {
  return [
    {
      title: 'Tên khung giờ',
      dataIndex: 'name',
      render: (name) => <Typography.Text strong>{name}</Typography.Text>,
    },
    {
      title: 'Thời gian',
      key: 'time',
      render: (_, item) => (
        <Tag color="blue" style={{ padding: '4px 12px', borderRadius: 6, fontSize: 14 }}>
          {item.startTime} – {item.endTime}
        </Tag>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'isActive',
      render: (active) => (
        <Tag color={active ? 'success' : 'default'}>
          {active ? 'Đang hoạt động' : 'Ngừng hoạt động'}
        </Tag>
      ),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      align: 'right',
      render: (_, item) =>
        canEdit ? (
          <Button htmlType="button" onClick={() => onEdit(item)}>
            Chỉnh sửa
          </Button>
        ) : (
          <Typography.Text type="secondary">Chỉ xem</Typography.Text>
        ),
    },
  ];
}

/** Danh sách khung giờ hoạt động và thao tác cấu hình theo quyền. */
export function OperatingFramePanel() {
  const { can } = usePermission();
  const [editing, setEditing] = useState(null);
  const query = useQuery({
    queryKey: [...QUERY_KEYS.SCHEDULE, 'frames'],
    queryFn: service.listFrames,
  });
  const frames = query.data?.data ?? [];
  const activeCount = frames.filter((frame) => frame.isActive).length;
  const canEdit = can(P.SETTING_UPDATE);

  return (
    <div className="scms-schedule-stack">
      <Card styles={{ body: { padding: 24 } }}>
        <Space
          wrap
          align="center"
          style={{ width: '100%', justifyContent: 'space-between', marginBottom: 20 }}
        >
          <div>
            <Typography.Title level={4} style={{ margin: '0 0 6px' }}>
              Khung giờ hoạt động
            </Typography.Title>
            <Typography.Text type="secondary">
              Thiết lập thời gian để xếp lịch học · Giờ Việt Nam
            </Typography.Text>
          </div>
          {canEdit && (
            <Button type="primary" size="large" htmlType="button" onClick={() => setEditing({})}>
              + Thêm khung giờ
            </Button>
          )}
        </Space>
        <Space wrap style={{ marginBottom: 20 }}>
          <Tag>{frames.length} khung giờ</Tag>
          <Tag color="success">{activeCount} đang hoạt động</Tag>
          <Tag>{frames.length - activeCount} ngừng hoạt động</Tag>
        </Space>
        <Alert
          showIcon
          type="info"
          title="Mỗi buổi học phải nằm trọn trong một khung giờ hoạt động."
          description="Các khung được phép tiếp giáp, nhưng không được chồng lấn."
          style={{ marginBottom: 20 }}
        />
        {query.isError && (
          <Alert
            showIcon
            type="error"
            title="Không tải được khung giờ"
            description={query.error.message}
            action={<Button onClick={() => query.refetch()}>Thử lại</Button>}
            style={{ marginBottom: 16 }}
          />
        )}
        <Table
          rowKey="id"
          columns={frameColumns(canEdit, setEditing)}
          dataSource={frames}
          loading={query.isPending}
          pagination={false}
          scroll={{ x: 560 }}
          locale={{ emptyText: <Empty description="Chưa có khung giờ hoạt động" /> }}
        />
      </Card>
      {editing && <OperatingFrameForm item={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}
