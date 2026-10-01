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
    data: {
      code: `${fixture.prefix}_RULES`,
      name: `${fixture.prefix} Rules`,
      price: 200000,
      durationDays: 15,
    },
  });
});

afterAll(async () => cleanupSprintFixture(fixture));

describe('Sprint 1: vòng đời membership và hóa đơn', () => {
  it('không cho kích hoạt membership trực tiếp, bắt buộc đi qua hóa đơn PAID', async () => {
    const bypass = await api
      .post(apiPath('/memberships/purchase'))
      .set(bearer(fixture.adminToken))
      .send({ memberId: fixture.member.id, planId: plan.id, paidAt: new Date() });
    expect(bypass.status).toBe(404);
    expect(await prisma.membership.count({ where: { userId: fixture.member.id } })).toBe(0);
  });

  it('PENDING hết hạn thành FAILED; gói có hóa đơn chỉ được ngừng bán', async () => {
    const createOrder = () =>
      api
        .post(apiPath('/memberships/orders'))
        .set(bearer(fixture.adminToken))
        .send({ memberId: fixture.member.id, planId: plan.id });
    const first = await createOrder();
    await prisma.invoice.update({
      where: { id: first.body.data.id },
      data: { expiresAt: new Date(Date.now() - TIME.MS_PER_MINUTE) },
    });
    const replacement = await createOrder();
    expect(replacement.status).toBe(201);
    expect(replacement.body.data.id).not.toBe(first.body.data.id);
    expect(
      (await prisma.invoice.findUniqueOrThrow({ where: { id: first.body.data.id } })).status,
    ).toBe(Enums.InvoiceStatus.FAILED);

    const removed = await api
      .delete(apiPath(`/membership-plans/${plan.id}`))
      .set(bearer(fixture.adminToken));
    expect(removed.status).toBe(200);
    expect(removed.body.data).toMatchObject({
      status: Enums.MembershipPlanStatus.STOPPED,
      isActive: false,
    });
    const audits = await prisma.auditLog.findMany({
      where: {
        entity: 'Invoice',
        entityId: { in: [String(first.body.data.id), String(replacement.body.data.id)] },
      },
      select: { id: true },
    });
    fixture.auditIds.push(...audits.map(({ id }) => id));
  });
});
