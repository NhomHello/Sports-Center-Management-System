import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { prisma } from '../src/config/db.js';
import { classPayload } from './helpers/sprint2.js';
import {
  cleanupGopyFixture,
  createGopyFixture,
} from './helpers/gopy.js';

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
