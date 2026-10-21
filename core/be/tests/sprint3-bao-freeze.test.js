import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PERMISSIONS as P } from '@scms/shared';
import { prisma } from '../src/config/db.js';
import { api, apiPath, bearer } from './helpers/api.js';
import { createClassFixture, cleanupClassFixture, classPayload } from './helpers/sprint2.js';
import { activatePaidInvoice } from '../src/modules/membership/membership-invoice.service.js';
import { runMembershipLifecycle } from '../src/modules/notification/notification.job.js';
import { withScheduleTransaction } from '../src/common/utils/schedule-transaction.js';
import { finishFreeze } from '../src/modules/membership/membership-freeze.service.js';
import { vietnamDate, vietnamDay } from '../src/common/utils/vietnam-date.js';

const DAY = 86400000;
let f;
let item;
const call = (method, path, body, token = f.adminToken) =>
  api[method](apiPath(path)).set(bearer(token)).send(body);
const createClass = async (overrides = {}) => {
  const res = await call('post', '/classes', classPayload(f, overrides));
  expect(res.status).toBe(201);
  return res.body.data;
};

beforeAll(async () => {
  f = await createClassFixture();
  await prisma.rolePermission.create({
    data: {
      roleId: f.coach.roleId,
      permissionId: (await prisma.permission.findUnique({ where: { code: P.ATTENDANCE_RECORD } }))
        .id,
    },
  });
  item = await createClass({ capacity: 1 });
});
afterAll(async () => {
  if (!f) return;
  const classes = await prisma.gymClass.findMany({
    where: { subjectId: f.subject.id },
    select: { id: true },
  });
  const ids = classes.map((c) => c.id);
  await prisma.attendance.deleteMany({ where: { session: { classId: { in: ids } } } });
  await prisma.classWaitlist.deleteMany({ where: { classId: { in: ids } } });
  await prisma.roomMaintenance.deleteMany({
    where: { roomId: { in: [f.room.id, f.roomOther.id] } },
  });
  await prisma.checkIn.deleteMany({ where: { memberId: { in: f.userIds } } });
  await prisma.membershipFreeze.deleteMany({
    where: { membership: { userId: { in: f.userIds } } },
  });
  await prisma.auditLog.deleteMany({ where: { userId: f.admin.id, createdAt: { gte: started } } });
  await cleanupClassFixture(f);
});
const started = new Date();

describe('Sprint 3 Bảo: bảo lưu và job gói', () => {
  it('bảo lưu chặn check-in/đăng ký; gói người khác bị từ chối', async () => {
    const membership = await prisma.membership.findFirst({ where: { userId: f.member.id } });
    const dates = { from: vietnamDate(), to: vietnamDate(new Date(Date.now() + 7 * DAY)) };
    expect(
      (await call('post', `/memberships/${membership.id}/freezes`, dates, f.otherToken)).status,
    ).toBe(403);
    const res = await call('post', `/memberships/${membership.id}/freezes`, dates);
    expect(res.status).toBe(201);
    expect((await call('post', '/check-ins', { memberId: f.member.id })).status).toBe(422);
    expect(
      (await call('post', `/classes/${item.id}/enrollments/me`, {}, f.memberToken)).status,
    ).toBe(422);
    expect((await call('post', `/memberships/${membership.id}/freezes/resume`, {})).status).toBe(
      200,
    );
    expect((await prisma.membership.findUnique({ where: { id: membership.id } })).endDate).toEqual(
      membership.endDate,
    );
  });
  it('kết thúc sớm cộng đúng số ngày thực dừng và chỉ một lần', async () => {
    const membership = await prisma.membership.findFirst({ where: { userId: f.other.id } });
    const freeze = await prisma.membershipFreeze.create({
      data: {
        membershipId: membership.id,
        actorId: f.admin.id,
        startAt: new Date(vietnamDay().getTime() - 3 * DAY),
        endAt: new Date(vietnamDay().getTime() + 10 * DAY),
      },
    });
    await withScheduleTransaction((db) => finishFreeze(db, freeze, new Date()));
    const ended = await prisma.membershipFreeze.findUnique({ where: { id: freeze.id } });
    await withScheduleTransaction((db) => finishFreeze(db, ended, new Date()));
    expect(ended.creditedDays).toBe(3);
    expect(
      (await prisma.membership.findUnique({ where: { id: membership.id } })).endDate.getTime(),
    ).toBe(membership.endDate.getTime() + 3 * DAY);
  });
  it('job hết hạn và thông báo không trùng qua các lần chạy', async () => {
    const m = await prisma.membership.findFirst({ where: { userId: f.member.id } });
    await prisma.membership.update({
      where: { id: m.id },
      data: { endDate: new Date(Date.now() - DAY) },
    });
    await runMembershipLifecycle(new Date(), f.member.id);
    await runMembershipLifecycle(new Date(), f.member.id);
    expect((await prisma.membership.findUnique({ where: { id: m.id } })).status).toBe('EXPIRED');
    expect(
      await prisma.notification.count({
        where: { membershipId: m.id, kind: 'MEMBERSHIP_EXPIRED' },
      }),
    ).toBe(1);
    const res = await call('post', '/check-ins', { memberId: f.member.id });
    expect(res.status).toBe(201);
    expect(res.body.data.warning).toBeTruthy();
  });
  it('thanh toán ngay sau hết bảo lưu cộng ngày bảo lưu trước khi gia hạn, giữ cùng gói', async () => {
    const m = await prisma.membership.findFirst({ where: { userId: f.other.id } });
    const endDate = new Date(vietnamDay().getTime() - DAY);
    await prisma.membership.update({ where: { id: m.id }, data: { endDate } });
    const freeze = await prisma.membershipFreeze.create({
      data: {
        membershipId: m.id,
        actorId: f.admin.id,
        startAt: new Date(vietnamDay().getTime() - 10 * DAY),
        endAt: new Date(vietnamDay().getTime() - 3 * DAY),
      },
    });
    const invoice = await prisma.invoice.create({
      data: {
        code: `${f.prefix}_R`,
        userId: f.other.id,
        planId: f.plan.id,
        amount: 100,
        durationDays: 5,
        status: 'PAID',
        paidAt: new Date(),
        expiresAt: new Date(),
      },
      include: { plan: true },
    });
    const renewed = await withScheduleTransaction((db) =>
      activatePaidInvoice(invoice, new Date(), db),
    );
    expect(renewed.id).toBe(m.id);
    expect(renewed.endDate.getTime()).toBe(endDate.getTime() + 12 * DAY);
    expect(
      (await prisma.membershipFreeze.findUnique({ where: { id: freeze.id } })).creditedDays,
    ).toBe(7);
  });
});
