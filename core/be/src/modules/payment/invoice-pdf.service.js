import { drawCenterHeader, renderPdf } from '../../common/utils/pdf-document.js';
import { amountInWords } from '@scms/shared';
import { getReceipt, purchaseLabel, purchaseTerm } from './invoice.service.js';

const PDF = Object.freeze({ title: 16, body: 9 });
const money = (value, currency) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency }).format(value);
const date = (value) =>
  value ? new Date(value).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }) : '—';
const providers = {
  COUNTER: 'Tiền mặt tại quầy',
  SEPAY: 'Chuyển khoản SePay',
  MANUAL: 'Ghi nhận thủ công',
};

function drawReceipt(doc, { invoice, center, currency }) {
  drawCenterHeader(doc, center);
  doc.fontSize(PDF.title).text('HÓA ĐƠN THANH TOÁN', { align: 'center' }).moveDown();
  doc.fontSize(PDF.body);
  const fields = [
    ['Mã hóa đơn', invoice.code],
    ['Hội viên', invoice.user.fullName],
    ['Sản phẩm', purchaseLabel(invoice)],
    ['Thời hạn mua', purchaseTerm(invoice)],
    ['Ngày thanh toán', date(invoice.paidAt)],
    ['Trạng thái', 'Đã thanh toán'],
    ['Số tiền', money(invoice.amount, currency)],
    ['Bằng chữ', amountInWords(invoice.amount)],
  ];
  for (const [label, value] of fields) doc.text(`${label}: ${value}`).moveDown();
  doc.text('CÁC LẦN THANH TOÁN').moveDown();
  drawPayments(doc, invoice.payments, currency);
  doc.moveDown().text('Cảm ơn hội viên đã sử dụng dịch vụ của trung tâm.', { align: 'center' });
}
function drawPayments(doc, payments, currency) {
  for (const payment of payments) {
    doc.text(`${date(payment.paidAt)} · ${providers[payment.provider] ?? payment.provider}`);
    doc.text(
      `Thực nhận: ${money(payment.receivedAmount, currency)} · Mã: ${payment.reference || '—'}`,
    );
    doc.text(`Người thu: ${payment.actor?.fullName ?? 'Hệ thống'}`).moveDown();
  }
}

/** PDF A5 dọc lấy từ bản ghi PAID và cấu hình trung tâm; không nhận tiền từ client. */
export const createReceiptPdf = async (id, actor, canExportAll) => {
  const receipt = await getReceipt(id, actor, canExportAll);
  return renderPdf((doc) => drawReceipt(doc, receipt), receipt.invoice.code);
};
