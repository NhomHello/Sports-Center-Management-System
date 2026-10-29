import { Enums } from '../../config/db.js';
const kindNames = { [Enums.InvoiceKind.MEMBERSHIP]: 'Gói tự tập', [Enums.InvoiceKind.COURSE]: 'Khoá học', [Enums.InvoiceKind.ADJUSTMENT]: 'Chênh lệch đổi' };
const channelNames = { [Enums.InvoiceChannel.COUNTER]: 'Tại quầy', [Enums.InvoiceChannel.ONLINE]: 'Online' };
function productDimension(invoice, key) {
  const extractors = {
    byPlan: () => [String(invoice.planId), invoice.plan?.name ?? 'Gói không xác định'],
    byClass: () => [String(invoice.classId), invoice.courseClass?.name ?? 'Lớp không xác định'],
    bySubject: () => [String(invoice.courseClass?.subject.id ?? 0), invoice.courseClass?.subject.name ?? 'Bộ môn không xác định'],
  };
  const required = { byPlan: Enums.InvoiceKind.MEMBERSHIP, byClass: Enums.InvoiceKind.COURSE, bySubject: Enums.InvoiceKind.COURSE };
  return invoice.kind === required[key] ? extractors[key]() : [`other:${invoice.kind}`, kindNames[invoice.kind] ?? 'Khác'];
}
function dimension(invoice, key) {
  if (key === 'byKind') return [invoice.kind, kindNames[invoice.kind]];
  if (key === 'byChannel') return [invoice.channel, channelNames[invoice.channel]];
  return productDimension(invoice, key);
}
/** Mỗi sự kiện thuộc đúng một bucket trong mỗi chiều; tổng net luôn bằng net dashboard. */
export const buildBreakdown = (events) => Object.fromEntries(['byKind', 'byChannel', 'byPlan', 'byClass', 'bySubject'].map((key) => {
  const map = new Map();
  for (const event of events) {
    const [id, label] = dimension(event.invoice, key);
    if (!map.has(id)) map.set(id, { id, label, revenue: 0, refunded: 0, net: 0 });
    const row = map.get(id); row.revenue += event.revenue; row.refunded += event.refunded;
    row.net = row.revenue - row.refunded;
  }
  return [key, [...map.values()].sort((a, b) => b.net - a.net || a.id.localeCompare(b.id))];
}));
