import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert, App, Descriptions, Modal, Typography } from 'antd';
import { PERMISSIONS } from '@scms/shared';
import { QUERY_KEYS } from '@/constants';
import { PageLoading } from '@/components/common/PageLoading';
import { useAuth } from '@/hooks/useAuth';
import { usePermission } from '@/hooks/usePermission';
import * as paymentService from '@/services/payment.service';
import { canCollectCash } from '@/utils/invoice';
import { formatCurrency, formatDate } from '@/utils/format';
import { MembershipEffectPreview } from './MembershipEffectPreview';
import {
  getApiAvailabilityNotice,
  getApiOperationErrorMessage,
  shouldRetryApiQuery,
} from '@/utils/apiAvailability';

function CashInvoiceSummary({ invoice }) {
  return (
    <>
      <Descriptions column={1} bordered>
        <Descriptions.Item label="Mã hóa đơn">{invoice.code}</Descriptions.Item>
        <Descriptions.Item label="Hội viên">{invoice.user?.fullName}</Descriptions.Item>
        <Descriptions.Item label="Gói tập">
          {invoice.planName ?? invoice.plan?.name}
        </Descriptions.Item>
        <Descriptions.Item label="Số tiền phải thu">
          <Typography.Text strong>
            {formatCurrency(invoice.amount, invoice.currency)}
          </Typography.Text>
        </Descriptions.Item>
      </Descriptions>
      <MembershipEffectPreview
        memberId={invoice.userId}
        durationDays={invoice.durationDays ?? invoice.plan?.durationDays}
      />
    </>
  );
}

function CashPaymentContent({ query, mutation, canCollect }) {
  if (query.isPending) return <PageLoading />;
  if (query.isError) {
    const notice = getApiAvailabilityNotice(query.error, 'Chi tiết hóa đơn');
    return (
      <Alert
        showIcon
        type={notice.type}
        message={notice.message}
        description={notice.description}
      />
    );
  }
  const invoice = query.data?.data;
  if (!invoice) return null;
  return (
    <>
      {mutation.isError && (
        <Alert
          showIcon
          type="error"
          message={getApiOperationErrorMessage(mutation.error, 'ghi nhận thu tiền')}
        />
      )}
      <CashInvoiceSummary invoice={invoice} />
      <Typography.Paragraph type="secondary">
        Xác nhận khi đã nhận đủ số tiền trên hóa đơn. Membership chỉ được cập nhật sau khi hệ thống
        ghi nhận thanh toán thành công.
      </Typography.Paragraph>
      {!canCollect && (
        <Alert
          showIcon
          type="warning"
          message="Hóa đơn hoặc quyền hiện tại không cho phép thu tiền mặt."
        />
      )}
    </>
  );
}

/** Xác nhận số tiền bản gốc từ chi tiết mới tải; backend quyết định kích hoạt/gia hạn. */
export function InvoiceCashModal({ invoiceId, onClose, onPaid }) {
  const { user } = useAuth();
  const { can } = usePermission();
  const { message } = App.useApp();
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: [...QUERY_KEYS.INVOICES, 'detail', user?.id, invoiceId],
    queryFn: () => paymentService.getInvoice(invoiceId),
    enabled: Boolean(invoiceId),
    retry: shouldRetryApiQuery,
    staleTime: 0,
  });
  const invoice = query.data?.data;
  const mutation = useMutation({
    mutationFn: paymentService.collectCash,
    onSuccess: ({ data }) => {
      // Đóng modal trước rồi mới làm mới dữ liệu: nếu làm mới trước, hoá đơn PAID khiến modal
      // đang đóng chớp lên cảnh báo "không cho phép thu tiền".
      message.success(`Đã thu tiền. Gói tập hiệu lực đến ${formatDate(data.membership?.endDate)}.`);
      onPaid(data.id);
      mutation.reset();
      [QUERY_KEYS.INVOICES, QUERY_KEYS.MEMBERS, QUERY_KEYS.NOTIFICATIONS].forEach((queryKey) =>
        queryClient.invalidateQueries({ queryKey }),
      );
    },
  });
  const canCollect =
    canCollectCash({ invoice, canRecordCash: can(PERMISSIONS.PAYMENT_RECORD_CASH) }) &&
    !query.isFetching &&
    !query.isError;
  return (
    <Modal
      open={Boolean(invoiceId)}
      centered
      title="Xác nhận thu tiền mặt"
      okText="Đã nhận đủ tiền"
      cancelText="Hủy"
      confirmLoading={mutation.isPending}
      okButtonProps={{ disabled: !canCollect }}
      onOk={() => mutation.mutate(invoiceId)}
      onCancel={() => {
        if (!mutation.isPending) {
          mutation.reset();
          onClose();
        }
      }}
    >
      <CashPaymentContent query={query} mutation={mutation} canCollect={canCollect} />
    </Modal>
  );
}
