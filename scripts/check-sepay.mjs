/** Read-only local delivery diagnostics; never prints API keys or receiving account numbers. */
process.loadEnvFile('core/be/.env');
const { env } = await import('../core/be/src/config/env.js');
const { prisma } = await import('../core/be/src/config/db.js');
const { SETTING_KEYS } = await import('@scms/shared');
const { HEALTH_PATH } = await import('../core/be/src/constants/index.js');
try {
  const health = await fetch(`http://127.0.0.1:${env.PORT}${HEALTH_PATH}`, {
    signal: AbortSignal.timeout(3000),
  })
    .then((response) => response.status)
    .catch(() => 'UNREACHABLE');
  const keys = [
    SETTING_KEYS.PAYMENT_BANK_CODE,
    SETTING_KEYS.PAYMENT_ACCOUNT_NUMBER,
    SETTING_KEYS.INVOICE_CODE_PREFIX,
  ];
  const settings = await prisma.systemSetting.findMany({ where: { key: { in: keys } } });
  const latest = await prisma.paymentWebhookLog.findFirst({
    orderBy: { createdAt: 'desc' },
    select: { createdAt: true, status: true },
  });
  console.log(
    JSON.stringify(
      {
        localBackendHealth: health,
        callbackPath: `${env.API_PREFIX}/payments/sepay/webhook`,
        webhookApiKeyConfigured: Boolean(env.SEPAY_WEBHOOK_API_KEY),
        syncApiTokenConfigured: Boolean(env.SEPAY_API_TOKEN),
        receivingSettings: Object.fromEntries(
          keys.map((key) => [key, Boolean(settings.find((row) => row.key === key)?.value.trim())]),
        ),
        latestLocalWebhook: latest,
        note: 'Local checks cannot verify the public URL or SePay dashboard delivery settings.',
      },
      null,
      2,
    ),
  );
} finally {
  await prisma.$disconnect();
}
