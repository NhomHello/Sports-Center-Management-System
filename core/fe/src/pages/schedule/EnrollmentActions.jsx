import { useAuth } from '@/hooks/useAuth';
import { ChangePurchaseActions } from '../membership/ChangePurchaseActions';

/** Khe GY-00: item.enrollment là đăng ký của memberId đang chọn. */
export function EnrollmentActions({ item, memberId, onSuccess }) {
  const { user } = useAuth();
  const enrollment = item?.enrollment;
  return (
    <ChangePurchaseActions
      key={enrollment?.id}
      kind="enrollment"
      purchase={enrollment}
      ownerId={memberId ?? enrollment?.memberId ?? user?.id}
      currentId={item?.id}
      onSuccess={onSuccess}
    />
  );
}
