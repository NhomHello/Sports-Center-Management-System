import { useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { App } from 'antd';
import { useNavigate } from 'react-router';
import { ROUTES } from '@/constants';
import { refreshPurchases } from './CancelPurchasePolicy';

const adjustmentId = (change) => change?.adjustmentInvoice?.id ?? change?.adjustmentInvoiceId;
const successText = (result) =>
  result.data?.status === 'PENDING_PAYMENT'
    ? 'Cần thanh toán chênh lệch để hoàn tất đổi'
    : result.message || 'Đã xử lý yêu cầu';

/** Container chung: chờ thu thêm thì mở hóa đơn, không tự đánh dấu đã đổi thành công. */
export function ChangePurchaseExecutor({
  execute,
  view: View,
  viewProps,
  viewKey,
  onClose,
  onSuccess,
}) {
  const client = useQueryClient();
  const navigate = useNavigate();
  const { message } = App.useApp();
  const busy = useRef(false);
  const mutation = useMutation({
    mutationFn: execute,
    onSuccess: async (result) => {
      const change = result.data;
      const invoiceId = adjustmentId(change);
      const pending = change?.status === 'PENDING_PAYMENT';
      message.success(successText(result));
      await refreshPurchases(client);
      onSuccess?.(change);
      onClose();
      if (pending && invoiceId) navigate(`${ROUTES.PAYMENTS}?invoice=${invoiceId}`);
    },
    onError: () => client.invalidateQueries({ queryKey: ['purchase'] }),
    onSettled: () => {
      busy.current = false;
    },
  });
  const submit = (values) => {
    if (busy.current) return;
    busy.current = true;
    mutation.mutate(values);
  };
  return <View key={viewKey} {...viewProps} mutation={mutation} onSubmit={submit} />;
}
