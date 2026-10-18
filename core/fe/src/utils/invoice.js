import { HTTP_STATUS, INVOICE_CHANNEL, INVOICE_STATUS, INVOICE_STATUS_META } from '@/constants';
import { getApiAvailabilityNotice } from './apiAvailability';

/** Chỉ cho in hóa đơn đã thanh toán khi quyền và tên trung tâm đều có sẵn. */
export const canPrintInvoice = ({ invoice, canExport, centerName }) =>
  invoice?.status === INVOICE_STATUS.PAID && canExport && Boolean(centerName?.trim());

/**
 * BR-PAY-14: thu tiền mặt cho hoá đơn tại quầy đang chờ, hoặc thu phần còn thiếu của hoá đơn
 * online đã chuyển thiếu (hội viên ra quầy nộp bù).
 */
export const canCollectCash = ({ invoice, canRecordCash }) => {
  if (!canRecordCash || invoice?.status !== INVOICE_STATUS.PENDING) return false;
  if (!(Number(invoice.amount) > 0)) return false;
  if (invoice.channel === INVOICE_CHANNEL.COUNTER) return true;
  return invoiceReceived(invoice) > 0;
};

/** Số tiền lễ tân cần thu: giá gốc với hoá đơn tại quầy, phần còn thiếu với hoá đơn online. */
export const cashDue = (invoice) =>
  invoice.channel === INVOICE_CHANNEL.COUNTER
    ? Number(invoice.amount)
    : Number(invoice.amount) - invoiceReceived(invoice);

/** Tạo thông báo rõ ràng khi API danh sách hóa đơn chưa được backend đăng ký. */
export const getInvoiceListErrorNotice = (error, canReadAll) => {
  const notice = getApiAvailabilityNotice(error, 'Danh sách hóa đơn');
  if (error?.status === HTTP_STATUS.NOT_FOUND && notice.type === 'warning') {
    const expectedEndpoint = canReadAll ? 'GET /invoices' : 'GET /invoices/me';
    return {
      ...notice,
      description: `${expectedEndpoint} chưa được đăng ký trong backend đang chạy. Đây là thiếu endpoint, không phải lỗi vai trò hay mật khẩu. Backend cần triển khai API này để tải được hóa đơn.`,
    };
  }
  return notice;
};

/** Tổng tiền đã nhận của hoá đơn (API danh sách trả sẵn receivedAmount, chi tiết trả payments). */
export const invoiceReceived = (invoice) =>
  Number(
    invoice?.receivedAmount ??
      (invoice?.payments ?? []).reduce((sum, payment) => sum + payment.receivedAmount, 0),
  );

/**
 * Nhãn trạng thái nói rõ việc cần làm tiếp: hoá đơn chờ được tách theo kênh và theo việc đã nhận
 * một phần tiền hay chưa; hoá đơn quá hạn nhưng job chưa chạy cũng không còn hiện "chờ".
 * @param {object} invoice
 * @param {number} [now] ms
 * @returns {{ color: string, label: string }}
 */
export const invoiceStatusMeta = (invoice, now = Date.now()) => {
  if (invoice.status !== INVOICE_STATUS.PENDING)
    return INVOICE_STATUS_META[invoice.status] ?? { color: 'default', label: invoice.status };
  const online = invoice.channel === INVOICE_CHANNEL.ONLINE;
  if (online && new Date(invoice.expiresAt).getTime() <= now)
    return INVOICE_STATUS_META[INVOICE_STATUS.FAILED];
  if (invoiceReceived(invoice) > 0) return { color: 'orange', label: 'Chờ chuyển bù' };
  return online
    ? { color: 'gold', label: 'Chờ chuyển khoản' }
    : { color: 'gold', label: 'Chờ thu tại quầy' };
};
