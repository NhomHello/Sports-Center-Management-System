import { useState } from 'react';
import { Button, Space, Tooltip } from 'antd';
import { useAuth } from '@/hooks/useAuth';
import { usePermission } from '@/hooks/usePermission';
import { canManagePurchase } from './CancelPurchasePolicy';
import { CancelPurchaseController } from './CancelPurchaseController';
import { ChangePurchaseController } from './ChangePurchaseController';

function PurchaseButtons({ active, setMode }) {
  return (
    <>
      <Tooltip
        title={
          active ? undefined : 'Chỉ thao tác trên khóa học đã đăng ký và còn buổi chưa diễn ra.'
        }
      >
        <Button danger disabled={!active} onClick={() => setMode('cancel')}>
          Hủy khóa học
        </Button>
      </Tooltip>
      <Button disabled={!active} onClick={() => setMode('change')}>
        Đổi khóa học
      </Button>
    </>
  );
}

/** Container của các khe GY-00; không sửa thẻ gói hoặc thẻ lớp thuộc Khải. */
export function ChangePurchaseActions({ kind, purchase, ownerId, currentId, onSuccess }) {
  const [mode, setMode] = useState(null);
  const { user } = useAuth();
  const { can } = usePermission();
  if (!purchase?.id || !canManagePurchase({ kind, ownerId, userId: user?.id, can })) return null;
  const active =
    kind === 'membership' ? purchase.status === 'ACTIVE' : purchase.status === 'BOOKED';
  const close = () => setMode(null);
  return (
    <Space wrap>
      <PurchaseButtons kind={kind} active={active} setMode={setMode} />
      {mode === 'cancel' && (
        <CancelPurchaseController
          kind={kind}
          purchaseId={purchase.id}
          onClose={close}
          onSuccess={onSuccess}
        />
      )}
      {mode === 'change' && (
        <ChangePurchaseController
          kind={kind}
          purchaseId={purchase.id}
          currentId={currentId}
          memberId={ownerId}
          onClose={close}
          onSuccess={onSuccess}
        />
      )}
    </Space>
  );
}
