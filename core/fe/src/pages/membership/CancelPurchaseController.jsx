import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { cancelPurchase, previewCancellation } from '@/services/purchase.service';
import { ChangePurchaseExecutor } from './ChangePurchaseExecutor';
import { CancelPurchaseModal } from './CancelPurchaseModal';

/** Preview mới theo tài khoản và đối tượng; không dùng dữ liệu lần hủy trước. */
export function CancelPurchaseController({ kind, purchaseId, onClose, onSuccess }) {
  const { user } = useAuth();
  const query = useQuery({
    queryKey: ['purchase', user?.id, kind, purchaseId, 'cancel-preview'],
    queryFn: () => previewCancellation(kind, purchaseId),
    retry: false,
    staleTime: 0,
  });
  return (
    <ChangePurchaseExecutor
      execute={(values) => cancelPurchase(kind, purchaseId, values)}
      view={CancelPurchaseModal}
      viewProps={{ kind, query, onClose }}
      onClose={onClose}
      onSuccess={onSuccess}
    />
  );
}
