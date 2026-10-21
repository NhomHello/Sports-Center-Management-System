import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import ExcelJS from 'exceljs';
import { prisma } from '../src/config/db.js';
import { api, apiPath, bearer } from './helpers/api.js';
import { createSprintFixture, cleanupSprintFixture } from './helpers/sprint1.js';
let f;
let plan;
const q = { from: '2026-10-01', to: '2026-10-01' };
const path = (suffix) => apiPath(`/reports/${suffix}`);
beforeAll(async () => {
  f = await createSprintFixture();
  plan = await prisma.membershipPlan.create({
    data: { code: f.prefix, name: f.prefix, price: 1000, durationDays: 30 },
  });
  const paid = await prisma.invoice.create({
    data: {
      code: f.prefix,
      userId: f.member.id,
      planId: plan.id,
      amount: 1000,
      status: 'REFUNDED',
      paidAt: new Date('2026-09-30T17:30:00Z'),
      expiresAt: new Date(),
    },
  });
  await prisma.refund.create({
    data: {
      invoiceId: paid.id,
      amount: 250,
      reason: 'Kiểm thử hoàn một phần',
      status: 'DONE',
      requestedById: 1,
      completedAt: new Date('2026-10-01T16:59:59Z'),
    },
  });
  await prisma.invoice.createMany({
    data: [
      {
        code: `${f.prefix}_outside`,
        userId: f.member.id,
        planId: plan.id,
        amount: 9999,
        status: 'PAID',
        paidAt: new Date('2026-10-01T17:00:00Z'),
        expiresAt: new Date(),
      },
      {
        code: `${f.prefix}_pending`,
        userId: f.member.id,
        planId: plan.id,
        amount: 9999,
        status: 'PENDING',
        expiresAt: new Date(),
      },
    ],
  });
});
afterAll(async () => cleanupSprintFixture(f));

describe('Báo cáo và tệp xuất cùng dữ liệu', () => {
  it('report.view bắt buộc, ngày Việt Nam và net trừ hoàn thực tế', async () => {
    expect((await api.get(path('dashboard')).set(bearer(f.memberToken)).query(q)).status).toBe(403);
    const res = await api
      .get(path('dashboard'))
      .set(bearer(f.adminToken))
      .query({ ...q, memberId: f.member.id, planId: plan.id });
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({
      revenue: 1000,
      refunded: 250,
      net: 750,
      paidCount: 1,
      refundCount: 1,
    });
    expect(res.body.data.rows).toHaveLength(1);
    expect(res.body.data.rows[0].date).toBe('2026-10-01');
  });
  it('từ chối khoảng ngày ngược, format sai và số tiền tự gửi', async () => {
    for (const query of [
      { from: q.to, to: '2026-09-30' },
      { ...q, amount: 1 },
    ]) {
      expect((await api.get(path('dashboard')).set(bearer(f.adminToken)).query(query)).status).toBe(
        400,
      );
    }
    expect(
      (
        await api
          .get(path('export'))
          .set(bearer(f.adminToken))
          .query({ ...q, format: 'html' })
      ).status,
    ).toBe(400);
  });
  it('CSV và Excel chứa đúng tổng số như dashboard, PDF tải được', async () => {
    const filters = { ...q, memberId: f.member.id, planId: plan.id };
    const csv = await api
      .get(path('export'))
      .set(bearer(f.adminToken))
      .query({ ...filters, format: 'csv' });
    expect(csv.status).toBe(200);
    expect(csv.text).toContain('"2026-10-01","1000","250","750","1","1"');
    const binary = (res, callback) => {
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => callback(null, Buffer.concat(chunks)));
    };
    const xlsx = await api
      .get(path('export'))
      .set(bearer(f.adminToken))
      .query({ ...filters, format: 'xlsx' })
      .buffer(true)
      .parse(binary);
    expect(xlsx.status).toBe(200);
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(xlsx.body);
    expect(workbook.worksheets[1].getRow(2).values.slice(1)).toEqual([
      '2026-10-01',
      1000,
      250,
      750,
      1,
      1,
    ]);
    const pdf = await api
      .get(path('export'))
      .set(bearer(f.adminToken))
      .query({ ...filters, format: 'pdf' })
      .buffer(true)
      .parse(binary);
    expect(pdf.status).toBe(200);
    expect(pdf.body.subarray(0, 5).toString()).toBe('%PDF-');
  });
});
