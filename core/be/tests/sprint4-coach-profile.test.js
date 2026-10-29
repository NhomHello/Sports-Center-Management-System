import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { SETTING_KEYS as K } from '@scms/shared';
import { prisma } from '../src/config/db.js';
import { api, apiPath, bearer } from './helpers/api.js';
import { createProfileFixture, cleanupProfileFixture } from './helpers/profiles.js';
let f;
const call = (method, path, body, token) => f.call(method, path, body, token);
beforeAll(async () => {
  f = await createProfileFixture();
});
afterAll(async () => {
  await cleanupProfileFixture(f);
});
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jw5sAAAAASUVORK5CYII=',
  'base64',
);
describe('UC-UM-22/23: hồ sơ HLV', () => {
  it('email công khai mặc định riêng với email đăng nhập; kiểm tra quyền và độ dài cấu hình', async () => {
    const own = await call('get', '/me/coach-profile', undefined, f.coachToken);
    expect(own.status).toBe(200);
    expect(own.body.data.publicEmail).toBe(f.coach.email);
    expect((await call('put', '/me/coach-profile', { bio: 'Không được sửa' })).status).toBe(403);
    const res = await call(
      'put',
      '/me/coach-profile',
      {
        bio: 'HLV yoga phục hồi',
        publicEmail: 'contact@scms.test',
        showContact: false,
        experienceYears: 5,
        certifications: ['Chứng chỉ yoga'],
      },
      f.coachToken,
    );
    expect(res.status).toBe(200);
    expect((await prisma.user.findUniqueOrThrow({ where: { id: f.coach.id } })).email).toBe(
      f.coach.email,
    );
    const limit = Number(
      (await prisma.systemSetting.findUniqueOrThrow({ where: { key: K.COACH_BIO_MAX_LENGTH } }))
        .value,
    );
    expect(
      (await call('put', '/me/coach-profile', { bio: 'a'.repeat(limit + 1) }, f.coachToken)).status,
    ).toBe(400);
    expect(
      (await call('put', '/me/coach-profile', { userId: f.coachOther.id }, f.coachToken)).status,
    ).toBe(400);
  });
  it('ẩn toàn bộ liên hệ ở API khi tắt chia sẻ, danh sách không lộ role/ngày tạo', async () => {
    const detail = await call('get', `/coaches/${f.coach.id}`);
    expect(detail.status).toBe(200);
    expect(detail.body.data.contact).toBeUndefined();
    for (const key of [
      'email',
      'phone',
      'role',
      'passwordHash',
      'status',
      'createdAt',
      'publicEmail',
    ])
      expect(detail.body.data).not.toHaveProperty(key);
    const list = await api
      .get(apiPath('/coaches'))
      .set(bearer(f.memberToken))
      .query({ q: f.coach.fullName, subjectId: f.subject.id });
    expect(list.status).toBe(200);
    expect(list.body.meta.total).toBe(2);
    expect(list.body.data[0]).toMatchObject({
      id: f.coach.id,
      openClassCount: 1,
      averageRating: null,
    });
    await call('put', '/me/coach-profile', { showContact: true }, f.coachToken);
    expect((await call('get', `/coaches/${f.coach.id}`)).body.data.contact.email).toBe(
      'contact@scms.test',
    );
  });
  it('chỉ nhận JPG/PNG tối đa 2 MB, tải ảnh cần JWT và audit không lưu blob', async () => {
    const upload = await api
      .put(apiPath('/me/coach-profile/avatar'))
      .set(bearer(f.coachToken))
      .set('Content-Type', 'image/png')
      .send(PNG);
    expect(upload.status).toBe(200);
    const image = await call('get', `/coaches/${f.coach.id}/avatar`);
    expect(image.status).toBe(200);
    expect(image.headers['content-type']).toContain('image/png');
    expect((await api.get(apiPath(`/coaches/${f.coach.id}/avatar`))).status).toBe(401);
    expect(
      (
        await api
          .put(apiPath('/me/coach-profile/avatar'))
          .set(bearer(f.coachToken))
          .set('Content-Type', 'image/png')
          .send(Buffer.from('<svg/>'))
      ).status,
    ).toBe(400);
    expect(
      (
        await api
          .put(apiPath('/me/coach-profile/avatar'))
          .set(bearer(f.coachToken))
          .set('Content-Type', 'image/png')
          .send(Buffer.alloc(2 * 1024 * 1024 + 1))
      ).status,
    ).toBe(400);
    const audit = await prisma.auditLog.findFirstOrThrow({
      where: { userId: f.coach.id, entity: 'coachProfile' },
      orderBy: { id: 'desc' },
    });
    expect(audit.meta).toEqual({ fields: expect.arrayContaining(['avatarData', 'avatarMime']) });
  });
  it('điểm trung bình giữ nhận xét ẩn danh và trả 404 cho HLV bị khoá', async () => {
    await prisma.courseRating.create({
      data: {
        classId: f.item.id,
        memberId: f.member.id,
        coachId: f.coach.id,
        courseStars: 4,
        coachStars: 5,
        comment: 'Rất tận tâm',
      },
    });
    const detail = (await call('get', `/coaches/${f.coach.id}`)).body.data;
    expect(detail.averageRating).toBe(5);
    expect(detail.ratings[0].memberName).not.toBe(f.member.fullName);
    expect(detail.ratings[0].memberId).toBeUndefined();
    await prisma.user.update({ where: { id: f.coach.id }, data: { status: 'INACTIVE' } });
    expect((await call('get', `/coaches/${f.coach.id}`)).status).toBe(404);
    await prisma.user.update({ where: { id: f.coach.id }, data: { status: 'ACTIVE' } });
  });
});
