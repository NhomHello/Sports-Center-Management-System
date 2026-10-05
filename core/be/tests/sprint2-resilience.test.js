import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { PERMISSIONS as P } from '@scms/shared';
import { api, apiPath, bearer, loginAs } from './helpers/api.js';
import { classPayload, createClassFixture, cleanupClassFixture } from './helpers/sprint2.js';
import { prisma, Enums } from '../src/config/db.js';
import * as scheduleTransaction from '../src/common/utils/schedule-transaction.js';
import * as classService from '../src/modules/class/class.service.js';
import * as enrollmentService from '../src/modules/class/class-enrollment.service.js';
import * as notificationService from '../src/modules/notification/notification.service.js';
import { drainClassEvents } from '../src/modules/class/class-event.service.js';

let f;
const create = (overrides = {}) => classService.create(classPayload(f, overrides), f.admin);
const read = (path, token, query = {}) => api.get(apiPath(path)).set(bearer(token)).query(query);

describe('Sprint 2: rollback, retry và hợp đồng phạm vi dữ liệu', () => {
  beforeAll(async () => {
    f = await createClassFixture();
  });
  beforeEach(async () => {
    await prisma.classSession.updateMany({
      where: { gymClass: { subjectId: f.subject.id } },
      data: { status: Enums.SessionStatus.CANCELLED },
    });
    await prisma.gymClass.updateMany({
      where: { subjectId: f.subject.id },
      data: { status: Enums.ClassStatus.CANCELLED },
    });
  });
  afterEach(() => vi.restoreAllMocks());
  afterAll(async () => {
    await cleanupClassFixture(f);
    await prisma.$disconnect();
  });

  it('TC-F2-R01: lỗi audit khi tạo lớp rollback cả lớp và buổi học', async () => {
    const failure = vi
      .spyOn(scheduleTransaction, 'writeScheduleAudit')
      .mockRejectedValueOnce(new Error('Audit unavailable'));
    const before = await prisma.gymClass.count({ where: { subjectId: f.subject.id } });
    await expect(create()).rejects.toThrow('Audit unavailable');
    expect(failure).toHaveBeenCalledOnce();
    expect(await prisma.gymClass.count({ where: { subjectId: f.subject.id } })).toBe(before);
  });

  it('TC-F2-R02: hội viên không có quyền ghi danh mục/lớp, xem phạm vi quản lý hoặc roster', async () => {
    const routes = [
      ['get', '/subjects'],
      ['post', '/subjects'],
      ['put', `/subjects/${f.subject.id}`],
      ['delete', `/subjects/${f.subject.id}`],
      ['get', '/rooms'],
      ['post', '/rooms'],
      ['put', `/rooms/${f.room.id}`],
      ['delete', `/rooms/${f.room.id}`],
      ['post', '/classes'],
      ['put', '/classes/1'],
      ['delete', '/classes/1'],
      ['get', '/classes/coaches'],
      ['get', '/classes/1/roster'],
      ['get', '/classes/filters'],
      ['get', '/schedule/teaching'],
      ['get', '/schedule/week'],
    ];
    for (const [method, path] of routes) {
      expect((await api[method](apiPath(path)).set(bearer(f.memberToken))).status, path).toBe(403);
    }
    expect((await api.get(apiPath('/classes'))).status).toBe(401);
    expect((await read('/classes', f.memberToken, { scope: 'management' })).status).toBe(403);
  });

  it('TC-F2-R03: lỗi transaction khi đăng ký/huỷ không để lại booking dở dang', async () => {
    const item = await create();
    const audit = vi.spyOn(scheduleTransaction, 'writeScheduleAudit');
    audit.mockRejectedValueOnce(new Error('Booking audit failed'));
    await expect(enrollmentService.enroll(item.id, f.member.id, f.member)).rejects.toThrow(
      'Booking audit failed',
    );
    expect(await prisma.classEnrollment.count({ where: { classId: item.id } })).toBe(0);
    await enrollmentService.enroll(item.id, f.member.id, f.member);
    audit.mockRejectedValueOnce(new Error('Cancellation audit failed'));
    await expect(enrollmentService.cancel(item.id, f.member.id, f.member)).rejects.toThrow(
      'Cancellation audit failed',
    );
    const row = await prisma.classEnrollment.findFirstOrThrow({ where: { classId: item.id } });
    expect(row.status).toBe(Enums.EnrollmentStatus.BOOKED);
    expect(row.cancelledAt).toBeNull();
  });

  it('TC-F2-R04: outbox lưu lỗi rồi gửi lại đúng một thông báo', async () => {
    const item = await create();
    await enrollmentService.enroll(item.id, f.member.id, f.admin);
    await classService.update(
      item.id,
      classPayload(f, {
        weeklySchedule: [{ ...item.weeklySchedule[0], startTime: '20:00', endTime: '21:00' }],
      }),
      f.admin,
    );
    vi.spyOn(notificationService, 'createForUsers').mockRejectedValueOnce(
      new Error('Delivery offline'),
    );
    await drainClassEvents();
    const pending = await prisma.classEvent.findFirstOrThrow({ where: { classId: item.id } });
    expect(pending.sentAt).toBeNull();
    expect(pending.attempts).toBe(1);
    expect(pending.lastError).toBe('Delivery offline');
    const where = { dedupeKey: `class-event:${pending.id}:${f.member.id}` };
    expect(await prisma.notification.count({ where })).toBe(0);
    await drainClassEvents();
    await drainClassEvents();
    expect(await prisma.notification.count({ where })).toBe(1);
    const delivered = await prisma.classEvent.findUniqueOrThrow({ where: { id: pending.id } });
    expect(delivered.sentAt).not.toBeNull();
    expect(delivered.lastError).toBeNull();
  });

  it('TC-F2-R05: nhân viên đọc lớp đã đóng của hội viên; memberId giả mạo bị từ chối', async () => {
    const item = await create();
    await enrollmentService.enroll(item.id, f.member.id, f.admin);
    await classService.update(
      item.id,
      classPayload(f, { status: Enums.ClassStatus.CLOSED }),
      f.admin,
    );
    const role = await prisma.role.create({
      data: {
        code: `${f.prefix}_BOOKING`,
        name: `${f.prefix} Booking`,
        permissions: {
          create: [P.CLASS_READ, P.CLASS_ENROLL_FOR_MEMBER].map((code) => ({
            permission: { connect: { code } },
          })),
        },
      },
    });
    f.roleIds.push(role.id);
    await prisma.user.update({ where: { id: f.other.id }, data: { roleId: role.id } });
    const token = await loginAs(f.other.email, f.password);
    const allowed = await read(`/classes/${item.id}`, token, { memberId: f.member.id });
    expect(allowed.status).toBe(200);
    expect(allowed.body.data.enrollment.memberId).toBe(f.member.id);
    expect(allowed.body.data.canCancel).toBe(true);
    expect(
      (await read(`/classes/${item.id}`, f.memberToken, { memberId: f.other.id })).status,
    ).toBe(403);
    expect((await read(`/classes/${item.id}`, f.coachOtherToken)).status).toBe(403);
  });

  it('TC-F2-R06: bộ lọc và phân trang quản lý giữ phạm vi HLV, CRUD phòng kiểm tra sức chứa', async () => {
    const own = await create();
    const outside = await create({ coachId: f.coachOther.id, roomId: f.roomOther.id });
    const filters = await read('/classes/filters', f.coachToken);
    expect(filters.status).toBe(200);
    expect(filters.body.data.coaches.map((c) => c.id)).toEqual([f.coach.id]);
    const list = await read('/classes', f.coachToken, {
      scope: 'management',
      pageSize: 1,
      search: f.prefix,
      status: 'OPEN',
    });
    expect(list.body.data.map((c) => c.id)).toEqual([own.id]);
    expect(list.body.meta.total).toBe(1);
    expect(list.body.data.some((c) => c.id === outside.id)).toBe(false);
    const update = (capacity) =>
      api
        .put(apiPath(`/rooms/${f.room.id}`))
        .set(bearer(f.adminToken))
        .send({ name: f.room.name, capacity });
    expect((await update(0)).status).toBe(400);
    expect((await update(1)).status).toBe(422);
    expect((await update(10)).status).toBe(200);
  });
});
