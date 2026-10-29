import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { prisma } from '../src/config/db.js';
import { createCourseFixture, cleanupCourseFixture } from './helpers/sprint4.js';
import { runCourseCompletion } from '../src/modules/course-summary/course-completion.job.js';
import { drainClassEvents } from '../src/modules/class/class-event.service.js';
import { api, apiPath, bearer } from './helpers/api.js';
const mail = vi.hoisted(() => ({ sendMail: vi.fn().mockResolvedValue({ delivered: true }) }));
vi.mock('../src/common/mail/mailer.js', () => mail);
let f;
let summary;
const base = () => `/classes/${f.item.id}/summary`;
beforeAll(async () => { f = await createCourseFixture(); });
afterAll(async () => cleanupCourseFixture(f));

describe('S4-11/12: kết thúc khoá và nháp', () => {
  it('TC-S4-COURSE-01: job chỉ kết thúc sau buổi cuối; lặp không tạo trùng', async () => {
    await runCourseCompletion(new Date(Date.now() - 3 * 86400000), f.item.id);
    expect(await prisma.courseSummary.count({ where: { classId: f.item.id } })).toBe(0);
    await runCourseCompletion(new Date(), f.item.id); await runCourseCompletion(new Date(), f.item.id);
    expect((await prisma.gymClass.findUnique({ where: { id: f.item.id } })).status).toBe('COMPLETED');
    expect(await prisma.courseSummary.count({ where: { classId: f.item.id } })).toBe(1);
    expect(await prisma.courseSummaryItem.count({ where: { summary: { classId: f.item.id } } })).toBe(2);
  });
  it('TC-S4-COURSE-02: HLV khác không đọc/sửa được; học viên không đọc bản nháp', async () => {
    expect((await f.call('get', base(), undefined, f.coachOtherToken)).status).toBe(403);
    const res = await f.call('get', base()); expect(res.status).toBe(200); summary = res.body.data;
    expect(summary.items[0].attendance).toMatchObject({ total: 2, missing: 2, percent: 0 });
    const mine = await api.get(apiPath('/me/course-results')).set(bearer(f.memberToken));
    expect(mine.body.data).toHaveLength(0);
    expect((await f.call('put', `${base()}/items/${summary.items[0].id}`, { result: 'PASS', progress: 4 })).status).toBe(422);
    expect((await f.call('put', `${base()}/items/99999999`, { result: 'NOT_PASSED', progress: 3 })).status).toBe(404);
  });
  it('TC-S4-COURSE-03: EXCUSED loại mẫu số, buổi trung tâm huỷ không tính; cảnh báo chưa điểm danh', async () => {
    await prisma.attendance.createMany({ data: [
      { sessionId: f.item.sessions[0].id, memberId: f.member.id, actorId: f.coach.id, status: 'PRESENT' },
      { sessionId: f.item.sessions[1].id, memberId: f.member.id, actorId: f.coach.id, status: 'EXCUSED' },
    ] });
    const res = await f.call('get', base()); summary = res.body.data;
    const own = summary.items.find((i) => i.memberId === f.member.id);
    expect(own.attendance.percent).toBe(100); expect(own.suggestedResult).toBe('PASS');
    for (const item of summary.items) {
      const result = item.memberId === f.member.id ? 'PASS' : 'NOT_PASSED';
      expect((await f.call('put', `${base()}/items/${item.id}`, { result, progress: 4 })).status).toBe(200);
    }
    expect((await f.call('post', `${base()}/publish`, {})).status).toBe(409);
  });
});

describe('S4-14/16: công bố, retry và quyền kết quả', () => {
  it('TC-S4-COURSE-04: công bố đồng thời chỉ thắng một lần, bản đã công bố khoá sửa', async () => {
    const race = await Promise.all([f.call('post', `${base()}/publish`, { acknowledgeMissingAttendance: true }), f.call('post', `${base()}/publish`, { acknowledgeMissingAttendance: true })]);
    expect(race.map((r) => r.status).sort()).toEqual([200, 409]);
    expect((await f.call('put', `${base()}/items/${summary.items[0].id}`, { result: 'PASS', progress: 4 })).status).toBe(409);
  });
  it('TC-S4-COURSE-05: SMTP chưa cấu hình vẫn giữ in-app và nhường lượt cho event mới', async () => {
    mail.sendMail.mockResolvedValueOnce({ delivered: false });
    await drainClassEvents();
    const event = await prisma.classEvent.findFirst({ where: { classId: f.item.id } });
    expect(event.sentAt).toBeNull(); expect(event.attempts).toBeGreaterThan(0);
    expect(await prisma.notification.count({ where: { dedupeKey: { startsWith: `class-event:${event.id}:` } } })).toBe(2);
  });
  it('TC-S4-COURSE-06: email lỗi vẫn giữ in-app và outbox; retry không nhân đôi thông báo', async () => {
    mail.sendMail.mockRejectedValueOnce(new Error('SMTP tạm gián đoạn'));
    await drainClassEvents();
    expect(await prisma.classEvent.count({ where: { classId: f.item.id, sentAt: null } })).toBe(1);
    await drainClassEvents(); await drainClassEvents();
    expect(await prisma.classEvent.count({ where: { classId: f.item.id, sentAt: null } })).toBe(0);
    const event = await prisma.classEvent.findFirst({ where: { classId: f.item.id } });
    expect(await prisma.notification.count({ where: { dedupeKey: { startsWith: `class-event:${event.id}:` } } })).toBe(2);
  });
  it('TC-S4-COURSE-07: chỉ trả kết quả mình; PDF có signature; người khác đoán ID bị 404', async () => {
    const res = await api.get(apiPath('/me/course-results')).set(bearer(f.memberToken));
    expect(res.body.data).toHaveLength(1);
    const own = res.body.data[0]; expect(own.attendanceSnapshot.percent).toBe(100);
    const pdf = await api.get(apiPath(`/me/course-results/${own.id}/pdf`)).set(bearer(f.memberToken));
    expect(pdf.status).toBe(200); expect(pdf.headers['content-type']).toContain('application/pdf');
    expect((await api.get(apiPath(`/me/course-results/${own.id}/pdf`)).set(bearer(f.otherToken))).status).toBe(404);
  });
  it('TC-S4-COURSE-08: mở lại cần quyền/lý do; công bố lại tăng revision', async () => {
    expect((await f.call('post', `${base()}/reopen`, { reason: 'Sửa kết quả' })).status).toBe(403);
    expect((await f.call('post', `${base()}/reopen`, { reason: '' }, f.adminToken)).status).toBe(400);
    expect((await f.call('post', `${base()}/reopen`, { reason: 'Sửa nhận xét' }, f.adminToken)).status).toBe(200);
    expect((await api.get(apiPath('/me/course-results')).set(bearer(f.memberToken))).body.data).toHaveLength(0);
    const republish = await f.call('post', `${base()}/publish`, { acknowledgeMissingAttendance: true });
    expect(republish.status).toBe(200); expect(republish.body.data.revision).toBe(2);
  });
});
