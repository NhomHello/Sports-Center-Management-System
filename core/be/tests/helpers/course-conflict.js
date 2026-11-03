import { prisma } from '../../src/config/db.js';
import { env } from '../../src/config/env.js';
import { api, apiPath } from './api.js';

/** Mô phỏng tiền đã về ngân hàng dù giữ chỗ không thể xác nhận. */
export const sendConflictTransfer = (id, invoice) =>
  api
    .post(apiPath('/payments/sepay/webhook'))
    .set({ Authorization: `Apikey ${env.SEPAY_WEBHOOK_API_KEY}` })
    .send({
      id,
      gateway: 'ACB',
      transferType: 'in',
      transferAmount: invoice.amount,
      code: invoice.code,
      content: invoice.code,
    });

/**
 *
 */
export const invoiceStatus = async (id) =>
  (await prisma.invoice.findUniqueOrThrow({ where: { id } })).status;
