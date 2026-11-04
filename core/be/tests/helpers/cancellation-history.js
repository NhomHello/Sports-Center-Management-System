import { expect } from 'vitest';
import { prisma } from '../../src/config/db.js';
import { createGopyFixture, createPaidClass, buyCourseCash, pastSessions } from './gopy.js';
const FIXTURE = Object.freeze({
  price: 1000000,
  days: 147,
  dayMs: 86400000,
  total: 20,
  used: 10,
  dateLength: 10,
});

/** Khóa 20 buổi, đã học 10 và có học viên chờ để kiểm tra lịch sử cùng thông báo. */
export const createCancellationHistoryFixture = async () => {
  const f = await createGopyFixture();
  const item = await createPaidClass(f, {
    price: FIXTURE.price,
    capacity: 1,
    endsOn: new Date(Date.now() + FIXTURE.days * FIXTURE.dayMs)
      .toISOString()
      .slice(0, FIXTURE.dateLength),
  });
  expect(item.sessions.length).toBe(FIXTURE.total);
  const enrollment = await buyCourseCash(f, item.id, f.member.id);
  await f.call('post', `/classes/${item.id}/waitlist/me`, {}, f.otherToken);
  await prisma.classSession.update({
    where: { id: item.sessions.at(-1).id },
    data: { coachId: f.coachOther.id },
  });
  await pastSessions(item.id, FIXTURE.used);
  await prisma.attendance.create({
    data: {
      memberId: f.member.id,
      sessionId: item.sessions[0].id,
      actorId: f.coach.id,
      status: 'PRESENT',
    },
  });
  await prisma.sessionFeedback.create({
    data: {
      memberId: f.member.id,
      sessionId: item.sessions[0].id,
      authorId: f.coach.id,
      rating: 4,
      note: 'Nhận xét phải được giữ sau hủy',
    },
  });
  return { f, item, enrollment };
};
