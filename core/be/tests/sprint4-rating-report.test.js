import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { prisma } from '../src/config/db.js';
import { createCourseFixture, cleanupCourseFixture } from './helpers/sprint4.js';
import { runCourseCompletion } from '../src/modules/course-summary/course-completion.job.js';
import { calculateAttendance } from '../src/modules/course-summary/course-attendance.service.js';
import { api, apiPath, bearer } from './helpers/api.js';
import { vietnamDate } from '../src/common/utils/vietnam-date.js';
let f;
let ratingId;
const DAY = 86400000;
beforeAll(async () => { f = await createCourseFixture(); await runCourseCompletion(new Date(), f.item.id); });
afterAll(async () => cleanupCourseFixture(f));

describe('S4-18/20: đánh giá và báo cáo tổng kết', () => {
  it('TC-S4-RATING-01: chuyên cần loại buổi huỷ/xin nghỉ, mẫu số 0 không gây NaN', () => {
    const date = new Date('2026-10-01');
    const sessions = [{ id: 1, status: 'SCHEDULED', startAt: date }, { id: 2, status: 'CANCELLED', startAt: date }];
    expect(calculateAttendance(sessions, [{ sessionId: 1, status: 'EXCUSED' }], date)).toMatchObject({ total: 1, excused: 1, percent: 0 });
  });
  it('TC-S4-RATING-02: mỗi người một đánh giá; sao sai và người chưa học bị từ chối', async () => {
    const path = `/classes/${f.item.id}/ratings`;
    expect((await f.call('post', path, { courseStars: 6, coachStars: 4 }, f.memberToken)).status).toBe(400);
    const res = await f.call('post', path, { courseStars: 5, coachStars: 4, comment: 'Khoá rất bổ ích' }, f.memberToken);
    expect(res.status).toBe(201); ratingId = res.body.data.id;
    expect((await f.call('post', path, { courseStars: 5, coachStars: 4 }, f.memberToken)).status).toBe(409);
    expect((await f.call('put', path, { courseStars: 4, coachStars: 3 }, f.memberToken)).status).toBe(200);
  });
  it('TC-S4-RATING-03: HLV nhận tên viết tắt, quản lý thấy danh tính; moderation giữ nguyên điểm', async () => {
    const path = apiPath(`/coaches/${f.coach.id}/ratings`);
    const publicView = await api.get(path).set(bearer(f.coachToken));
    expect(publicView.status).toBe(200);
    expect(publicView.body.data[0]).not.toHaveProperty('memberId');
    expect(publicView.body.data[0].memberName).not.toBe(f.member.fullName);
    const manager = await api.get(path).set(bearer(f.adminToken));
    expect(manager.body.data[0].memberId).toBe(f.member.id);
    expect((await f.call('patch', `/course-ratings/${ratingId}/moderation`, { hidden: true, reason: 'Kiểm tra nội dung' }, f.adminToken)).status).toBe(200);
    const hidden = await api.get(path).set(bearer(f.memberToken));
    expect(hidden.body.data[0].comment).toBeNull(); expect(hidden.body.meta.averages.coachStars).toBe(3);
  });
  it('TC-S4-RATING-04: ngoài hạn không được sửa đánh giá dù biết ID lớp', async () => {
    await prisma.classSession.updateMany({ where: { classId: f.item.id }, data: { endAt: new Date(Date.now() - 15 * DAY), startAt: new Date(Date.now() - 16 * DAY) } });
    expect((await f.call('put', `/classes/${f.item.id}/ratings`, { courseStars: 5, coachStars: 5 }, f.memberToken)).status).toBe(422);
  });
  it('TC-S4-RATING-05: report.view không thay thế quyền báo cáo khoá; Excel dùng cùng builder', async () => {
    const query = { from: vietnamDate(new Date(Date.now() - 30 * DAY)), to: vietnamDate(), coachId: f.coach.id };
    const path = apiPath('/reports/course-summaries');
    expect((await api.get(path).set(bearer(f.memberToken)).query(query)).status).toBe(403);
    expect((await api.get(path).set(bearer(f.coachToken)).query(query)).status).toBe(403);
    const res = await api.get(path).set(bearer(f.adminToken)).query(query);
    expect(res.status).toBe(200); expect(res.body.data.items[0]).toMatchObject({ classId: f.item.id, submitted: false, studentCount: 2 });
    const file = await api.get(path + '/export').set(bearer(f.adminToken)).query(query);
    expect(file.status).toBe(200); expect(file.headers['content-type']).toContain('spreadsheetml');
  });
});
