import { beforeAll, afterAll, describe, expect, it } from 'vitest';
import { api, apiPath, bearer } from './helpers/api.js';
import { createSprintFixture, cleanupSprintFixture } from './helpers/sprint1.js';
let f;
beforeAll(async () => { f = await createSprintFixture(); });
afterAll(async () => cleanupSprintFixture(f));
describe('TC-COURSE-CUTOVER: ngừng bán gói tự tập', () => {
  it('TC-COURSE-CUTOVER-01: API mua/gia hạn/bảo lưu/danh mục gói trả 410, không tạo dữ liệu mới', async () => {
    for (const [method, path] of [['post', '/memberships/orders'], ['post', '/memberships/me/orders'], ['post', '/memberships/1/freezes'], ['post', '/memberships/1/change'], ['get', '/membership-plans'], ['post', '/membership-plans']]) {
      const res = await api[method](apiPath(path)).set(bearer(f.adminToken)).send({ planId: 1, memberId: f.member.id });
      expect(res.status).toBe(410); expect(res.body.message).toContain('khóa học');
    }
  });
  it('TC-COURSE-CUTOVER-02: hồ sơ cá nhân không trả gói tập hoặc đề nghị mua/gia hạn', async () => {
    const res = await api.get(apiPath('/members/me')).set(bearer(f.memberToken));
    expect(res.status).toBe(200); expect(res.body.data).not.toHaveProperty('memberships');
    expect(res.body.data).not.toHaveProperty('currentMembership'); expect(res.body.data.activeCourseCount).toBe(0);
  });
});
