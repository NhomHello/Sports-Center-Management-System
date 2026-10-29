import { useAuth } from '@/hooks/useAuth';
import { ChangePurchaseActions } from './ChangePurchaseActions';

/** Khe GY-00 cho kỳ gói đang hiển thị, không gắn thao tác vào mọi gói danh mục. */
export function MembershipActions({ membership, onSuccess }) {
  const { user } = useAuth();
  return (
    <ChangePurchaseActions
      key={membership?.id}
      kind="membership"
      purchase={membership}
      ownerId={membership?.userId ?? user?.id}
      currentId={membership?.planId ?? membership?.plan?.id}
      onSuccess={onSuccess}
    />
  );
}
