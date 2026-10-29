import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { prisma } from '../src/config/db.js';
import { api, apiPath, bearer } from './helpers/api.js';
import { createSprintFixture, cleanupSprintFixture } from './helpers/sprint1.js';
import { bucketRanges, periodKey, previousRange } from '../src/modules/report/report-periods.js';
let f;
let plan;
const get = (suffix, query, token = f.adminToken) => api.get(apiPath(`/reports/${suffix}`)).set(bearer(token)).query(query);
const filters = () => ({ from: '2026-10-01', to: '2026-10-31', groupBy: 'month', compare: 'previous', memberId: f.member.id });
beforeAll(async () => {
  f = await createSprintFixture();
  plan = await prisma.membershipPlan.create({ data: { code: f.prefix, name: f.prefix, price: 1000, durationDays: 30 } });
  const make = (code, kind, amount, paidAt) => prisma.invoice.create({ data: { code, kind, amount, paidAt: new Date(paidAt), expiresAt: new Date(),
    userId: f.member.id, planId: kind === 'COURSE' ? null : plan.id, status: 'PAID' } });
  const current = await make(`${f.prefix}_a`, 'MEMBERSHIP', 1000, '2026-10-01T00:00:00Z');
  const prior = await make(`${f.prefix}_b`, 'MEMBERSHIP', 500, '2026-09-15T00:00:00Z');
  await make(`${f.prefix}_c`, 'ADJUSTMENT', 200, '2026-10-05T00:00:00Z');
  await prisma.payment.create({ data: { invoiceId: current.id, provider: 'CREDIT', requestedAmount: 1000, receivedAmount: 300, paidAt: new Date('2026-10-01T00:00:00Z') } });
  await prisma.refund.create({ data: { invoiceId: prior.id, amount: 100, reason: 'Kiểm thử', status: 'DONE', requestedById: f.member.id, completedAt: new Date('2026-10-08T00:00:00Z') } });
});
afterAll(async () => cleanupSprintFixture(f));

describe('S4-22/24/26/28 báo cáo thời gian', () => {
  it('TC-S4-REPORT-01: biên ngày Việt Nam, tuần thứ Hai, quý/năm và kỳ trước qua năm nhuận', () => {
    expect(periodKey(new Date('2026-12-31T17:00:00Z'), 'year')).toBe('2027');
    expect(periodKey('2027-01-01', 'week')).toBe('2026-12-28');
    expect(periodKey('2026-10-01', 'quarter')).toBe('2026-Q4');
    expect(previousRange({ from: '2024-03-01', to: '2024-03-01' })).toMatchObject({ from: '2024-02-29', to: '2024-02-29' });
    expect(bucketRanges({ from: '2026-10-15', to: '2026-11-02', groupBy: 'month' }).map((r) => [r.key, r.start.toISOString(), r.end.toISOString()])).toEqual([
      ['2026-10', '2026-10-14T17:00:00.000Z', '2026-10-31T17:00:00.000Z'], ['2026-11', '2026-10-31T17:00:00.000Z', '2026-11-02T17:00:00.000Z'],
    ]);
  });
  it('TC-S4-REPORT-02: CREDIT không tính lại, ADJUSTMENT riêng; mọi chiều cơ cấu bằng net', async () => {
    const res = await get('dashboard', filters()); expect(res.status).toBe(200);
    const data = res.body.data; expect(data).toMatchObject({ revenue: 900, refunded: 100, net: 800 });
    expect(data.rows).toHaveLength(1); expect(data.rows[0].date).toBe('2026-10');
    expect(data.comparison.previous.revenue).toBe(500);
    for (const rows of Object.values(data.breakdown)) expect(rows.reduce((sum, row) => sum + row.net, 0)).toBe(data.net);
    expect(data.breakdown.byKind.find((r) => r.id === 'ADJUSTMENT').net).toBe(200);
    expect(data.breakdown.byPlan.find((r) => r.id === String(plan.id)).net).toBe(600);
  });
  it('TC-S4-REPORT-03: kỳ trước 0 trả null, lấp 0 các kỳ rỗng', async () => {
    const res = await get('dashboard', { ...filters(), from: '2026-12-01', to: '2026-12-03', groupBy: 'day' });
    expect(res.status).toBe(200); expect(res.body.data.rows).toHaveLength(3);
    expect(res.body.data.comparison.percent.net).toBeNull();
  });
  it('TC-S4-REPORT-04: giới hạn theo nhóm từ DB và RBAC không phụ thuộc client', async () => {
    expect((await get('dashboard', { ...filters(), from: '2020-01-01', to: '2026-01-01', groupBy: 'year' })).status).toBe(400);
    expect((await get('dashboard', { ...filters(), from: '2026-01-01', to: '2026-05-01', groupBy: 'day' })).status).toBe(400);
    expect((await get('dashboard', filters(), f.memberToken)).status).toBe(403);
    expect((await get('dashboard', { ...filters(), groupBy: 'invalid' })).status).toBe(400);
  });
  it('TC-S4-REPORT-05: xuất giữ nhóm kỳ, so sánh và cơ cấu; tab hội viên dùng cùng bucket', async () => {
    const csv = await get('export', { ...filters(), format: 'csv' }); expect(csv.status).toBe(200);
    expect(csv.text).toContain('"2026-10","900","100","800"'); expect(csv.text).toContain('Thuần kỳ trước'); expect(csv.text).toContain('byKind: Chênh lệch đổi');
    const members = await get('members', filters()); expect(members.status).toBe(200); expect(members.body.data.rows[0].date).toBe('2026-10');
    const file = await get('members/export', { ...filters(), format: 'xlsx' }); expect(file.status).toBe(200);
  });
});
