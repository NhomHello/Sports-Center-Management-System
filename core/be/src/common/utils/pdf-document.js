import PDFDocument from 'pdfkit';
import { fileURLToPath } from 'node:url';
const FONT = fileURLToPath(new URL('../../../assets/fonts/DejaVuSans.ttf', import.meta.url));
const PDF = Object.freeze({ margin: 28, title: 16, body: 9, logo: 22 });

/** Khung chung hoá đơn/phiếu tổng kết, dùng font tiếng Việt đã có license trong repo. */
export const drawCenterHeader = (doc, center) => {
  doc.font(FONT).fontSize(PDF.logo).text('SC', { align: 'center' });
  doc.fontSize(PDF.title).text(center.name, { align: 'center' });
  doc.fontSize(PDF.body).text(center.address || '', { align: 'center' });
  doc.text(center.phone || '', { align: 'center' }).moveDown();
};

/** Buffer PDF hoàn chỉnh; controller chỉ đặt content-type/attachment. */
export const renderPdf = (draw, title) => new Promise((resolve, reject) => {
  const doc = new PDFDocument({ size: 'A5', margin: PDF.margin, info: { Title: title } });
  const parts = [];
  doc.on('data', (part) => parts.push(part));
  doc.on('end', () => resolve(Buffer.concat(parts)));
  doc.on('error', reject);
  draw(doc);
  doc.end();
});
