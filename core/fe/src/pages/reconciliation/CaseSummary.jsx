import { Descriptions, Tag } from 'antd';
import { CASE_REASON_LABELS, CASE_STATUS_LABELS } from '@/constants/reconciliation';
import { formatCurrency, formatDateTime } from '@/utils/format';
/** Thông tin hội viên khai khi bấm "Tôi đã chuyển khoản" để quản lý đối chiếu sao kê. */
const describeClaim = ({ claim, note }) =>
  [
    formatCurrency(claim.amount),
    claim.bankName,
    claim.reference && `mã ${claim.reference}`,
    `lúc ${formatDateTime(claim.transferredAt)}`,
    note && `ghi chú: ${note}`,
  ]
    .filter(Boolean)
    .join(' · ');

const sourceLabel = (item) => (item.claim ? 'Hội viên khai báo' : 'Nội dung chuyển khoản');
const sourceText = (item) =>
  item.claim ? describeClaim(item) : (item.webhookLog?.payload?.content ?? '—');

/** Giao dịch gốc và số tiền được API đối chiếu. */
export function CaseSummary({ item }) {
  return (
    <Descriptions bordered column={1}>
      <Descriptions.Item label="Hội viên">
        {item.member?.fullName ?? 'Chưa xác định'}
      </Descriptions.Item>
      <Descriptions.Item label="Lý do">
        {CASE_REASON_LABELS[item.reason] ?? item.reason}
      </Descriptions.Item>
      <Descriptions.Item label="Trạng thái">
        <Tag>{CASE_STATUS_LABELS[item.status]}</Tag>
      </Descriptions.Item>
      <Descriptions.Item label="Hóa đơn">{item.invoice?.code ?? 'Chưa gán'}</Descriptions.Item>
      <Descriptions.Item label="Tiền giao dịch">{formatCurrency(item.amount)}</Descriptions.Item>
      <Descriptions.Item label="Đã nhận / còn thiếu">
        {formatCurrency(item.invoiceReceived)} / {formatCurrency(item.invoiceMissing)}
      </Descriptions.Item>
      <Descriptions.Item label={sourceLabel(item)}>{sourceText(item)}</Descriptions.Item>
    </Descriptions>
  );
}
