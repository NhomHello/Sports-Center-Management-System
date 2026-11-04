import { afterAll, beforeAll, afterEach, describe, expect, it, vi } from 'vitest';
import { prisma } from '../src/config/db.js';
import { signAccessToken } from '../src/common/utils/jwt.js';
import {
  createGopyFixture,
  cleanupGopyFixture,
  createPaidClass,
  buyCourseCash,
} from './helpers/gopy.js';
let f;
let item;
let enrollment;
beforeAll(async () => {
  f = await createGopyFixture();
  item = await createPaidClass(f);
  enrollment = await buyCourseCash(f, item.id, f.member.id);
  await f.call('post', `/classes/sessions/${item.sessions[0].id}/excuse`, {}, f.memberToken);
  expect(
    await prisma.attendance.count({ where: { memberId: f.member.id, status: 'EXCUSED' } }),
  ).toBe(1);
  expect(
    (
      await f.call(
        'post',
        `/enrollments/${enrollment.id}/cancel`,
        { settlement: 'REFUND', reason: 'Hủy trước buổi đã báo nghỉ' },
        f.memberToken,
      )
    ).status,
  ).toBe(200);
});
afterEach(() => vi.useRealTimers());
afterAll(async () => cleanupGopyFixture(f));

const laterToken = () => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(new Date(item.sessions[0].startAt).getTime() + 5 * 60000));
  return signAccessToken({ sub: f.admin.id, version: f.admin.tokenVersion });
};
describe('TC-CANCEL-DATA: giữ dữ liệu cũ nhưng dừng quyền học sau khi hủy', () => {
  it('TC-CANCEL-DATA-01: báo nghỉ tương lai được giữ lịch sử, không cấp lại quyền điểm danh sau khi hủy', async () => {
    const token = laterToken();
    const roster = await f.call(
      'get',
      `/classes/sessions/${item.sessions[0].id}/attendance`,
      undefined,
      token,
    );
    expect(roster.status).toBe(200);
    expect(roster.body.data.items.some((row) => row.member.id === f.member.id)).toBe(false);
    const attempted = await f.call(
      'put',
      `/classes/sessions/${item.sessions[0].id}/attendance`,
      { entries: [{ memberId: f.member.id, status: 'PRESENT' }] },
      token,
    );
    expect(attempted.status).toBe(422);
    expect(
      (await prisma.attendance.findFirstOrThrow({ where: { memberId: f.member.id } })).status,
    ).toBe('EXCUSED');
  });
  it('TC-CANCEL-DATA-02: không tạo nhận xét buổi sau hủy nhờ bản ghi xin nghỉ cũ', async () => {
    const token = laterToken();
    const saved = await f.call(
      'put',
      `/classes/sessions/${item.sessions[0].id}/feedback/${f.member.id}`,
      { note: 'Không được cấp lại quyền học', expectedVersion: 0 },
      token,
    );
    expect(saved.status).toBe(422);
    expect(await prisma.sessionFeedback.count({ where: { memberId: f.member.id } })).toBe(0);
    expect(await prisma.attendance.count({ where: { memberId: f.member.id } })).toBe(1);
  });
});
