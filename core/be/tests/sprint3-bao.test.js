import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PERMISSIONS as P } from '@scms/shared';
import { prisma } from '../src/config/db.js';
import { api, apiPath, bearer } from './helpers/api.js';
import { createClassFixture, cleanupClassFixture, classPayload } from './helpers/sprint2.js';
import { activatePaidInvoice } from '../src/modules/membership/membership-invoice.service.js';
import { runMembershipLifecycle } from '../src/modules/notification/notification.job.js';
import { runWaitlistJob } from '../src/modules/class/class-waitlist.service.js';
import { withScheduleTransaction } from '../src/common/utils/schedule-transaction.js';
import { finishFreeze } from '../src/modules/membership/membership-freeze.service.js';
import { vietnamDate, vietnamDay } from '../src/common/utils/vietnam-date.js';

const DAY = 86400000;
const HOUR = 3600000;
let f;
let item;
const call = (method, path, body, token = f.adminToken) => api[method](apiPath(path)).set(bearer(token)).send(body);
const createClass = async (overrides = {}) => {
  const res = await call('post', '/classes', classPayload(f, overrides));
  expect(res.status).toBe(201);
  return res.body.data;
};

beforeAll(async () => {
  f = await createClassFixture();
  await prisma.rolePermission.create({ data: { roleId: f.coach.roleId,
    permissionId: (await prisma.permission.findUnique({ where: { code: P.ATTENDANCE_RECORD } })).id } });
  item = await createClass({ capacity: 1 });
});
afterAll(async () => {
  if (!f) return;
  const classes = await prisma.gymClass.findMany({ where: { subjectId: f.subject.id }, select: { id: true } });
  const ids = classes.map((c) => c.id);
  await prisma.attendance.deleteMany({ where: { session: { classId: { in: ids } } } });
  await prisma.classWaitlist.deleteMany({ where: { classId: { in: ids } } });
  await prisma.roomMaintenance.deleteMany({ where: { roomId: { in: [f.room.id, f.roomOther.id] } } });
  await prisma.checkIn.deleteMany({ where: { memberId: { in: f.userIds } } });
  await prisma.membershipFreeze.deleteMany({ where: { membership: { userId: { in: f.userIds } } } });
  await prisma.auditLog.deleteMany({ where: { userId: f.admin.id, createdAt: { gte: started } } });
  await cleanupClassFixture(f);
});
const started = new Date();

