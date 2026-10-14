import { useQuery } from '@tanstack/react-query';
import { Alert } from 'antd';
import { getMemberCurrent } from '@/services/membership.service';
import { FreezeControls } from '@/pages/membership/FreezeControls';
/** Nạp bảo lưu mới nhất thay vì dùng bản tóm tắt của bảng hội viên. */
export function MemberFreezePanel({ memberId }) {
  const query = useQuery({
    queryKey: ['freeze-current', memberId],
    queryFn: () => getMemberCurrent(memberId),
  });
  if (query.isError) return <Alert type="error" title={query.error.message} />;
  return <FreezeControls membership={query.data?.data} />;
}
