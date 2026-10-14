import { Button, Card, Popconfirm, Space, Tag, Tooltip, Typography } from 'antd';
/** Thẻ tài nguyên ổn định khi tên dài và trạng thái thay đổi. */
export function ResourceCard({
  item,
  resource,
  permissions,
  can,
  onEdit,
  onMaintenance,
  stop,
  reactivate,
}) {
  return (
    <Card
      title={
        <Tooltip title={item.name}>
          <Typography.Text ellipsis>{item.name}</Typography.Text>
        </Tooltip>
      }
      extra={
        <Space>
          <Tag color={item.isActive ? 'green' : 'default'}>
            {item.isActive ? 'Hoạt động' : 'Ngừng hoạt động'}
          </Tag>
          {item.isUnderMaintenance && <Tag color="orange">Bảo trì</Tag>}
        </Space>
      }
    >
      <p>{item.description || 'Chưa có mô tả'}</p>
      {item.capacity && <p>Sức chứa: {item.capacity}</p>}
      <ResourceActions
        {...{ item, resource, permissions, can, onEdit, onMaintenance, stop, reactivate }}
      />
    </Card>
  );
}

function ResourceActions({
  item,
  resource,
  permissions,
  can,
  onEdit,
  onMaintenance,
  stop,
  reactivate,
}) {
  return (
    <Space wrap>
      {resource === 'rooms' && can(permissions.update) && (
        <Button onClick={() => onMaintenance(item)}>Bảo trì</Button>
      )}
      {can(permissions.update) && <Button onClick={() => onEdit(item)}>Sửa</Button>}
      {!item.isActive && can(permissions.update) && (
        <Button loading={reactivate.isPending} onClick={() => reactivate.mutate(item.id)}>
          Kích hoạt lại
        </Button>
      )}
      {item.isActive && can(permissions.delete) && (
        <Popconfirm
          title="Ngừng hoạt động tài nguyên?"
          onConfirm={() => stop.mutateAsync(item.id)}
          okText="Đồng ý"
          cancelText="Hủy"
        >
          <Button danger loading={stop.isPending}>
            Ngừng hoạt động
          </Button>
        </Popconfirm>
      )}
    </Space>
  );
}
