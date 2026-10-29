import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { previewChange, changePurchase } from '@/services/purchase.service';
import { ChangePurchaseExecutor } from './ChangePurchaseExecutor';
import { ChangePurchaseModal } from './ChangePurchaseModal';
import { ChangePurchaseTargets } from './ChangePurchaseTargets';

/** Không tái sử dụng preview của đích khác hoặc tài khoản khác. */
export function ChangePurchaseController({
  kind,
  purchaseId,
  currentId,
  memberId,
  onClose,
  onSuccess,
}) {
  const [targetId, setTargetId] = useState();
  const { user } = useAuth();
  const query = useQuery({
    queryKey: ['purchase', user?.id, kind, purchaseId, 'change-preview', targetId],
    queryFn: () => previewChange(kind, purchaseId, targetId),
    enabled: Boolean(targetId),
    retry: false,
    staleTime: 0,
  });
  const targetKey = kind === 'membership' ? 'planId' : 'classId';
  const targets = (
    <ChangePurchaseTargets
      kind={kind}
      currentId={currentId}
      memberId={memberId}
      value={targetId}
      onChange={setTargetId}
    />
  );
  return (
    <ChangePurchaseExecutor
      execute={(values) => changePurchase(kind, purchaseId, { [targetKey]: targetId, ...values })}
      view={ChangePurchaseModal}
      viewKey={targetId}
      viewProps={{ kind, query, onClose, children: targets }}
      onClose={onClose}
      onSuccess={onSuccess}
    />
  );
}
