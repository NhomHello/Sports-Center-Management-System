import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert, Modal } from 'antd';
import { PERMISSIONS } from '@scms/shared';
import { QUERY_KEYS } from '@/constants';
import { usePermission } from '@/hooks/usePermission';
import { useScheduleMutation } from '@/hooks/useScheduleMutation';
import { getInvoice, collectCash } from '@/services/payment.service';
import { canCollectCash, cashDue } from '@/utils/invoice';
import { formatCurrency } from '@/utils/format';
/** Tải lại hóa đơn trước khi thu tiền khóa học tại quầy. */
export function CourseOrderCashModal({ invoiceId, onClose }) {
  const { can } = usePermission();
  const client = useQueryClient();
  const query = useQuery({
    queryKey: [...QUERY_KEYS.INVOICES, 'course', invoiceId],
    queryFn: () => getInvoice(invoiceId),
    staleTime: 0,
  });
  const invoice = query.data?.data;
  const mutation = useScheduleMutation(
    () => collectCash(invoiceId),
    () => {
      client.invalidateQueries({ queryKey: QUERY_KEYS.INVOICES });
      onClose();
    },
  );
  const allowed = canCollectCash({ invoice, canRecordCash: can(PERMISSIONS.PAYMENT_RECORD_CASH) });
  return (
    <Modal
      open
      title="Thu tiền khóa học"
      okText="Đã nhận đủ tiền"
      cancelText="Đóng"
      confirmLoading={mutation.isPending}
      onCancel={() => {
        if (!mutation.isPending) onClose();
      }}
      okButtonProps={{ disabled: !allowed || query.isFetching || query.isError }}
      onOk={() => mutation.mutate()}
    >
      {query.isPending && <p>Đang tải hóa đơn…</p>}
      {query.isError && <Alert type="error" title={query.error.message} />}
      {invoice && (
        <>
          <p>Hóa đơn: {invoice.code}</p>
          <p>Hội viên: {invoice.user?.fullName}</p>
          <p>Số tiền phải thu: {formatCurrency(cashDue(invoice), invoice.currency)}</p>
        </>
      )}
      {mutation.isError && <Alert type="error" title={mutation.error.message} />}
    </Modal>
  );
}
