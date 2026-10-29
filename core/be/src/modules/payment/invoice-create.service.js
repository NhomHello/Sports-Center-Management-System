import { randomUUID } from 'node:crypto';
import { SETTING_KEYS } from '@scms/shared';
import { AUDIT_ACTIONS, ENTITIES, TIME, VALIDATION } from '../../constants/index.js';
import * as settingService from '../setting/setting.service.js';
import { INVOICE_INCLUDE } from './invoice.service.js';

/** Tiền tố mã và hạn thanh toán online đọc một lần trước transaction. */
export const loadInvoicePolicy = async () => ({
  prefix: await settingService.getValue(SETTING_KEYS.INVOICE_CODE_PREFIX),
  timeout: await settingService.getValue(SETTING_KEYS.PAYMENT_ONLINE_TIMEOUT_MINUTES),
});

/**
 * Tạo hoá đơn (gói, khóa học hoặc chênh lệch) với mã tuần tự theo id và audit cùng transaction.
 * Giá luôn do server tính, không nhận từ client.
 * @param {object} tx
 * @param {{ data: object, policy: { prefix: string, timeout: number }, actorId: number, now: Date, meta?: object }} input
 */
export const createInvoiceRecord = async (tx, { data, policy, actorId, now, meta = {} }) => {
  const created = await tx.invoice.create({
    data: {
      ...data,
      code: `PENDING-${randomUUID()}`,
      expiresAt: new Date(now.getTime() + policy.timeout * TIME.MS_PER_MINUTE),
    },
  });
  const invoice = await tx.invoice.update({
    where: { id: created.id },
    data: {
      code: `${policy.prefix}${String(created.id).padStart(VALIDATION.INVOICE_SEQUENCE_WIDTH, '0')}`,
    },
    include: INVOICE_INCLUDE,
  });
  await tx.auditLog.create({
    data: {
      userId: actorId,
      action: AUDIT_ACTIONS.CREATE,
      entity: ENTITIES.INVOICE,
      entityId: String(invoice.id),
      meta: {
        memberId: invoice.userId,
        kind: invoice.kind,
        amount: invoice.amount,
        channel: invoice.channel,
        ...meta,
      },
    },
  });
  return invoice;
};
