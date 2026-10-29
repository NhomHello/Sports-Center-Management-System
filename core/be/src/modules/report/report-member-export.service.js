import ExcelJS from 'exceljs';
import { renderPdf, drawCenterHeader } from '../../common/utils/pdf-document.js';
import { memberReport } from './report-member.service.js';
const columns = [
  ['date', 'Kỳ'],
  ['newMembers', 'Hội viên mới'],
  ['activePeriods', 'Kỳ gói hiệu lực'],
  ['newEnrollments', 'Đăng ký mới'],
  ['cancelledPlans', 'Huỷ gói'],
  ['cancelledEnrollments', 'Huỷ đăng ký'],
  ['classCount', 'Lớp'],
  ['seats', 'Sức chứa'],
  ['booked', 'Đã đăng ký'],
  ['occupancyPercent', '% Lấp đầy'],
];
const csvCell = (value) => `"${String(value).replaceAll('"', '""')}"`;
/** Export lấy cùng builder với tab hội viên, không nhận chỉ số từ client. */
export const exportMembers = async (query) => {
  const report = await memberReport(query);
  const data = [
    columns.map(([, label]) => label),
    ...report.rows.map((row) => columns.map(([key]) => row[key])),
  ];
  let buffer;
  if (query.format === 'xlsx') {
    const book = new ExcelJS.Workbook();
    const sheet = book.addWorksheet('Hội viên và đăng ký');
    sheet.addRows(data);
    buffer = Buffer.from(await book.xlsx.writeBuffer());
  } else if (query.format === 'csv')
    buffer = Buffer.from('\uFEFF' + data.map((row) => row.map(csvCell).join(',')).join('\r\n'));
  else
    buffer = await renderPdf((doc) => {
      drawCenterHeader(doc, { name: 'Báo cáo hội viên và đăng ký' });
      doc.text(`${query.from} → ${query.to} · ${query.groupBy}`).moveDown();
      for (const row of data) doc.text(row.join(' | ')).moveDown();
    }, 'Báo cáo hội viên');
  const types = {
    csv: 'text/csv; charset=utf-8',
    pdf: 'application/pdf',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  };
  return {
    buffer,
    type: types[query.format],
    filename: `members-${query.from}-${query.to}.${query.format}`,
  };
};
