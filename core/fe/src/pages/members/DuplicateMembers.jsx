import { Alert, Button, Card, Space, Tag } from 'antd';
import { USER_STATUS } from '@/constants';
import { formatDate } from '@/utils/format';
/** Hồ sơ trùng chỉ xuất hiện khi API đã xác nhận quyền member.read. */
export function DuplicateMembers({ members, onOpen }) {
  if (!members?.length) return null;
  return (
    <Space orientation="vertical" className="scms-full-width">
      <Alert
        type="warning"
        showIcon
        title="Hồ sơ đã tồn tại. Mở hồ sơ để tiếp tục xử lý, không tạo thêm."
      />
      {members.map((m) => (
        <Card key={m.id} size="small" title={m.fullName}>
          <p>{m.phone}</p>
          <Tag>{m.status === USER_STATUS.ACTIVE ? 'Hoạt động' : 'Đã khóa'}</Tag>
          <p>
            {m.currentMembership?.plan.name ?? 'Chưa có gói'} ·{' '}
            {formatDate(m.currentMembership?.endDate)}
          </p>
          {m.status !== USER_STATUS.ACTIVE && (
            <Alert type="warning" title="Liên hệ quản lý để xử lý tài khoản bị khóa." />
          )}
          <Button onClick={() => onOpen(m.id)}>Mở hồ sơ này</Button>
        </Card>
      ))}
    </Space>
  );
}
