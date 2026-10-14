import { SETTING_KEYS } from '@scms/shared';
import { Enums } from '../../config/db.js';
import { env } from '../../config/env.js';
import * as settingService from '../setting/setting.service.js';

/**
 * Thông tin hội viên cần để chuyển khoản cho hoá đơn online còn chờ.
 * Tài khoản nhận tiền đọc từ system_settings để mỗi môi trường/thành viên tự cấu hình qua UI;
 * nội dung chuyển khoản = mã hoá đơn để webhook khớp lại hoá đơn.
 * @param {{ code: string, amount: number, channel: string, status: string, expiresAt: Date }} invoice
 * @returns {Promise<object|null>} null khi không phải hoá đơn online đang chờ hoặc chưa cấu hình tài khoản
 */
export const buildPaymentInstruction = async (invoice) => {
  if (
    invoice.channel !== Enums.InvoiceChannel.ONLINE ||
    invoice.status !== Enums.InvoiceStatus.PENDING
  ) {
    return null;
  }
  const [bankCode, accountNumber, accountName] = await Promise.all([
    settingService.getValue(SETTING_KEYS.PAYMENT_BANK_CODE),
    settingService.getValue(SETTING_KEYS.PAYMENT_ACCOUNT_NUMBER),
    settingService.getValue(SETTING_KEYS.PAYMENT_ACCOUNT_NAME),
  ]);
  if (!bankCode || !accountNumber) return null;
  const qr = new URL(env.SEPAY_QR_BASE_URL);
  qr.searchParams.set('acc', accountNumber);
  qr.searchParams.set('bank', bankCode);
  qr.searchParams.set('amount', String(invoice.amount));
  qr.searchParams.set('des', invoice.code);
  return {
    bankCode,
    accountNumber,
    accountName: accountName || null,
    amount: invoice.amount,
    content: invoice.code,
    qrUrl: qr.toString(),
    expiresAt: invoice.expiresAt,
  };
};
