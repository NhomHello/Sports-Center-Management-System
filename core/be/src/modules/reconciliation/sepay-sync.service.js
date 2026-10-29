import { SETTING_KEYS } from '@scms/shared';
import { ApiError } from '../../common/errors/api-error.js';
import { prisma } from '../../config/db.js';
import { env } from '../../config/env.js';
import { logger } from '../../config/logger.js';
import { AUDIT_ACTIONS, ENTITIES, PAYMENT_LIMITS, SEPAY, TIME } from '../../constants/index.js';
import { processSepayWebhook } from '../payment/sepay-webhook.service.js';
import * as settingService from '../setting/setting.service.js';

// Định dạng sv-SE cho ra "YYYY-MM-DD HH:mm:ss", đúng dạng SePay nhận, theo giờ Việt Nam.
const sepayTime = new Intl.DateTimeFormat('sv-SE', {
  timeZone: TIME.VIETNAM_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
});
const toSepayTime = (date) => sepayTime.format(date);

/** Chuyển một giao dịch của API danh sách SePay về đúng dạng payload webhook. */
export const toWebhookPayload = (item) => ({
  id: String(item.id),
  gateway: item.bank_brand_name,
  transactionDate: item.transaction_date,
  accountNumber: item.account_number,
  code: item.code || null,
  content: item.transaction_content,
  transferType: Number(item.amount_in) > 0 ? SEPAY.TRANSFER_IN : 'out',
  transferAmount: Number(item.amount_in) > 0 ? Number(item.amount_in) : Number(item.amount_out),
  referenceCode: item.reference_number,
});

const fetchTransactions = async (from, to) => {
  const account = await settingService.getValue(SETTING_KEYS.PAYMENT_ACCOUNT_NUMBER);
  const url = new URL(`${env.SEPAY_API_BASE_URL}/transactions/list`);
  url.search = new URLSearchParams({
    ...(account && { account_number: account }),
    transaction_date_min: toSepayTime(from),
    transaction_date_max: toSepayTime(to),
    limit: String(PAYMENT_LIMITS.SYNC_PAGE_LIMIT),
  }).toString();
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${env.SEPAY_API_TOKEN}` },
    signal: AbortSignal.timeout(PAYMENT_LIMITS.SYNC_TIMEOUT_MS),
  }).catch((err) => {
    logger.warn({ err: err.message }, 'Không gọi được API SePay');
    return null;
  });
  if (!res?.ok) throw ApiError.businessRule('Không lấy được giao dịch từ SePay, thử lại sau');
  const body = await res.json();
  return body.transactions ?? [];
};

/**
 * UC-PAY-14 bước 4: lấy giao dịch tiền vào trong khoảng thời gian và xử lý những giao dịch chưa có
 * trong nhật ký như một webhook. Idempotent theo id SePay (BR-PAY-04) nên bấm nhiều lần an toàn.
 * @param {{ from: Date, to: Date }} range
 * @returns {Promise<{ fetched: number, processed: Record<string, number> }>}
 */
export const syncFromSepay = async ({ from, to }, actor) => {
  if (!env.SEPAY_API_TOKEN)
    throw ApiError.businessRule(
      'Trung tâm chưa kết nối API SePay nên chưa đồng bộ tự động được. Vui lòng đối chiếu sao kê thủ công.',
    );
  if (from >= to) throw ApiError.badRequest('Thời điểm bắt đầu phải trước thời điểm kết thúc');
  const transactions = await fetchTransactions(from, to);
  const processed = {};
  for (const item of transactions.filter((tx) => Number(tx.amount_in) > 0)) {
    const { status } = await processSepayWebhook(toWebhookPayload(item));
    processed[status] = (processed[status] ?? 0) + 1;
  }
  await prisma.auditLog.create({
    data: {
      userId: actor.id,
      action: AUDIT_ACTIONS.UPDATE,
      entity: ENTITIES.RECONCILIATION_CASE,
      meta: { action: 'SEPAY_SYNC', from, to, fetched: transactions.length, processed },
    },
  });
  return { fetched: transactions.length, processed };
};
