import { PERMISSIONS as P } from '@scms/shared';
import { Alert, Button, Divider, Popconfirm, Typography } from 'antd';
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

/** BR-PAY-06: chuyển thừa không tự hoàn thành; quản lý chấp nhận sau khi đã liên hệ hội viên. */
function AcceptOverpaid({ item, pending, disabled, onAction }) {
  return (
    <>
      <Divider titlePlacement="start">Chấp nhận hóa đơn chuyển thừa</Divider>
      <Typography.Paragraph type="secondary">
        Hội viên chuyển {formatCurrency(item.invoiceReceived)} cho hóa đơn{' '}
        {formatCurrency(item.invoice?.amount)}. Chấp nhận sẽ kích hoạt gói; phần thừa{' '}
        {formatCurrency(item.invoiceReceived - (item.invoice?.amount ?? 0))} xử lý tiếp bằng hoàn
        tiền hoặc gia hạn. Nếu hội viên không muốn mua gói, dùng "Hoàn tiền" để hoàn toàn bộ.
      </Typography.Paragraph>
      <Popconfirm
        title="Chấp nhận hóa đơn và kích hoạt gói?"
        okText="Chấp nhận"
        cancelText="Không"
        disabled={disabled}
        onConfirm={() => onAction({ action: 'accept' })}
      >
        <Button type="primary" disabled={disabled} loading={pending}>
          Chấp nhận hóa đơn
        </Button>
      </Popconfirm>
    </>
  );
}

/** Gán / xác nhận / gia hạn / từ chối: các cách dùng khoản tiền của phiếu. */
function SettleForms({ item, allowed, mutation }) {
  const pending = mutation.isPending;
  const blocked = allowed.needsContact;
  return (
    <>
      {allowed.accept && (
        <AcceptOverpaid
          item={item}
          pending={pending}
          disabled={blocked}
          onAction={mutation.mutate}
        />
      )}
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
            claim={item.claim}
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
