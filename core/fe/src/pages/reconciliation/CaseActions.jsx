import { PERMISSIONS as P } from '@scms/shared';
import { Alert, Divider } from 'antd';
import { Link } from 'react-router';
import { ROUTES } from '@/constants';
import { usePermission } from '@/hooks/usePermission';
import { caseActions } from '@/utils/reconciliationActions';
import { formatCurrency } from '@/utils/format';
import { CaseMapForm } from './CaseMapForm';
import { CaseContacts } from './CaseContacts';
import { CaseConfirmForm } from './CaseConfirmForm';
import { CaseExcessForm } from './CaseExcessForm';
import { CaseRefundForm } from './CaseRefundForm';
import { CaseDecisionForm } from './CaseDecisionForm';

function PendingRefundNotice({ refund }) {
  return (
    <Alert
      showIcon
      type="info"
      title={`Đang chờ chuyển trả ${formatCurrency(refund.amount)}`}
      description={
        <>
          Chuyển tiền thủ công cho hội viên rồi nhập mã tham chiếu tại{' '}
          <Link to={ROUTES.PAYMENTS}>Hóa đơn → Theo dõi hoàn tiền</Link>. Khoản này không được dùng
          để gán hay gia hạn nữa.
        </>
      }
    />
  );
}

/** Gán / xác nhận / gia hạn / từ chối: các cách dùng khoản tiền của phiếu. */
function SettleForms({ item, allowed, mutation }) {
  const pending = mutation.isPending;
  const blocked = allowed.needsContact;
  return (
    <>
      {allowed.map && (
        <>
          <Divider titlePlacement="start">Gán vào hóa đơn</Divider>
          <CaseMapForm pending={pending} onAction={mutation.mutate} />
        </>
      )}
      {allowed.confirm && (
        <>
          <Divider titlePlacement="start">Xác nhận đã nhận tiền</Divider>
          <CaseConfirmForm
            key={item.id}
            pending={pending}
            disabled={blocked}
            onSubmit={(data) => mutation.mutate({ action: 'confirm', data })}
          />
        </>
      )}
      {allowed.renew && <CaseExcessForm item={item} pending={pending} onAction={mutation.mutate} />}
      {allowed.reject && (
        <CaseDecisionForm
          action="reject"
          pending={pending}
          disabled={blocked}
          onAction={mutation.mutate}
        />
      )}
    </>
  );
}

/** Thao tác theo lý do + trạng thái phiếu, khớp điều kiện API (xem utils/reconciliationActions). */
export function CaseActions({ item, mutation }) {
  const { can } = usePermission();
  const allowed = caseActions(item);
  const pending = mutation.isPending;
  const blocked = allowed.needsContact;
  return (
    <>
      {allowed.pendingRefund && <PendingRefundNotice refund={allowed.pendingRefund} />}
      <CaseContacts
        item={item}
        active={allowed.active}
        pending={pending}
        onAction={mutation.mutateAsync}
      />
      {allowed.active && blocked && (
        <Alert
          showIcon
          type="warning"
          title="Ghi lại ít nhất một lần liên hệ hội viên ở trên trước khi xác nhận, từ chối, gia hạn hoặc hoàn tiền."
        />
      )}
      <SettleForms item={item} allowed={allowed} mutation={mutation} />
      {allowed.refund && can(P.PAYMENT_REFUND) && (
        <CaseRefundForm
          item={item}
          pending={pending}
          disabled={blocked}
          onAction={mutation.mutate}
        />
      )}
      {allowed.ignore && (
        <CaseDecisionForm action="ignore" pending={pending} onAction={mutation.mutate} />
      )}
    </>
  );
}
