import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { prisma } from '../src/config/db.js';
import { api, apiPath, bearer } from './helpers/api.js';
import { createGopyFixture, cleanupGopyFixture, createPaidClass } from './helpers/gopy.js';
let f; let course;
const order = () => f.call('post', `/classes/${course.id}/orders`, { memberId: f.member.id });
const cash = (id, token = f.adminToken, data = {}) => api.post(apiPath(`/payments/invoices/${id}/cash`)).set(bearer(token)).send(data);
beforeAll(async () => { f = await createGopyFixture(); course = await createPaidClass(f, { price: 300000 }); });
afterAll(() => cleanupGopyFixture(f));
describe('TC-COURSE-CASH: hóa đơn khóa học tại quầy', () => {
  it('TC-COURSE-CASH-01: tạo đồng thời tái sử dụng một PENDING, giữ chỗ và chưa chính thức', async () => {
    const res = await Promise.all([order(), order()]);
    expect(res.every((r) => r.status === 201)).toBe(true); expect(res[0].body.data.id).toBe(res[1].body.data.id);
    expect(res[0].body.data).toMatchObject({ kind: 'COURSE', amount: 300000, status: 'PENDING' });
    expect(await prisma.classEnrollment.count({ where: { classId: course.id, status: 'BOOKED' } })).toBe(0);
  });
  it('TC-COURSE-CASH-02: giá client và người không có quyền thu bị từ chối', async () => {
    const invoice = (await order()).body.data;
    expect((await cash(invoice.id, f.adminToken, { amount: 1 })).status).toBe(400);
    expect((await cash(invoice.id, f.memberToken)).status).toBe(403);
  });
  it('TC-COURSE-CASH-03: thu lặp đồng thời chỉ có một payment, giữ giá snapshot khi khóa thay giá', async () => {
    const invoice = (await order()).body.data;
    await prisma.gymClass.update({ where: { id: course.id }, data: { price: 600000 } });
    const results = await Promise.all([cash(invoice.id), cash(invoice.id)]);
    expect(results.every((r) => r.status === 200)).toBe(true);
    expect(await prisma.payment.count({ where: { invoiceId: invoice.id } })).toBe(1);
    expect(results[0].body.data.amount).toBe(300000);
    expect(await prisma.classEnrollment.count({ where: { invoiceId: invoice.id, status: 'BOOKED' } })).toBe(1);
  });
  it('TC-COURSE-CASH-04: người mua không thể đăng ký hộ hoặc chèn giá vào hóa đơn', async () => {
    expect((await f.call('post', `/classes/${course.id}/orders`, { memberId: f.other.id }, f.memberToken)).status).toBe(403);
    expect((await f.call('post', `/classes/${course.id}/orders`, { amount: 1 }, f.otherToken)).status).toBe(400);
  });
});
