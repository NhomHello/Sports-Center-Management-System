import { Descriptions, Space, Tag, Typography } from 'antd';
import { formatDate } from '@/utils/format';
import { MemberFreezePanel } from './MemberFreezePanel';

const isFrozenNow = (membership, now = Date.now()) =>
  membership.isFrozen ??
  (membership.freezes ?? []).some(
    (f) => !f.endedAt && new Date(f.startAt) <= now && now < new Date(f.endAt),
  );

/** Nhãn tiếng Việt cho trạng thái gói (không hiện mã ACTIVE/EXPIRED). */
const membershipStatusMeta = (membership) => {
  if (isFrozenNow(membership)) return { color: 'blue', label: 'Đang bảo lưu' };
  if (membership.status === 'ACTIVE') return { color: 'green', label: 'Đang hoạt động' };
  return { color: 'orange', label: 'Đã hết hạn' };
};

const MemberMembershipView = ({ member }) => {
  if (!member.currentMembership) {
    return <Typography.Text type="secondary">Chưa có gói tập nào đang hoạt động.</Typography.Text>;
  }
  const { currentMembership } = member;
  const { color: statusColor, label: statusText } = membershipStatusMeta(currentMembership);

  return (
    <Descriptions column={1} bordered>
      <Descriptions.Item label="Gói hiện tại">
        <Typography.Text strong>{currentMembership.plan?.name}</Typography.Text>
      </Descriptions.Item>
      <Descriptions.Item label="Mã gói">{currentMembership.plan?.code}</Descriptions.Item>
      <Descriptions.Item label="Trạng thái">
        <Tag color={statusColor}>{statusText}</Tag>
      </Descriptions.Item>
      <Descriptions.Item label="Hiệu lực">
        {formatDate(currentMembership.startDate)} - {formatDate(currentMembership.endDate)}
      </Descriptions.Item>
    </Descriptions>
  );
};

/** Tab gói của hội viên: kỳ hiện tại, bảo lưu / hủy / đổi hộ (theo quyền). */
export function MembershipTab({ member, canFreeze }) {
  return (
    <>
      <MemberMembershipView member={member} />
      {canFreeze && <MemberFreezePanel memberId={member.id} />}
    </>
  );
}
