import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { StatusCodes } from 'http-status-codes';
import { prisma } from '../src/config/db.js';
import { TIME } from '../src/constants/index.js';
import { cleanupGopyFixture, createGopyFixture } from './helpers/gopy.js';
import { classPayload } from './helpers/sprint2.js';

let fixture;

beforeAll(async () => {
  fixture = await createGopyFixture();
});

afterAll(() => cleanupGopyFixture(fixture));

describe('Hủy báo nghỉ buổi học', () => {
  it('xóa trạng thái Xin nghỉ, ghi audit và trở về chưa điểm danh', async () => {
    const gymClass = (await fixture.call('post', '/classes', classPayload(fixture))).body.data;
    await fixture.call(
      'post',
      `/classes/${gymClass.id}/enrollments/me`,
      {},
      fixture.memberToken,
    );
    const session = await prisma.classSession.findFirstOrThrow({
      where: { classId: gymClass.id },
      orderBy: { startAt: 'asc' },
    });
    await fixture.call('post', `/classes/sessions/${session.id}/excuse`, {}, fixture.memberToken);
    const attendance = await prisma.attendance.findUniqueOrThrow({
      where: { sessionId_memberId: { sessionId: session.id, memberId: fixture.member.id } },
    });

    const response = await fixture.call(
      'delete',
      `/classes/sessions/${session.id}/excuse`,
      {},
      fixture.memberToken,
    );

    expect(response.status).toBe(StatusCodes.OK);
    await expect(
      prisma.attendance.findUnique({
        where: { sessionId_memberId: { sessionId: session.id, memberId: fixture.member.id } },
      }),
    ).resolves.toBeNull();
    const audit = await prisma.auditLog.findFirstOrThrow({
      where: { entity: 'Attendance', entityId: String(attendance.id), userId: fixture.member.id },
      orderBy: { createdAt: 'desc' },
    });
    expect(audit.meta).toMatchObject({
      before: 'EXCUSED',
      after: null,
      reason: 'CANCEL_EXCUSE',
    });
  });

  it('từ chối hủy khi buổi học đã bắt đầu', async () => {
    const gymClass = (
      await fixture.call(
        'post',
        '/classes',
        classPayload(fixture, {
          roomId: fixture.roomOther.id,
          coachId: fixture.coachOther.id,
        }),
      )
    ).body.data;
    await fixture.call(
      'post',
      `/classes/${gymClass.id}/enrollments/me`,
      {},
      fixture.otherToken,
    );
    const session = await prisma.classSession.findFirstOrThrow({
      where: { classId: gymClass.id },
      orderBy: { startAt: 'asc' },
    });
    await fixture.call('post', `/classes/sessions/${session.id}/excuse`, {}, fixture.otherToken);
    await prisma.classSession.update({
      where: { id: session.id },
      data: { startAt: new Date(Date.now() - TIME.MS_PER_HOUR) },
    });

    const response = await fixture.call(
      'delete',
      `/classes/sessions/${session.id}/excuse`,
      {},
      fixture.otherToken,
    );

    expect(response.status).toBe(StatusCodes.UNPROCESSABLE_ENTITY);
    await expect(
      prisma.attendance.findUnique({
        where: { sessionId_memberId: { sessionId: session.id, memberId: fixture.other.id } },
      }),
    ).resolves.toMatchObject({ status: 'EXCUSED' });
  });
});
