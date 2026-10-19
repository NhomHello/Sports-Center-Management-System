import { randomUUID } from 'node:crypto';
import { prisma } from '../../../src/config/db.js';
import { TIME } from '../../../src/constants/index.js';
import {
  createCounterOrder,
  createOnlineOrder,
} from '../../../src/modules/membership/membership-invoice.service.js';
import { collectCash } from '../../../src/modules/payment/payment.service.js';
import { processSepayWebhook } from '../../../src/modules/payment/sepay-webhook.service.js';

/**
 * Giả lập SePay gửi webhook tiền vào cho một hoá đơn, đi qua đúng luồng xử lý thật.
 * @param {{ code: string }} invoice
 * @param {number} amount
 */
export const simulateTransfer = (invoice, amount) =>
  processSepayWebhook({
    id: randomUUID(),
    gateway: 'ACB',
    transferType: 'in',
    transferAmount: amount,
    code: invoice.code,
    content: `${invoice.code} chuyen khoan goi tap`,
    referenceCode: `FT${randomUUID().slice(0, 10).toUpperCase()}`,
  });

/** Hội viên tự mua online; trả hoá đơn PENDING kèm QR (chưa chuyển tiền). */
export const orderOnline = (member, plan) =>
  createOnlineOrder({ memberId: member.id, planId: plan.id }, member);

/** Mua online và chuyển đúng số tiền: hoá đơn PAID, gói được kích hoạt. */
export const payOnline = async (member, plan) => {
  const invoice = await orderOnline(member, plan);
  await simulateTransfer(invoice, invoice.amount);
  return invoice;
};

/** Lễ tân tạo hoá đơn tại quầy rồi thu tiền mặt. */
export const payAtCounter = async (member, plan, staff) => {
  const invoice = await createCounterOrder({ memberId: member.id, planId: plan.id }, staff);
  await collectCash(invoice.id, staff);
  return invoice;
};

const shift = (date, days) => date && new Date(date.getTime() - days * TIME.MS_PER_DAY);

/**
 * Lùi thời điểm của hoá đơn đã trả (và gói nó kích hoạt) về quá khứ để báo cáo doanh thu,
 * biểu đồ theo ngày có dữ liệu trải đều thay vì dồn vào hôm chạy seed.
 * @param {{ id: number }} invoice
 * @param {number} daysAgo
 */
export const backdateInvoice = async (invoice, daysAgo) => {
  const row = await prisma.invoice.findUniqueOrThrow({
    where: { id: invoice.id },
    include: { payments: true, membership: true },
  });
  await prisma.invoice.update({
    where: { id: row.id },
    data: { createdAt: shift(row.createdAt, daysAgo), paidAt: shift(row.paidAt, daysAgo) },
  });
  for (const payment of row.payments) {
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        paidAt: shift(payment.paidAt, daysAgo),
        createdAt: shift(payment.createdAt, daysAgo),
      },
    });
  }
  if (row.membership) {
    await prisma.membership.update({
      where: { id: row.membership.id },
      data: {
        startDate: shift(row.membership.startDate, daysAgo),
        endDate: shift(row.membership.endDate, daysAgo),
      },
    });
  }
};