describe('Sprint 3 Bảo: giữ chỗ, đổi buổi, khoá tài khoản', () => {
  it('FIFO giữ chỗ khi huỷ; người khác không chiếm được chỗ đã giữ', async () => {
    expect((await call('post', `/classes/${item.id}/enrollments/me`, {}, f.memberToken)).status).toBe(201);
    expect((await call('post', `/classes/${item.id}/waitlist/me`, {}, f.otherToken)).status).toBe(201);
    expect((await call('delete', `/classes/${item.id}/enrollments/me`, {}, f.memberToken)).status).toBe(200);
    const offer = await prisma.classWaitlist.findUnique({ where: { classId_memberId: { classId: item.id, memberId: f.other.id } } });
    expect(offer.status).toBe('OFFERED');
    const race = await Promise.all([call('post', `/classes/${item.id}/enrollments/me`, {}, f.memberToken), call('post', `/classes/${item.id}/enrollments/me`, {}, f.otherToken)]);
    expect(race.map((r) => r.status)).toEqual([422, 201]);
    expect((await prisma.classWaitlist.findUnique({ where: { id: offer.id } })).status).toBe('ACCEPTED');
  });
  it('offer hết hạn bị bỏ qua; không tự tạo booking', async () => {
    await call('post', `/classes/${item.id}/waitlist/me`, {}, f.memberToken);
    await call('delete', `/classes/${item.id}/enrollments/me`, {}, f.otherToken);
    await prisma.classWaitlist.updateMany({ where: { classId: item.id, status: 'OFFERED' }, data: { offeredUntil: new Date(Date.now() - 1) } });
    await runWaitlistJob();
    expect((await prisma.classWaitlist.findUnique({ where: { classId_memberId: { classId: item.id, memberId: f.member.id } } })).status).toBe('EXPIRED');
    expect(await prisma.classEnrollment.count({ where: { classId: item.id, status: 'BOOKED' } })).toBe(0);
  });
  it('đổi buổi chặn trùng HLV/phòng, không thay đổi dữ liệu khi lỗi', async () => {
    const session = item.sessions[0];
    const next = item.sessions[1];
    const res = await call('patch', `/classes/sessions/${session.id}`, { startAt: next.startAt, endAt: next.endAt });
    expect(res.status).toBe(409);
    expect((await prisma.classSession.findUnique({ where: { id: session.id } })).startAt.toISOString()).toBe(session.startAt);
  });
  it('đổi giờ tạo thông báo, huỷ buổi lặp chỉ tạo một event', async () => {
    const s = item.sessions[0];
    expect((await call('patch', `/classes/sessions/${s.id}`, { startAt: new Date(new Date(s.startAt).getTime() + HOUR).toISOString(), endAt: new Date(new Date(s.endAt).getTime() + HOUR).toISOString() })).status).toBe(200);
    expect((await call('post', `/classes/sessions/${s.id}/cancellation`, { reason: 'Huỷ để kiểm thử' })).status).toBe(200);
    expect((await call('post', `/classes/sessions/${s.id}/cancellation`, { reason: 'Gửi lại' })).status).toBe(200);
    const events = await prisma.classEvent.findMany({ where: { classId: item.id, kind: 'CLASS_CANCELLED' } });
    expect(events).toHaveLength(1);
  });
  it('khoá HLV có lớp mở trả 409 kèm danh sách lớp', async () => {
    const res = await call('patch', `/users/${f.coach.id}/status`, { status: 'INACTIVE' });
    expect(res.status).toBe(409);
    expect(res.body.details.classes.some((c) => c.id === item.id)).toBe(true);
  });
  it('khoá hội viên yêu cầu xác nhận rồi huỷ booking và ghi actor', async () => {
    await call('post', `/classes/${item.id}/enrollments/me`, {}, f.memberToken);
    expect((await call('patch', `/users/${f.member.id}/status`, { status: 'INACTIVE' })).status).toBe(409);
    expect((await call('patch', `/users/${f.member.id}/status`, { status: 'INACTIVE', cancelFutureBookings: true })).status).toBe(200);
    const row = await prisma.classEnrollment.findUnique({ where: { classId_memberId: { classId: item.id, memberId: f.member.id } } });
    expect(row.status).toBe('CANCELLED'); expect(row.cancelledBy).toBe(f.admin.id);
    await call('patch', `/users/${f.member.id}/status`, { status: 'ACTIVE' });
  });
  it('đổi HLV giữ snapshot buổi quá khứ', async () => {
    const past = await prisma.classSession.create({ data: { classId: item.id,
      startAt: new Date(Date.now() - 2 * HOUR), endAt: new Date(Date.now() - HOUR), coachId: f.coach.id, roomId: f.room.id } });
    const res = await call('patch', `/classes/${item.id}/coach`, { coachId: f.coachOther.id });
    expect(res.status).toBe(200);
    expect((await prisma.classSession.findUnique({ where: { id: past.id } })).coachId).toBe(f.coach.id);
    expect(res.body.data.every((s) => s.coachId === f.coachOther.id)).toBe(true);
  });
  it('đổi giờ gây trùng lịch hội viên chỉ cảnh báo và cho huỷ, giữ cả hai booking', async () => {
    const otherClass = await createClass({ roomId: f.roomOther.id, coachId: f.coach.id,
      weeklySchedule: [{ dayOfWeek: new Date(item.startsOn).getUTCDay(), startTime: '21:00', endTime: '22:00' }] });
    expect((await call('post', `/classes/${item.id}/enrollments/me`, {}, f.memberToken)).status).toBe(201);
    expect((await call('post', `/classes/${otherClass.id}/enrollments/me`, {}, f.memberToken)).status).toBe(201);
    const target = otherClass.sessions[1];
    const res = await call('patch', `/classes/sessions/${item.sessions[1].id}`, { startAt: target.startAt, endAt: target.endAt });
    expect(res.status).toBe(200);
    expect(res.body.data.conflicts.some((c) => c.memberId === f.member.id)).toBe(true);
    expect(await prisma.classEnrollment.count({ where: { memberId: f.member.id, status: 'BOOKED' } })).toBe(2);
    await call('delete', `/classes/${item.id}/enrollments/me`, {}, f.memberToken);
    await call('delete', `/classes/${otherClass.id}/enrollments/me`, {}, f.memberToken);
  });

});

