#!/usr/bin/env node
/**
 * Giả lập SePay báo có tiền vào (dùng khi demo không chuyển khoản thật).
 *   npm run demo:webhook -- INV000123 360000          chuyển đúng / thiếu / thừa tuỳ số tiền
 *   npm run demo:webhook -- INV000123 360000 --twice  gửi 2 giao dịch khác id cùng mã (chuyển lặp)
 *   npm run demo:webhook -- - 360000                  không ghi mã hoá đơn (phiếu "Sai hoặc thiếu mã")
 * Đọc SEPAY_WEBHOOK_API_KEY, PORT, API_PREFIX từ core/be/.env; không in khoá ra màn hình.
 */
import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { BE_DIR } from './lib.mjs';

const env = Object.fromEntries(
  readFileSync(path.join(BE_DIR, '.env'), 'utf8')
    .split(/\r?\n/)
    .filter((line) => /^[A-Z_]+=/.test(line))
    .map((line) => {
      const index = line.indexOf('=');
      return [
        line.slice(0, index),
        line
          .slice(index + 1)
          .trim()
          .replace(/^(['"])(.*)\1$/, '$2'),
      ];
    }),
);

const [code, amountText, flag] = process.argv.slice(2);
const amount = Number(amountText);
if (!code || !Number.isFinite(amount) || amount <= 0) {
  console.error('Cách dùng: npm run demo:webhook -- <MÃ_HOÁ_ĐƠN|-> <SỐ_TIỀN> [--twice]');
  process.exit(1);
}
const url = `http://localhost:${env.PORT || 3000}${env.API_PREFIX || '/api/v1'}/payments/sepay/webhook`;
const send = async () => {
  const invoiceCode = code === '-' ? null : code.toUpperCase();
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Apikey ${env.SEPAY_WEBHOOK_API_KEY}`,
    },
    body: JSON.stringify({
      id: randomUUID(),
      gateway: 'ACB',
      transferType: 'in',
      transferAmount: amount,
      code: invoiceCode,
      content: invoiceCode ? `${invoiceCode} chuyen khoan goi tap` : 'chuyen tien tap gym',
      referenceCode: `FT${Date.now()}`,
    }),
  });
  const body = await res.json().catch(() => ({}));
  console.log(`HTTP ${res.status}`, JSON.stringify(body.data ?? body));
};
await send();
if (flag === '--twice') await send();
