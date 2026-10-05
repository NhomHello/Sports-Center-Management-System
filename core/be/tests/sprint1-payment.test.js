import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Enums, prisma } from '../src/config/db.js';
import { TIME } from '../src/constants/index.js';
import { api, apiPath, bearer } from './helpers/api.js';
import { cleanupSprintFixture, createSprintFixture } from './helpers/sprint1.js';

let fixture;
let plan;
beforeAll(async () => {
  fixture = await createSprintFixture();
  plan = await prisma.membershipPlan.create({
    data: { code: fixture.prefix, name: fixture.prefix, price: 300000, durationDays: 30 },
  });
});
afterAll(async () => {
  await cleanupSprintFixture(fixture);
});
const createOrder = (memberId = fixture.member.id) =>
  api
    .post(apiPath('/memberships/orders'))
    .set(bearer(fixture.adminToken))
    .send({ memberId, planId: plan.id });
const collectCash = (id) =>
  api
    .post(apiPath(`/payments/invoices/${id}/cash`))
    .set(bearer(fixture.adminToken))
    .send({});

describe('Sprint 1: hóa đơn và thanh toán tại quầy', () => {
  it('tạo lặp tái sử dụng PENDING; chưa thanh toán không tạo membership', async () => {
    const [first, second] = await Promise.all([createOrder(), createOrder()]);
    expect(first.status).toBe(201);
    expect(second.status).toBe(201);
    expect(first.body.data.id).toBe(second.body.data.id);
    expect(first.body.data.amount).toBe(plan.price);
    expect(first.body.data.planName).toBe(plan.name);
    expect(first.body.data.status).toBe(Enums.InvoiceStatus.PENDING);
    expect(await prisma.membership.count({ where: { userId: fixture.member.id } })).toBe(0);
  });

  it('hội viên tự tạo yêu cầu mua cho chính mình, không thể chèn memberId khác', async () => {
    const own = await api
      .post(apiPath('/memberships/me/orders'))
      .set(bearer(fixture.otherToken))
      .send({ planId: plan.id });
    expect(own.status).toBe(201);
    expect(own.body.data.userId).toBe(fixture.other.id);
    expect(own.body.data.status).toBe(Enums.InvoiceStatus.PENDING);
    const tampered = await api
      .post(apiPath('/memberships/me/orders'))
      .set(bearer(fixture.otherToken))
      .send({ planId: plan.id, memberId: fixture.member.id });
    expect(tampered.status).toBe(400);
  });

  it('từ chối số tiền client tự sửa và người không có quyền thu', async () => {
    const order = await createOrder();
    const id = order.body.data.id;
    const tampered = await api
      .post(apiPath(`/payments/invoices/${id}/cash`))
      .set(bearer(fixture.adminToken))
      .send({ amount: 1 });
    expect(tampered.status).toBe(400);
    const unauthorized = await api
      .post(apiPath(`/payments/invoices/${id}/cash`))
      .set(bearer(fixture.memberToken))
      .send({});
    expect(unauthorized.status).toBe(403);
    expect(await prisma.payment.count({ where: { invoiceId: id } })).toBe(0);
  });

  it('thu đồng thời/lặp chỉ ghi một payment và kích hoạt một lần; giá/thời hạn gốc được giữ', async () => {
    const order = await createOrder();
    const id = order.body.data.id;
    await prisma.membershipPlan.update({
      where: { id: plan.id },
      data: { price: 600000, durationDays: 60 },
    });
    const results = await Promise.all([collectCash(id), collectCash(id)]);
    expect(results.map((item) => item.status)).toEqual([200, 200]);
    const paid = results[0].body.data;
    expect(paid.status).toBe(Enums.InvoiceStatus.PAID);
    expect(paid.payments).toHaveLength(1);
    expect(paid.payments[0].receivedAmount).toBe(300000);
    expect(new Date(paid.membership.endDate) - new Date(paid.membership.startDate)).toBe(
      30 * TIME.MS_PER_DAY,
    );
    expect(
      await prisma.membership.count({
        where: { userId: fixture.member.id, status: Enums.MembershipStatus.ACTIVE },
      }),
    ).toBe(1);
    const members = await api
      .get(apiPath(`/members?search=${encodeURIComponent(fixture.member.email)}`))
      .set(bearer(fixture.adminToken));
    expect(members.status).toBe(200);
    expect(members.body.data[0].currentMembership.id).toBe(paid.membership.id);
    const detail = await api
      .get(apiPath(`/members/${fixture.member.id}`))
      .set(bearer(fixture.adminToken));
    expect(detail.body.data.currentMembership.id).toBe(paid.membership.id);
    expect((await collectCash(id)).status).toBe(200);
    expect(await prisma.payment.count({ where: { invoiceId: id } })).toBe(1);
    const audit = await prisma.auditLog.findFirst({
      where: { entity: 'Invoice', entityId: String(id), action: 'UPDATE' },
    });
    fixture.auditIds.push(audit.id);
    expect(audit.meta.paymentId).toBe(paid.payments[0].id);
  });

  it('gia hạn còn hiệu lực cộng từ ngày hết hạn; không phát sinh membership ACTIVE thứ hai', async () => {
    const before = await prisma.membership.findFirstOrThrow({
      where: { userId: fixture.member.id, status: Enums.MembershipStatus.ACTIVE },
    });
    const order = await createOrder();
    const paid = await collectCash(order.body.data.id);
    expect(paid.status).toBe(200);
    expect(paid.body.data.membership.id).toBe(before.id);
    expect(new Date(paid.body.data.membership.endDate) - before.endDate).toBe(60 * TIME.MS_PER_DAY);
    expect(new Date(paid.body.data.membership.startDate).getTime()).toBe(
      before.startDate.getTime(),
    );
  });

  it('gói hết hạn được giữ trong lịch sử; gói mới bắt đầu tại thời điểm thu', async () => {
    const old = await prisma.membership.create({
      data: {
        userId: fixture.other.id,
        planId: plan.id,
        status: Enums.MembershipStatus.ACTIVE,
        activeUserId: fixture.other.id,
        startDate: new Date(Date.now() - 40 * TIME.MS_PER_DAY),
        endDate: new Date(Date.now() - TIME.MS_PER_DAY),
      },
    });
    const order = await createOrder(fixture.other.id);
    const paid = await collectCash(order.body.data.id);
    expect(paid.status).toBe(200);
    expect(paid.body.data.membership.id).not.toBe(old.id);
    expect(paid.body.data.membership.startDate).toBe(paid.body.data.paidAt);
    expect((await prisma.membership.findUniqueOrThrow({ where: { id: old.id } })).status).toBe(
      Enums.MembershipStatus.EXPIRED,
    );
  });

  it('hội viên chỉ xem hóa đơn của mình; detail có trung tâm dù không có setting.read', async () => {
    const own = await api
      .get(apiPath(`/invoices/me?memberId=${fixture.other.id}`))
      .set(bearer(fixture.memberToken));
    expect(own.status).toBe(200);
    expect(own.body.data.every((invoice) => invoice.userId === fixture.member.id)).toBe(true);
    const id = own.body.data[0].id;
    const detail = await api.get(apiPath(`/invoices/${id}`)).set(bearer(fixture.memberToken));
    expect(detail.status).toBe(200);
    expect(detail.body.data.centerInfo.name).toBeTypeOf('string');
    expect(detail.body.data.payments[0].actor.fullName).toBeTypeOf('string');
    expect((await api.get(apiPath('/settings')).set(bearer(fixture.memberToken))).status).toBe(403);
    expect((await api.get(apiPath(`/invoices/${id}`)).set(bearer(fixture.otherToken))).status).toBe(
      404,
    );
    expect((await api.get(apiPath('/invoices')).set(bearer(fixture.memberToken))).status).toBe(403);
  });

  it('gói ngừng bán, hóa đơn FAILED hoặc ONLINE không được thu tiền mặt', async () => {
    await prisma.membershipPlan.update({ where: { id: plan.id }, data: { isActive: false } });
    expect((await createOrder()).status).toBe(422);
    await prisma.membershipPlan.update({ where: { id: plan.id }, data: { isActive: true } });
    const order = await createOrder();
    await prisma.invoice.update({
      where: { id: order.body.data.id },
      data: { status: Enums.InvoiceStatus.FAILED },
    });
    expect((await collectCash(order.body.data.id)).status).toBe(409);
    const online = await createOrder();
    await prisma.invoice.update({
      where: { id: online.body.data.id },
      data: { channel: Enums.InvoiceChannel.ONLINE },
    });
    expect((await collectCash(online.body.data.id)).status).toBe(422);
  });
});
