import { useQuery } from '@tanstack/react-query';
import { Alert, Space } from 'antd';
import { getMemberCurrent } from '@/services/membership.service';
import { FreezeControls } from '@/pages/membership/FreezeControls';
import { MembershipActions } from '@/pages/membership/MembershipActions';
/** Nạp kỳ gói mới nhất: nhân viên bảo lưu, hủy hoặc đổi gói hộ hội viên. */
export function MemberFreezePanel({ memberId }) {
  const query = useQuery({
    queryKey: ['freeze-current', memberId],
    queryFn: () => getMemberCurrent(memberId),
  });
  if (query.isError) return <Alert type="error" title={query.error.message} />;
  const membership = query.data?.data;
  return (
    <Space orientation="vertical" className="scms-full-width">
      {membership && (
        <MembershipActions membership={membership} onSuccess={() => query.refetch()} />
      )}
      <FreezeControls membership={membership} />
    </Space>
  );
}
