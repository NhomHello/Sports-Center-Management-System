import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { SETTING_KEYS as K } from '@scms/shared';
import { prisma } from '../src/config/db.js';
import { createProfileFixture, cleanupProfileFixture } from './helpers/profiles.js';
let f;
const DAY = 86400000;
const call = (method, path, body, token) => f.call(method, path, body, token);
beforeAll(async () => {
  f = await createProfileFixture();
});
afterAll(async () => {
  await cleanupProfileFixture(f);
});
describe('UC-UM-24/25: chia sẻ hồ sơ và giới hạn phân công', () => {
  it('chính chủ cập nhật, nhân viên sửa hộ có audit, người khác không được chọn userId', async () => {
    expect(
      (
        await call('put', '/me/member-profile', {
          goals: 'Tăng sức bền',
          healthNotes: 'Đau đầu gối',
          shareWithCoach: false,
          heightCm: 170,
        })
      ).status,
    ).toBe(200);
    expect(
      (await call('put', '/me/member-profile', { userId: f.other.id, goals: 'Giả mạo' })).status,
    ).toBe(400);
    expect(
      (await call('get', `/members/${f.member.id}/profile`, undefined, f.otherToken)).status,
    ).toBe(403);
    expect(
      (
        await call(
          'put',
          `/members/${f.member.id}/profile`,
          { goals: 'Mục tiêu sửa hộ' },
          f.adminToken,
        )
      ).status,
    ).toBe(200);
    expect((await call('get', '/me/member-profile')).body.data.goals).toBe('Mục tiêu sửa hộ');
  });
  it('ngoài phạm vi trả 403; tắt chia sẻ thì không có sức khoẻ, tài chính hay tổng kết khác', async () => {
    expect(
      (await call('get', `/coach/members/${f.member.id}`, undefined, f.coachOtherToken)).status,
    ).toBe(403);
    const detail = (await call('get', `/coach/members/${f.member.id}`, undefined, f.coachToken))
      .body.data;
    expect(detail.sharingEnabled).toBe(false);
    expect(detail.trainingProfile).toBeUndefined();
    for (const key of [
      'healthNotes',
      'goals',
      'invoices',
      'memberships',
      'creditBalance',
      'passwordHash',
    ])
      expect(detail).not.toHaveProperty(key);
    expect(detail.classes).toHaveLength(1);
    const list = await call('get', '/coach/members', undefined, f.coachToken);
    expect(list.body.data.map((m) => m.id)).toContain(f.member.id);
    await call('put', '/me/member-profile', { shareWithCoach: true });
    expect(
      (await call('get', `/coach/members/${f.member.id}`, undefined, f.coachToken)).body.data
        .trainingProfile.healthNotes,
    ).toBe('Đau đầu gối');
  });
  it('đã học chỉ còn quyền trong số ngày cấu hình; huỷ trước buổi không tạo quyền', async () => {
    await prisma.classEnrollment.updateMany({
      where: { classId: f.item.id },
      data: { enrolledAt: new Date(Date.now() - 10 * DAY) },
    });
    await prisma.classSession.updateMany({
      where: { classId: f.item.id },
      data: { startAt: new Date(Date.now() - 2 * DAY), endAt: new Date(Date.now() - DAY) },
    });
    expect(
      (await call('get', `/coach/members/${f.member.id}`, undefined, f.coachToken)).status,
    ).toBe(200);
    const days = Number(
      (await prisma.systemSetting.findUniqueOrThrow({ where: { key: K.COACH_MEMBER_VIEW_DAYS } }))
        .value,
    );
    await prisma.classSession.updateMany({
      where: { classId: f.item.id },
      data: {
        startAt: new Date(Date.now() - (days + 2) * DAY),
        endAt: new Date(Date.now() - (days + 1) * DAY),
      },
    });
    expect(
      (await call('get', `/coach/members/${f.member.id}`, undefined, f.coachToken)).status,
    ).toBe(403);
  });
});
