import { useQuery } from '@tanstack/react-query';
import { PERMISSIONS } from '@scms/shared';
import { Alert } from 'antd';
import { QUERY_KEYS } from '@/constants';
import { usePermission } from '@/hooks/usePermission';
import * as membershipService from '@/services/membership.service';
import { formatDate } from '@/utils/format';
import { computeMembershipEffect, MEMBERSHIP_EFFECT } from '@/utils/membershipEffect';

const describeEffect = (effect) => {
  const end = formatDate(effect.nextEnd);
  if (effect.kind === MEMBERSHIP_EFFECT.EXTEND) {
    return `Đang có gói ${effect.planName ?? ''} còn hạn đến ${formatDate(effect.currentEnd)}. Thu tiền sẽ gia hạn cộng dồn, hiệu lực đến ${end}.`;
  }
  if (effect.kind === MEMBERSHIP_EFFECT.RENEW_AFTER_EXPIRED) {
    return `Gói ${effect.planName ?? ''} đã hết hạn ngày ${formatDate(effect.currentEnd)} (giữ trong lịch sử). Thu tiền sẽ bắt đầu gói mới từ ${formatDate(effect.nextStart)} đến ${end}.`;
  }
  return `Hội viên chưa có gói tập. Thu tiền sẽ kích hoạt gói mới từ ${formatDate(effect.nextStart)} đến ${end}.`;
};

/** Cho lễ tân biết thu tiền sẽ gia hạn hay tạo gói mới trước khi xác nhận. */
export function MembershipEffectPreview({ memberId, durationDays }) {
  const { can } = usePermission();
  const query = useQuery({
    queryKey: [...QUERY_KEYS.MEMBERS, 'membership-current', memberId],
    queryFn: () => membershipService.getMemberCurrent(memberId),
    enabled: Boolean(memberId && durationDays) && can(PERMISSIONS.MEMBERSHIP_READ_ALL),
    staleTime: 0,
  });
  if (!memberId || !durationDays || !query.isSuccess) return null;
  return <MembershipEffectSummary current={query.data.data} durationDays={durationDays} />;
}

/** Bản xem trước dùng chung cho mua online và thu tiền tại quầy. */
export function MembershipEffectSummary({ current, durationDays }) {
  const effect = computeMembershipEffect(current, durationDays);
  return (
    <Alert
      showIcon
      type={effect.kind === MEMBERSHIP_EFFECT.EXTEND ? 'success' : 'info'}
      className="scms-membership-effect"
      style={{ margin: '16px 0' }}
      title="Tác động lên gói tập"
      description={describeEffect(effect)}
    />
  );
}
