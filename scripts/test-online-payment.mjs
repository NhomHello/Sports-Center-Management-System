import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { writeFileSync } from 'node:fs';

process.loadEnvFile('core/be/.env');
process.env.NODE_ENV = 'test';
const { app } = await import('../core/be/src/app.js');
const { prisma } = await import('../core/be/src/config/db.js');
const { env } = await import('../core/be/src/config/env.js');
const server = app.listen(0, '127.0.0.1');
await new Promise((resolve) => server.once('listening', resolve));
const origin = `http://127.0.0.1:${server.address().port}${env.API_PREFIX}`;
const tag = randomUUID();
let memberId;
let invoiceId;
const transactionId = `http-online-test-${tag}`;
const request = async (method, path, body, token, headers = {}) => {
  const response = await fetch(`${origin}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...headers,
    },
    ...(body !== undefined && { body: JSON.stringify(body) }),
  });
  return { status: response.status, body: await response.json() };
};
try {
  const admin = await request('POST', '/auth/login', {
    email: env.SEED_ADMIN_EMAIL,
    password: env.SEED_ADMIN_PASSWORD,
  });
  assert.equal(admin.status, 200);
  const password = `${randomUUID()}@A1`;
  const email = `online-check-${tag}@scms.test`;
  const created = await request(
    'POST',
    '/members',
    {
      email,
      password,
      phone: `09${String(Date.now()).slice(-8)}`,
      fullName: `Kiểm thử QR ${tag.slice(0, 8)}`,
    },
    admin.body.data.accessToken,
  );
  assert.equal(created.status, 201, 'Test member must be created through the application API');
  memberId = created.body.data.id;
  const login = await request('POST', '/auth/login', { email, password });
  assert.equal(login.status, 200);
  const token = login.body.data.accessToken;
  const courses = await request('GET', '/classes?paidOnly=true&pageSize=100', undefined, token);
  assert.equal(courses.status, 200);
  let order;
  for (const course of courses.body.data) {
    const result = await request('POST', `/classes/${course.id}/orders`, {}, token);
    if (result.status === 201) {
      order = result;
      break;
    }
    assert.equal(result.status, 422, 'Unexpected checkout error');
  }
  assert.ok(order, 'A course with available seats is required');
  const invoice = order.body.data;
  invoiceId = invoice.id;
  assert.equal(invoice.channel, 'ONLINE');
  assert.equal(invoice.status, 'PENDING');
  const detail = await request('GET', `/invoices/${invoice.id}`, undefined, token);
  assert.equal(detail.status, 200);
  const instruction = detail.body.data.paymentInstruction;
  assert.ok(instruction?.qrUrl, 'Online checkout must provide a QR');
  assert.equal(instruction.content, invoice.code);
  assert.equal(instruction.amount, invoice.amount);
  const qr = await fetch(instruction.qrUrl, { signal: AbortSignal.timeout(15000) });
  assert.equal(qr.status, 200, 'SePay QR image must load');
  assert.ok(qr.headers.get('content-type')?.startsWith('image/'));
  writeFileSync('/tmp/swp-online-payment-qr.png', Buffer.from(await qr.arrayBuffer()));
  console.log(
    JSON.stringify({
      step: 'ONLINE_CHECKOUT',
      code: invoice.code,
      amount: invoice.amount,
      invoiceStatus: invoice.status,
      qrHttpStatus: qr.status,
    }),
  );
  const payload = {
    id: transactionId,
    gateway: 'ACB',
    transferType: 'in',
    transferAmount: invoice.amount,
    code: 'SEV12345',
    content: instruction.content,
  };
  const headers = { Authorization: `Apikey ${env.SEPAY_WEBHOOK_API_KEY}` };
  const webhook = await request('POST', '/payments/sepay/webhook', payload, null, headers);
  assert.equal(webhook.status, 200);
  assert.equal(webhook.body.success, true);
  assert.equal(webhook.body.data.outcome, 'PAID');
  const after = await request('GET', `/invoices/${invoice.id}`, undefined, token);
  assert.equal(after.body.data.status, 'PAID');
  const enrollment = await prisma.classEnrollment.findFirstOrThrow({
    where: { invoiceId, memberId },
  });
  assert.equal(enrollment.status, 'BOOKED');
  const repeat = await request('POST', '/payments/sepay/webhook', payload, null, headers);
  assert.equal(repeat.body.data.status, 'DUPLICATE');
  assert.equal(await prisma.payment.count({ where: { invoiceId } }), 1);
  console.log(
    JSON.stringify({
      step: 'SIMULATED_WEBHOOK',
      http: webhook.status,
      invoiceStatus: after.body.data.status,
      enrollmentStatus: enrollment.status,
      duplicate: repeat.body.data.status,
      paymentRows: 1,
    }),
  );
} finally {
  await prisma.paymentWebhookLog.deleteMany({ where: { providerTransactionId: transactionId } });
  if (memberId) {
    const where = { userId: memberId };
    await prisma.classEnrollment.deleteMany({ where: { memberId } });
    await prisma.notification.deleteMany({ where });
    await prisma.payment.deleteMany({ where: { invoice: where } });
    await prisma.invoice.deleteMany({ where });
    await prisma.auditLog.deleteMany({
      where: {
        OR: [
          where,
          { entity: 'User', entityId: String(memberId) },
          ...(invoiceId ? [{ entity: 'Invoice', entityId: String(invoiceId) }] : []),
        ],
      },
    });
    await prisma.user.delete({ where: { id: memberId } });
  }
  await new Promise((resolve) => server.close(resolve));
  await prisma.$disconnect();
  console.log(
    'Removed only the test member and its invoice/payment records; no bank transfer was made.',
  );
}
