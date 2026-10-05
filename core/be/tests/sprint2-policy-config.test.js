import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { SETTING_KEYS } from '@scms/shared';
import { api, apiPath, bearer } from './helpers/api.js';
import { createClassFixture, cleanupClassFixture, classPayload } from './helpers/sprint2.js';
import { prisma } from '../src/config/db.js';
import * as classService from '../src/modules/class/class.service.js';
import * as enrollmentService from '../src/modules/class/class-enrollment.service.js';
import * as settingService from '../src/modules/setting/setting.service.js';
import { getClassActions } from '../src/modules/class/class-booking-policy.service.js';
import { CLASS_INCLUDE } from '../src/modules/class/class.mapper.js';
import { startOfWeek } from '../src/modules/schedule/schedule.validation.js';

let f;
describe('Sprint 2: cấu hình hạn huỷ và biên tuần Việt Nam', () => {
  beforeAll(async () => {
    f = await createClassFixture();
  });
  afterAll(async () => {
    await cleanupClassFixture(f);
    await prisma.$disconnect();
  });
  it('TC-F2-N01: đổi N từ 12 thành 3 giờ cập nhật điều kiện huỷ từ backend', async () => {
    const item = await classService.create(classPayload(f), f.admin);
    await enrollmentService.enroll(item.id, f.member.id, f.admin);
    await prisma.classSession.create({
      data: {
        classId: item.id,
        startAt: new Date(Date.now() + 6 * 3600000),
        endAt: new Date(Date.now() + 7 * 3600000),
      },
    });
    const raw = await prisma.gymClass.findUniqueOrThrow({
      where: { id: item.id },
      include: CLASS_INCLUDE,
    });
    const key = SETTING_KEYS.CLASS_CANCEL_MIN_HOURS_BEFORE;
    const original = await prisma.systemSetting.findUniqueOrThrow({ where: { key } });
    try {
      await settingService.updateMany([{ key, value: '12' }], f.member);
      expect((await getClassActions(prisma, raw, f.member.id)).canCancel).toBe(false);
      await settingService.updateMany([{ key, value: '3' }], f.member);
      expect((await getClassActions(prisma, raw, f.member.id)).canCancel).toBe(true);
    } finally {
      await settingService.updateMany([{ key, value: original.value }], f.member);
    }
  });
  it('TC-F2-N02: tuần bắt đầu thứ Hai Việt Nam; không nhận userId từ client', async () => {
    expect(startOfWeek('2026-10-05').toISOString()).toBe('2026-10-04T17:00:00.000Z');
    const read = (query) =>
      api.get(apiPath('/schedule/me')).set(bearer(f.memberToken)).query(query);
    expect((await read({ weekStart: '2026-10-04' })).status).toBe(400);
    expect((await read({ weekStart: '2026-10-05', memberId: f.other.id })).status).toBe(400);
    expect((await read({ weekStart: '2026-10-05' })).status).toBe(200);
  });
});
