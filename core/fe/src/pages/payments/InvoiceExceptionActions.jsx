import { useState } from 'react';
import { Button, Space } from 'antd';
import { PERMISSIONS as P } from '@scms/shared';
import { INVOICE_CHANNEL, INVOICE_STATUS } from '@/constants';
import { useAuth } from '@/hooks/useAuth';
import { usePermission } from '@/hooks/usePermission';
import { PaymentClaimModal } from './PaymentClaimModal';
import { InvoiceRefundModal } from './InvoiceRefundModal';

/** Chủ hóa đơn báo đã chuyển; hoàn tiền chỉ hiện với permission payment.refund. */
export function InvoiceExceptionActions({ invoice }) {
  const [action, setAction] = useState(null);
  const { user } = useAuth();
  const { can } = usePermission();
  const claimable =
    can(P.PAYMENT_CHECKOUT) &&
    invoice.userId === user?.id &&
    invoice.channel === INVOICE_CHANNEL.ONLINE &&
    [INVOICE_STATUS.PENDING, INVOICE_STATUS.FAILED].includes(invoice.status);
  return (
    <Space wrap className="scms-no-print">
      {claimable && <Button onClick={() => setAction('claim')}>Tôi đã chuyển khoản</Button>}
      {invoice.status === INVOICE_STATUS.PAID && can(P.PAYMENT_REFUND) && (
        <Button danger onClick={() => setAction('refund')}>
          Hoàn tiền
        </Button>
      )}
      {action === 'claim' && (
        <PaymentClaimModal invoice={invoice} onClose={() => setAction(null)} />
      )}
      {action === 'refund' && (
        <InvoiceRefundModal invoice={invoice} onClose={() => setAction(null)} />
      )}
    </Space>
  );
}