describe('Sprint 3 Bảo: bảo lưu và job gói', () => {
  it('bảo lưu chặn check-in/đăng ký; gói người khác bị từ chối', async () => {
    const membership = await prisma.membership.findFirst({ where: { userId: f.member.id } });
    const dates = { from: vietnamDate(), to: vietnamDate(new Date(Date.now() + 7 * DAY)) };
    expect((await call('post', `/memberships/${membership.id}/freezes`, dates, f.otherToken)).status).toBe(403);
    const res = await call('post', `/memberships/${membership.id}/freezes`, dates);
    expect(res.status).toBe(201);
    expect((await call('post', '/check-ins', { memberId: f.member.id })).status).toBe(422);
    expect((await call('post', `/classes/${item.id}/enrollments/me`, {}, f.memberToken)).status).toBe(422);
    expect((await call('post', `/memberships/${membership.id}/freezes/resume`, {})).status).toBe(200);
    expect((await prisma.membership.findUnique({ where: { id: membership.id } })).endDate).toEqual(membership.endDate);
  });
  it('kết thúc sớm cộng đúng số ngày thực dừng và chỉ một lần', async () => {
    const membership = await prisma.membership.findFirst({ where: { userId: f.other.id } });
    const freeze = await prisma.membershipFreeze.create({ data: { membershipId: membership.id,
      actorId: f.admin.id, startAt: new Date(vietnamDay().getTime() - 3 * DAY), endAt: new Date(vietnamDay().getTime() + 10 * DAY) } });
    await withScheduleTransaction((db) => finishFreeze(db, freeze, new Date()));
    const ended = await prisma.membershipFreeze.findUnique({ where: { id: freeze.id } });
    await withScheduleTransaction((db) => finishFreeze(db, ended, new Date()));
    expect(ended.creditedDays).toBe(3);
    expect((await prisma.membership.findUnique({ where: { id: membership.id } })).endDate.getTime()).toBe(membership.endDate.getTime() + 3 * DAY);
  });
  it('job hết hạn và thông báo không trùng qua các lần chạy', async () => {
    const m = await prisma.membership.findFirst({ where: { userId: f.member.id } });
    await prisma.membership.update({ where: { id: m.id }, data: { endDate: new Date(Date.now() - DAY) } });
    await runMembershipLifecycle(new Date(), f.member.id); await runMembershipLifecycle(new Date(), f.member.id);
    expect((await prisma.membership.findUnique({ where: { id: m.id } })).status).toBe('EXPIRED');
    expect(await prisma.notification.count({ where: { membershipId: m.id, kind: 'MEMBERSHIP_EXPIRED' } })).toBe(1);
    const res = await call('post', '/check-ins', { memberId: f.member.id });
    expect(res.status).toBe(201); expect(res.body.data.warning).toBeTruthy();
  });
  it('thanh toán ngay sau hết bảo lưu cộng ngày bảo lưu trước khi gia hạn, giữ cùng gói', async () => {
    const m = await prisma.membership.findFirst({ where: { userId: f.other.id } });
    const endDate = new Date(vietnamDay().getTime() - DAY);
    await prisma.membership.update({ where: { id: m.id }, data: { endDate } });
    const freeze = await prisma.membershipFreeze.create({ data: { membershipId: m.id, actorId: f.admin.id,
      startAt: new Date(vietnamDay().getTime() - 10 * DAY), endAt: new Date(vietnamDay().getTime() - 3 * DAY) } });
    const invoice = await prisma.invoice.create({ data: { code: `${f.prefix}_R`, userId: f.other.id,
      planId: f.plan.id, amount: 100, durationDays: 5, status: 'PAID', paidAt: new Date(), expiresAt: new Date() }, include: { plan: true } });
    const renewed = await withScheduleTransaction((db) => activatePaidInvoice(invoice, new Date(), db));
    expect(renewed.id).toBe(m.id);
    expect(renewed.endDate.getTime()).toBe(endDate.getTime() + 12 * DAY);
    expect((await prisma.membershipFreeze.findUnique({ where: { id: freeze.id } })).creditedDays).toBe(7);
  });

});
