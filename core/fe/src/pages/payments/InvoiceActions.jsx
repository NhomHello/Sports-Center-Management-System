import { EyeOutlined, DollarOutlined } from '@ant-design/icons';
import { PERMISSIONS } from '@scms/shared';
import { Button, Space, Table, Tag, Tooltip } from 'antd';
import { useAuth } from '@/hooks/useAuth';
import { INVOICE_CHANNEL, INVOICE_STATUS, INVOICE_STATUS_META } from '@/constants';
import { canCollectCash } from '@/utils/invoice';
import { usePermission } from '@/hooks/usePermission';
import { StatusTag } from '@/components/common/StatusTag';

/** Các thao tác theo quyền và tình trạng hóa đơn. */
export function InvoiceActions({ invoice, onCash, onDetail }) {
  const { can } = usePermission();
  const { user } = useAuth();
  return (
    <Space wrap>
      {invoice.userId === user?.id &&
        invoice.channel === INVOICE_CHANNEL.ONLINE &&
        invoice.status === INVOICE_STATUS.PENDING &&
        new Date(invoice.expiresAt) > new Date() &&
        can(PERMISSIONS.PAYMENT_CHECKOUT) && (
          <Button onClick={() => onDetail(invoice.id)}>Tiếp tục thanh toán</Button>
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
      {invoice.channel === INVOICE_CHANNEL.ONLINE && invoice.status === INVOICE_STATUS.PENDING && (
        <Tooltip title="Hóa đơn online tự xác nhận khi nhận được tiền chuyển khoản, không thu tiền mặt.">
          <Tag color="gold">Chờ chuyển khoản</Tag>
        </Tooltip>
      )}
      <Button size="small" icon={<EyeOutlined />} onClick={() => onDetail(invoice.id)}>
        Chi tiết
      </Button>
    </Space>
  );
}
