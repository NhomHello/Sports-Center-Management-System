import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import { fileURLToPath } from 'node:url';
import { SPRINT3 } from '../../constants/index.js';
import { dashboard } from './report.service.js';

const HEADERS = ['Kỳ', 'Doanh thu', 'Hoàn tiền', 'Thực thu', 'Hoá đơn đã trả', 'Lượt hoàn'];
const font = fileURLToPath(new URL('../../../assets/fonts/DejaVuSans.ttf', import.meta.url));
const values = (row) => [
  row.date,
  row.revenue,
  row.refunded,
  row.net,
  row.paidCount,
  row.refundCount,
];
// Cột tiền trong bảng theo ngày: Doanh thu, Hoàn tiền, Thực thu (khớp HEADERS).
const MONEY_COLUMNS = new Set(
  ['Doanh thu', 'Hoàn tiền', 'Thực thu'].map((title) => HEADERS.indexOf(title)),
);
const vnd = new Intl.NumberFormat('vi-VN');
/** PDF để đọc: tiền có dấu chấm nghìn và "đ"; CSV/Excel giữ số thô để tính toán tiếp. */
const readable = ([label, value, money]) => [label, money ? `${vnd.format(value)} đ` : value];
import { revenueSummaryRows as summaryRows } from './report-export-rows.js';
const escapeCsv = (value) => `"${String(value).replaceAll('"', '""')}"`;

async function xlsx(report) {
  const workbook = new ExcelJS.Workbook();
  const summary = workbook.addWorksheet('Tổng hợp');
  summary.addRows(summaryRows(report).map(([label, value]) => [label, value]));
  const sheet = workbook.addWorksheet('Doanh thu theo kỳ');
  sheet.addRow(HEADERS);
  sheet.addRows(report.rows.map(values));
  return Buffer.from(await workbook.xlsx.writeBuffer());
}

function pdf(report) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: SPRINT3.PDF_MARGIN });
    const parts = [];
    doc.on('data', (part) => parts.push(part));
    doc.on('end', () => resolve(Buffer.concat(parts)));
    doc.on('error', reject);
    doc.font(font).fontSize(SPRINT3.PDF_FONT_SIZE).text('Báo cáo trung tâm thể thao').moveDown();
    for (const row of summaryRows(report)) doc.text(readable(row).join(': '));
    doc.moveDown().text(HEADERS.join(' | '));
    for (const row of report.rows)
      doc.text(
        values(row)
          .map((value, index) => (MONEY_COLUMNS.has(index) ? `${vnd.format(value)} đ` : value))
          .join(' | '),
      );
    doc.end();
  });
}

/** UC-RPT-01: không nhận số tiền từ client; mỗi định dạng lấy cùng snapshot dashboard. */
export const exportReport = async (query) => {
  const report = await dashboard(query);
  const builders = {
    csv: () =>
      Buffer.from(
        '\uFEFF' +
          [
            ...summaryRows(report).map(([label, value]) => [label, value]),
            [],
            HEADERS,
            ...report.rows.map(values),
          ]
            .map((row) => row.map(escapeCsv).join(','))
            .join('\r\n'),
      ),
    xlsx: () => xlsx(report),
    pdf: () => pdf(report),
  };
  const types = {
    csv: 'text/csv; charset=utf-8',
    pdf: 'application/pdf',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  };
  return {
    buffer: await builders[query.format](),
    type: types[query.format],
    filename: `report-${query.from}-${query.to}.${query.format}`,
  };
};
