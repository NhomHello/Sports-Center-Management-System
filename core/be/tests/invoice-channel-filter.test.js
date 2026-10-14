import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Enums, prisma } from '../src/config/db.js';
import { api, apiPath, bearer } from './helpers/api.js';
import { cleanupSprintFixture, createSprintFixture } from './helpers/sprint1.js';

let fixture;
let plan;
let counter;
let online;

beforeAll(async () => {
  fixture = await createSprintFixture();
  plan = await prisma.membershipPlan.create({
    data: { code: fixture.prefix, name: fixture.prefix, price: 200000, durationDays: 30 },
  });
  const other = await prisma.membershipPlan.create({
    data: {
      code: `${fixture.prefix}_B`,
      name: `${fixture.prefix}_B`,
      price: 300000,
      durationDays: 30,
    },
  });
  online = (
    await api
      .post(apiPath('/memberships/me/orders'))
      .set(bearer(fixture.memberToken))
      .send({ planId: plan.id })
  ).body.data;
  counter = (
    await api
      .post(apiPath('/memberships/orders'))
      .set(bearer(fixture.adminToken))
      .send({ memberId: fixture.member.id, planId: other.id })
  ).body.data;
  fixture.extraPlanId = other.id;
});
afterAll(async () => {
  await cleanupSprintFixture(fixture);
  await prisma.membershipPlan.deleteMany({ where: { id: { in: [plan.id, fixture.extraPlanId] } } });
});

const list = (query) =>
  api
    .get(apiPath('/invoices'))
    .query({ memberId: fixture.member.id, ...query })
    .set(bearer(fixture.adminToken));

describe('lọc hoá đơn theo kênh', () => {
  it('chỉ trả hoá đơn tại quầy hoặc chỉ online theo tham số channel', async () => {
    const counterOnly = await list({ channel: Enums.InvoiceChannel.COUNTER });
    expect(counterOnly.body.data.map((item) => item.id)).toEqual([counter.id]);
    const onlineOnly = await list({ channel: Enums.InvoiceChannel.ONLINE });
    expect(onlineOnly.body.data.map((item) => item.id)).toEqual([online.id]);
    expect((await list({})).body.data).toHaveLength(2);
  });

  it('từ chối giá trị kênh không hợp lệ', async () => {
    expect((await list({ channel: 'ATM' })).status).toBe(400);
  });
});
