import { HTTP_STATUS, INVOICE_STATUS, INVOICE_CHANNEL } from '@/constants';
import { getApiAvailabilityNotice } from './apiAvailability';

/** Chỉ cho in hoá đơn đã thanh toán khi quyền và tên trung tâm đều có sẵn. */
export const canPrintInvoice = ({ invoice, canExport, centerName }) =>
  invoice?.status === INVOICE_STATUS.PAID && canExport && Boolean(centerName?.trim());

/** BR-PAY-14: quyền thu tiền, kênh tại quầy và số tiền gốc hợp lệ là bắt buộc. */
export const canCollectCash = ({ invoice, canRecordCash }) =>
  Boolean(
    canRecordCash &&
    invoice?.status === INVOICE_STATUS.PENDING &&
    invoice.channel === INVOICE_CHANNEL.COUNTER &&
    Number.isFinite(Number(invoice.amount)) &&
    Number(invoice.amount) > 0,
  );

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
