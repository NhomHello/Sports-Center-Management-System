import { useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert, App, Button, Space } from 'antd';
import { PERMISSIONS as P } from '@scms/shared';
import { INVOICE_STATUS } from '@/constants';
import { useAuth } from '@/hooks/useAuth';
import { usePermission } from '@/hooks/usePermission';
import { applyCredit, getMemberCredit, getOwnCredit } from '@/services/credit.service';
import { formatCurrency } from '@/utils/format';
import { refreshPurchases } from '../membership/CancelPurchasePolicy';

const creditPaymentEnabled = (invoice, user, allowed) =>
  Boolean(invoice?.id && user?.id) && allowed && invoice.status === INVOICE_STATUS.PENDING;

/** GY-34: API tự tính tối đa được dùng và số tiền còn thiếu; FE không trừ tiền cục bộ. */
function useCreditPayment(invoice, onApplied) {
  const { user } = useAuth();
  const { can } = usePermission();
  const { modal, message } = App.useApp();
  const client = useQueryClient();
  const busy = useRef(false);
  const other = invoice?.userId !== user?.id;
  const allowed = can(other ? P.PAYMENT_READ_ALL : P.PAYMENT_READ_OWN);
  const enabled = creditPaymentEnabled(invoice, user, allowed);
  const query = useQuery({
    queryKey: ['credit', user?.id, invoice?.userId, 'payment'],
    queryFn: () => (other ? getMemberCredit(invoice.userId) : getOwnCredit()),
    enabled,
    retry: false,
    staleTime: 0,
  });
  const mutation = useMutation({
    mutationFn: () => applyCredit(invoice.id),
    onSuccess: async ({ data }) => {
      message.success(
        data.status === INVOICE_STATUS.PAID
          ? 'Đã thanh toán bằng số dư'
          : 'Đã dùng số dư. Tiếp tục thanh toán phần còn thiếu trên hóa đơn.',
      );
      await refreshPurchases(client);
      onApplied?.(data);
    },
  });
  const confirm = () => {
    if (busy.current) return;
    busy.current = true;
    modal.confirm({
      title: 'Dùng số dư cho hóa đơn này?',
      content:
        'Hệ thống dùng tối đa số dư hợp lệ. QR hoặc tiền mặt chỉ thanh toán phần còn thiếu do hệ thống trả về.',
      okText: 'Dùng số dư',
      cancelText: 'Đóng',
      onOk: () => mutation.mutateAsync(),
      afterClose: () => {
        busy.current = false;
      },
    });
  };
  return { enabled, query, mutation, confirm };
}

/** GY-34: trừ số dư qua server, dùng được trong hai khe thanh toán online và tại quầy. */
export function ApplyCreditButton({ invoice, onApplied }) {
  const { enabled, query, mutation, confirm } = useCreditPayment(invoice, onApplied);
  if (!enabled) return null;
  const balance = query.data?.data?.balance;
  return (
    <Space orientation="vertical">
      {query.isError && (
        <Alert
          type="error"
          showIcon
          title={query.error.message}
          action={<Button onClick={() => query.refetch()}>Thử lại</Button>}
        />
      )}
      {Number.isSafeInteger(balance) && balance > 0 && (
        <Button onClick={confirm} loading={mutation.isPending} disabled={query.isFetching}>
          Dùng số dư (còn {formatCurrency(balance)})
        </Button>
      )}
      {mutation.isError && <Alert showIcon type="error" title={mutation.error.message} />}
    </Space>
  );
}
