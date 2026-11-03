import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { prisma } from '../src/config/db.js';
import { createCourseFixture, cleanupCourseFixture } from './helpers/sprint4.js';
let f; let session; let version;
beforeAll(async () => {
  f = await createCourseFixture(); session = f.item.sessions[0];
  const permission = await prisma.permission.findUnique({ where: { code: 'attendance.record' } });
  await prisma.rolePermission.createMany({ skipDuplicates: true, data: [{ roleId: f.coach.roleId, permissionId: permission.id }] });
});
afterAll(async () => cleanupCourseFixture(f));
describe('TC-SESSION-FEEDBACK: mô tả và ghi chú từng học viên', () => {
  it('01: HLV phụ trách lưu mô tả từng buổi, hội viên và HLV khác không sửa được', async () => {
    const path = `/classes/sessions/${session.id}/description`;
    expect((await f.call('patch', path, { description: 'Khởi động, kỹ thuật thở và vận động an toàn.' }, f.memberToken)).status).toBe(403);
    expect((await f.call('patch', path, { description: 'Nội dung khác' }, f.coachOtherToken)).status).toBe(403);
    const res = await f.call('patch', path, { description: 'Khởi động, kỹ thuật thở và vận động an toàn.' });
    expect(res.status).toBe(200); expect(res.body.data.description).toContain('kỹ thuật thở');
  });
  it('02: nhận xét không tự tạo hoặc sửa kết quả điểm danh', async () => {
    const path = `/classes/sessions/${session.id}/feedback/${f.member.id}`;
    const res = await f.call('put', path, { rating: 4, note: 'Động tác tiến bộ, cần chú ý nhịp thở.', expectedVersion: 0 });
    expect(res.status).toBe(200); version = res.body.data.version;
    expect(await prisma.attendance.count({ where: { sessionId: session.id } })).toBe(0);
    expect((await f.call('put', path, { rating: 5, note: 'Ghi đè bản cũ', expectedVersion: 0 })).status).toBe(409);
  });
  it('03: chỉ HLV buổi đó hoặc quản lý sửa; cấm sửa của người chưa đăng ký chính thức', async () => {
    const path = `/classes/sessions/${session.id}/feedback/${f.member.id}`;
    expect((await f.call('put', path, { note: 'Thay đổi trái phép', expectedVersion: version }, f.coachOtherToken)).status).toBe(403);
    await prisma.classEnrollment.updateMany({ where: { classId: f.item.id, memberId: f.other.id }, data: { status: 'PENDING_PAYMENT' } });
    expect((await f.call('put', `/classes/sessions/${session.id}/feedback/${f.other.id}`, { note: 'Chưa trả tiền', expectedVersion: 0 })).status).toBe(422);
  });
  it('04: học viên chỉ xem ghi chú chính mình; điểm sai hoặc chèn memberId bị từ chối', async () => {
    const mine = await f.call('get', '/attendance/feedback/me', undefined, f.memberToken);
    expect(mine.status).toBe(200); expect(mine.body.data).toHaveLength(1); expect(mine.body.data[0].note).toContain('nhịp thở');
    expect((await f.call('get', '/attendance/feedback/me', undefined, f.otherToken)).body.data).toHaveLength(0);
    expect((await f.call('get', `/attendance/feedback/me?memberId=${f.member.id}`, undefined, f.otherToken)).status).toBe(400);
    expect((await f.call('put', `/classes/sessions/${session.id}/feedback/${f.member.id}`, { rating: 6, expectedVersion: version })).status).toBe(400);
  });
});
