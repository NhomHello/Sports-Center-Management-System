import { useState } from 'react';
import { Button, Space, Tooltip } from 'antd';
import { useAuth } from '@/hooks/useAuth';
import { usePermission } from '@/hooks/usePermission';
import { canManagePurchase } from './CancelPurchasePolicy';
import { CancelPurchaseController } from './CancelPurchaseController';
import { ChangePurchaseController } from './ChangePurchaseController';

function PurchaseButtons({ kind, active, setMode }) {
  return (
    <>
      <Tooltip
        title={
          active
            ? undefined
            : 'Chỉ thao tác trên gói hoặc khóa còn hoạt động; kết thúc bảo lưu trước khi hủy/đổi.'
        }
      >
        <Button danger disabled={!active} onClick={() => setMode('cancel')}>
          {kind === 'membership' ? 'Hủy gói' : 'Hủy khóa học'}
        </Button>
      </Tooltip>
      <Button disabled={!active} onClick={() => setMode('change')}>
        {kind === 'membership' ? 'Đổi gói' : 'Đổi lớp'}
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
