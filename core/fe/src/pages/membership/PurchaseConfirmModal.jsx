import { Alert, Modal } from 'antd';
import { MembershipEffectSummary } from '@/pages/payments/MembershipEffectPreview';
import { formatCurrency } from '@/utils/format';
/** Confirmation avant création; les dates définitives dépendent du paiement effectif. */
export function PurchaseConfirmModal({ plan, current, query, mutation, onClose }) {
  return (
    <Modal
      open={Boolean(plan)}
      title="Xác nhận gói tập"
      okText="Tạo hóa đơn"
      cancelText="Hủy"
      onCancel={onClose}
      onOk={() => mutation.mutate(plan, { onSuccess: onClose })}
      confirmLoading={mutation.isPending}
      okButtonProps={{ disabled: !query.isSuccess }}
    >
      {plan && (
        <>
          <p>
            {plan.name} · {formatCurrency(plan.price)} · {plan.durationDays} ngày
          </p>
          {query.isError ? (
            <Alert type="error" title={query.error.message} />
          ) : query.isPending ? (
            <p>Đang kiểm tra gói hiện tại…</p>
          ) : (
            <MembershipEffectSummary current={current} durationDays={plan.durationDays} />
          )}
          <Alert
            type="info"
            title="Ngày hiệu lực dự kiến. Gói chỉ được kích hoạt hoặc gia hạn sau khi thanh toán thành công."
          />
        </>
      )}
    </Modal>
  );
}
