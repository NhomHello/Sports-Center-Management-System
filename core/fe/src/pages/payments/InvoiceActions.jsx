import { EyeOutlined, DollarOutlined, QrcodeOutlined } from '@ant-design/icons';
import { PERMISSIONS } from '@scms/shared';
import { Button } from 'antd';
import { useAuth } from '@/hooks/useAuth';
import { INVOICE_CHANNEL, INVOICE_STATUS } from '@/constants';
import { canCollectCash } from '@/utils/invoice';
import { usePermission } from '@/hooks/usePermission';

/** Các thao tác theo quyền và tình trạng hóa đơn; trạng thái chờ đã nói ở cột Trạng thái. */
export function InvoiceActions({ invoice, onCash, onDetail }) {
  const { can } = usePermission();
  const { user } = useAuth();
  const canContinue =
    invoice.userId === user?.id &&
    invoice.channel === INVOICE_CHANNEL.ONLINE &&
    invoice.status === INVOICE_STATUS.PENDING &&
    new Date(invoice.expiresAt) > new Date() &&
    can(PERMISSIONS.PAYMENT_CHECKOUT);
  return (
    <div className="scms-invoice-actions">
      {canContinue && (
        <Button
          size="small"
          type="primary"
          icon={<QrcodeOutlined />}
          onClick={() => onDetail(invoice.id)}
        >
          Thanh toán
        </Button>
      )}
      {canCollectCash({ invoice, canRecordCash: can(PERMISSIONS.PAYMENT_RECORD_CASH) }) && (
        <Button
          size="small"
          type="primary"
          icon={<DollarOutlined />}
          onClick={() => onCash(invoice.id)}
        >
          Thu tiền
        </Button>
      )}
      {!canContinue && (
        <Button size="small" icon={<EyeOutlined />} onClick={() => onDetail(invoice.id)}>
          Chi tiết
        </Button>
      )}
    </div>
  );
}
