import { useMutation } from '@tanstack/react-query';
import { App, Button } from 'antd';
import { downloadReceipt } from '@/services/payment.service';
/** Tệp do server dựng từ hóa đơn gốc, các lần thanh toán và cấu hình trung tâm. */
export function ReceiptDownloadButton({ invoice }) {
  const { message } = App.useApp();
  const mutation = useMutation({
    mutationFn: () => downloadReceipt(invoice.id),
    onSuccess: (blob) => {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${invoice.code}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    },
    onError: (error) => message.error(error.message),
  });
  return (
    <Button loading={mutation.isPending} onClick={() => mutation.mutate()}>
      Tải PDF
    </Button>
  );
}
