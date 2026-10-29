import PDFDocument from 'pdfkit';
import { fileURLToPath } from 'node:url';
import { amountInWords } from '@scms/shared';
import { getReceipt, purchaseLabel, purchaseTerm } from './invoice.service.js';

const FONT = fileURLToPath(new URL('../../../assets/fonts/DejaVuSans.ttf', import.meta.url));
const PDF = Object.freeze({ margin: 28, title: 16, body: 9, logo: 22 });
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
  doc.font(FONT).fontSize(PDF.logo).text('SC', { align: 'center' });
  doc.fontSize(PDF.title).text(center.name, { align: 'center' });
  doc.fontSize(PDF.body).text(center.address || '', { align: 'center' });
  doc.text(center.phone || '', { align: 'center' }).moveDown();
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
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A5',
      margin: PDF.margin,
      info: { Title: receipt.invoice.code },
    });
    const parts = [];
    doc.on('data', (part) => parts.push(part));
    doc.on('end', () => resolve(Buffer.concat(parts)));
    doc.on('error', reject);
    drawReceipt(doc, receipt);
    doc.end();
  });
};
