import { beforeAll, afterAll, describe, it, expect } from 'vitest';
import { api, apiPath, bearer } from './helpers/api.js';
import {
  createReconciliationFixture,
  cleanupReconciliationFixture,
  buyOnline,
  sendTransfer,
} from './helpers/reconciliation.js';
let f;
let invoice;
beforeAll(async () => {
  f = await createReconciliationFixture();
  invoice = await buyOnline(f);
  await sendTransfer(f, invoice);
});
afterAll(() => cleanupReconciliationFixture(f));
const get = (path, token = f.memberToken, query = {}) =>
  api.get(apiPath(path)).set(bearer(token)).query(query);
describe('Sprint 3 Khải: history, receipt and identity', () => {
  it('TC-S3-KAPI-01: own payment history ignores another memberId', async () => {
    const res = await get('/payments/me', f.otherToken, { memberId: f.member.id });
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
    const own = await get('/payments/me', f.memberToken);
    expect(own.body.data.some((row) => row.invoice.id === invoice.id)).toBe(true);
  });
  it('TC-S3-KAPI-02: own permission cannot open all payment history', async () => {
    expect((await get('/payments')).status).toBe(403);
    const res = await get('/payments', f.adminToken, { memberId: f.member.id });
    expect(res.body.meta.total).toBe(1);
  });
  it('TC-S3-KAPI-03: PAID owner can download PDF, another owner cannot', async () => {
    const res = await get(`/invoices/${invoice.id}/receipt.pdf`);
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('application/pdf');
    expect(Buffer.isBuffer(res.body)).toBe(true);
    expect(res.body.subarray(0, 4).toString()).toBe('%PDF');
    expect((await get(`/invoices/${invoice.id}/receipt.pdf`, f.otherToken)).status).toBe(404);
  });
  it('TC-S3-KAPI-04: unpaid invoices cannot be exported', async () => {
    const pending = await buyOnline(f, f.otherToken);
    expect((await get(`/invoices/${pending.id}/receipt.pdf`, f.otherToken)).status).toBe(422);
  });
  it('TC-S3-KAPI-05: duplicate response is masked and never contains credentials', async () => {
    const res = await api
      .post(apiPath('/members'))
      .set(bearer(f.adminToken))
      .send({
        fullName: 'TEST duplicate',
        email: f.member.email,
        phone: '0909999999',
        password: f.password,
      });
    expect(res.status).toBe(409);
    expect(res.body.details.duplicates[0].id).toBe(f.member.id);
    expect(JSON.stringify(res.body)).not.toContain('passwordHash');
  });
  it('TC-S3-KAPI-06: member filters run before pagination', async () => {
    const res = await get('/members', f.adminToken, {
      search: f.prefix,
      membershipFilter: 'NO_PLAN',
      pageSize: 1,
    });
    expect(res.status).toBe(200);
    expect(res.body.meta.total).toBe(1);
    expect(res.body.data[0].id).toBe(f.other.id);
  });
});
