import assert from 'node:assert/strict';

process.loadEnvFile('core/be/.env');
const { env } = await import('../core/be/src/config/env.js');
const { prisma } = await import('../core/be/src/config/db.js');
try {
  const code = process.argv[2]?.trim().toUpperCase();
  assert.ok(code, 'Cách dùng: node scripts/replay-demo-webhook.mjs <MA_HOA_DON_I>');
  const invoice = await prisma.invoice.findUniqueOrThrow({
    where: { code },
    include: { user: true },
  });
  assert.ok(
    invoice.user.email?.startsWith('ccl_'),
    'Chỉ phát lại giao dịch của bộ dữ liệu hội đồng ccl_',
  );
  const log = await prisma.paymentWebhookLog.findFirstOrThrow({
    where: { invoiceId: invoice.id, status: 'PROCESSED' },
    orderBy: { id: 'desc' },
  });
  assert.ok(log.payload?.id, 'Log phải có payload gốc cùng ID SePay');
  const before = await prisma.payment.count({ where: { invoiceId: invoice.id } });
  const response = await fetch(
    `http://127.0.0.1:${env.PORT}${env.API_PREFIX}/payments/sepay/webhook`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Apikey ${env.SEPAY_WEBHOOK_API_KEY}`,
      },
      body: JSON.stringify(log.payload),
    },
  );
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.data?.status, 'DUPLICATE');
  assert.equal(await prisma.payment.count({ where: { invoiceId: invoice.id } }), before);
  console.log(
    JSON.stringify({
      invoice: code,
      http: response.status,
      status: body.data.status,
      paymentsBefore: before,
      paymentsAfter: before,
      sameTransactionIdReplayed: true,
    }),
  );
} finally {
  await prisma.$disconnect();
}
