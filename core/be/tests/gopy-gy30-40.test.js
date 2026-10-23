import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { prisma } from '../src/config/db.js';
import { vietnamDate, vietnamDay } from '../src/common/utils/vietnam-date.js';
import { runMembershipLifecycle } from '../src/modules/notification/notification.job.js';
import { classPayload } from './helpers/sprint2.js';
import {
  buyCourseCash,
  cleanupGopyFixture,
  createGopyFixture,
  createPaidClass,
} from './helpers/gopy.js';

const DAY = 86400000;
const HOUR = 3600000;

let f;

beforeAll(async () => {
  f = await createGopyFixture();
});

afterAll(() => cleanupGopyFixture(f));

const firstSession = (classId) =>
  prisma.classSession.findFirstOrThrow({
    where: { classId },
    orderBy: { startAt: 'asc' },
  });

describe('GY-30: báo nghỉ một buổi', () => {
  it('trước hạn ghi Xin nghỉ, điểm danh vắng không ghi đè; quá hạn bị từ chối', async () => {
    const item = (await f.call('post', '/classes', classPayload(f))).body.data;

    expect(
      (await f.call('post', `/classes/${item.id}/enrollments/me`, {}, f.memberToken)).status,
    ).toBe(201);

    const session = await firstSession(item.id);
    const res = await f.call('post', `/classes/sessions/${session.id}/excuse`, {}, f.memberToken);

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({
      status: 'EXCUSED',
      memberId: f.member.id,
    });

    // Điểm danh khi buổi đang diễn ra để kiểm tra việc giữ trạng thái xin nghỉ.
    const now = Date.now();
    await prisma.classSession.update({
      where: { id: session.id },
      data: {
        startAt: new Date(now - HOUR),
        endAt: new Date(now + HOUR),
      },
    });
    const record = await f.call('put', `/classes/sessions/${session.id}/attendance`, {
      entries: [{ memberId: f.member.id, status: 'ABSENT' }],
    });

    expect(record.status).toBe(200);

    const kept = await prisma.attendance.findUniqueOrThrow({
      where: {
        sessionId_memberId: {
          sessionId: session.id,
          memberId: f.member.id,
        },
      },
    });

    expect(kept.status).toBe('EXCUSED');

    const soon = await prisma.classSession.findFirstOrThrow({
      where: { classId: item.id, id: { not: session.id } },
    });

    await prisma.classSession.update({
      where: { id: soon.id },
      data: {
        startAt: new Date(Date.now() + HOUR),
        endAt: new Date(Date.now() + 2 * HOUR),
      },
    });

    const late = await f.call('post', `/classes/sessions/${soon.id}/excuse`, {}, f.memberToken);

    expect(late.status).toBe(422);
    expect(late.body.message).toContain('quá hạn báo nghỉ');
  });
});

describe('GY-40: bảo lưu tổng tối đa 60 ngày, trạng thái thật, tự mở lại', () => {
  it('vượt ngân sách bị từ chối; đủ ngân sách thì tạo được; chi tiết kỳ báo ngày còn lại', async () => {
    const period = await prisma.membership.findFirstOrThrow({
      where: { userId: f.member.id },
    });

    await prisma.membershipFreeze.create({
      data: {
        membershipId: period.id,
        actorId: f.admin.id,
        startAt: new Date(vietnamDay().getTime() - 60 * DAY),
        endAt: new Date(vietnamDay().getTime() - 10 * DAY),
        endedAt: new Date(vietnamDay().getTime() - 10 * DAY),
        creditedDays: 50,
      },
    });

    const detail = await f.call('get', `/memberships/${period.id}`, undefined, f.memberToken);

    expect(detail.body.data).toMatchObject({
      freezeDaysUsed: 50,
      freezeDaysLeft: 10,
    });

    const from = vietnamDate(new Date(Date.now() + DAY));
    const tooLong = await f.call('post', `/memberships/${period.id}/freezes`, {
      from,
      to: vietnamDate(new Date(Date.now() + 12 * DAY)),
    });

    expect(tooLong.status).toBe(422);

    const ok = await f.call('post', `/memberships/${period.id}/freezes`, {
      from,
      to: vietnamDate(new Date(Date.now() + 11 * DAY)),
    });

    expect(ok.status).toBe(201);
  });

  it('job mở lại bảo lưu đã hết hạn, cộng bù đúng ngày và báo hội viên', async () => {
    const period = await prisma.membership.findFirstOrThrow({
      where: { userId: f.member.id },
    });

    await prisma.membershipFreeze.deleteMany({
      where: { membershipId: period.id, endedAt: null },
    });

    const freeze = await prisma.membershipFreeze.create({
      data: {
        membershipId: period.id,
        actorId: f.admin.id,
        startAt: new Date(vietnamDay().getTime() - 9 * DAY),
        endAt: vietnamDay(),
      },
    });

    await prisma.membership.update({
      where: { id: period.id },
      data: { status: 'FROZEN' },
    });

    await runMembershipLifecycle(new Date(), f.member.id);

    const after = await prisma.membership.findUniqueOrThrow({
      where: { id: period.id },
    });

    expect(after.status).toBe('ACTIVE');
    expect(after.endDate.getTime() - period.endDate.getTime()).toBe(9 * DAY);
    expect(
      (await prisma.membershipFreeze.findUnique({ where: { id: freeze.id } })).creditedDays,
    ).toBe(9);
    expect(
      await prisma.notification.count({
        where: { dedupeKey: `freeze-resume:${freeze.id}` },
      }),
    ).toBe(1);
  });
});

describe('Trung tâm hủy buổi của khóa đã thanh toán', () => {
  it('ghi số dư giá trị một buổi cho học viên', async () => {
    const item = await createPaidClass(f, {
      price: 1200000,
      roomId: f.roomOther.id,
      coachId: f.coachOther.id,
    });

    await buyCourseCash(f, item.id, f.other.id);

    const before = (await prisma.user.findUniqueOrThrow({ where: { id: f.other.id } }))
      .creditBalance;

    const session = await firstSession(item.id);
    const res = await f.call('post', `/classes/sessions/${session.id}/cancellation`, {
      reason: 'HLV ốm',
    });

    expect(res.status).toBe(200);

    const after = (await prisma.user.findUniqueOrThrow({ where: { id: f.other.id } }))
      .creditBalance;

    expect(after - before).toBe(Math.round(1200000 / item.totalSessions / 1000) * 1000);
  });
});
