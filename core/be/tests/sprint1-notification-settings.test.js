import { PERMISSIONS, SETTING_KEYS } from '@scms/shared';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Enums, prisma } from '../src/config/db.js';
import { api, apiPath, bearer, loginAs } from './helpers/api.js';
import { cleanupSprintFixture, createSprintFixture } from './helpers/sprint1.js';

let fixture;
beforeAll(async () => {
  fixture = await createSprintFixture();
});
afterAll(async () => {
  await cleanupSprintFixture(fixture);
});

describe('Sprint 1: thông báo chính chủ', () => {
  it('phân trang có tổng chưa đọc trên toàn bộ dữ liệu, không lẫn thông báo người khác', async () => {
    await prisma.notification.createMany({
      data: [0, 1, 2].map((number) => ({
        userId: fixture.member.id,
        kind: Enums.NotificationKind.CLASS_CHANGED,
        title: `${fixture.prefix} ${number}`,
        message: 'Thông báo dùng riêng trong kiểm thử',
      })),
    });
    await prisma.notification.create({
      data: {
        userId: fixture.other.id,
        kind: Enums.NotificationKind.CLASS_CANCELLED,
        title: fixture.prefix,
        message: 'Của người khác',
      },
    });
    const list = await api
      .get(apiPath('/notifications?pageSize=1'))
      .set(bearer(fixture.memberToken));
    expect(list.status).toBe(200);
    expect(list.body.data).toHaveLength(1);
    expect(list.body.data[0].userId).toBe(fixture.member.id);
    expect(list.body.meta.total).toBe(3);
    expect(list.body.meta.unreadCount).toBe(3);
  });

  it('đọc lặp không đổi thời điểm đọc; lọc và tổng chưa đọc được cập nhật', async () => {
    const item = await prisma.notification.findFirstOrThrow({
      where: { userId: fixture.member.id },
    });
    const first = await api
      .patch(apiPath(`/notifications/${item.id}/read`))
      .set(bearer(fixture.memberToken));
    const repeated = await api
      .patch(apiPath(`/notifications/${item.id}/read`))
      .set(bearer(fixture.memberToken));
    expect(first.status).toBe(200);
    expect(repeated.body.data.readAt).toBe(first.body.data.readAt);
    const unread = await api
      .get(apiPath('/notifications?readStatus=UNREAD'))
      .set(bearer(fixture.memberToken));
    expect(unread.body.meta.total).toBe(2);
    expect(unread.body.meta.unreadCount).toBe(2);
    expect(unread.body.data.every((notification) => notification.readAt === null)).toBe(true);
    const read = await api
      .get(apiPath('/notifications?readStatus=READ'))
      .set(bearer(fixture.memberToken));
    expect(read.body.data).toHaveLength(1);
  });

  it('không thể đánh dấu thông báo của người khác hoặc gọi khi chưa xác thực', async () => {
    const item = await prisma.notification.findFirstOrThrow({
      where: { userId: fixture.other.id },
    });
    expect(
      (await api.patch(apiPath(`/notifications/${item.id}/read`)).set(bearer(fixture.memberToken)))
        .status,
    ).toBe(404);
    expect(
      (await prisma.notification.findUniqueOrThrow({ where: { id: item.id } })).readAt,
    ).toBeNull();
    expect((await api.get(apiPath('/notifications'))).status).toBe(401);
  });
});

describe('Sprint 1: metadata, validation và quyền cấu hình', () => {
  it('API trả đơn vị/miền được định nghĩa; sai miền, số vô hạn và JSON lỗi không được lưu', async () => {
    const list = await api.get(apiPath('/settings')).set(bearer(fixture.adminToken));
    expect(list.status).toBe(200);
    const setting = list.body.data
      .flatMap((group) => group.items)
      .find((item) => item.key === SETTING_KEYS.MEMBERSHIP_EXPIRY_REMINDER_DAYS);
    expect(setting.unit).toBe('ngày');
    expect(setting.minValue).toBe(0);
    const prefix = list.body.data
      .flatMap((group) => group.items)
      .find((item) => item.key === SETTING_KEYS.INVOICE_CODE_PREFIX);
    expect(prefix.maxLength).toBe(30);
    const centerSettings = list.body.data
      .flatMap((group) => group.items)
      .filter((item) =>
        [SETTING_KEYS.CENTER_ADDRESS, SETTING_KEYS.CENTER_PHONE].includes(item.key),
      );
    expect(centerSettings.every((item) => item.required)).toBe(true);
    expect(
      (
        await api
          .put(apiPath('/settings'))
          .set(bearer(fixture.adminToken))
          .send({ items: [{ key: SETTING_KEYS.CENTER_PHONE, value: 'không-phải-số' }] })
      ).status,
    ).toBe(400);
    expect(
      (
        await api
          .put(apiPath('/settings'))
          .set(bearer(fixture.adminToken))
          .send({ items: [{ key: prefix.key, value: 'A'.repeat(prefix.maxLength + 1) }] })
      ).status,
    ).toBe(400);
    for (const value of ['-1', 'Infinity', '1.5']) {
      const rejected = await api
        .put(apiPath('/settings'))
        .set(bearer(fixture.adminToken))
        .send({ items: [{ key: setting.key, value }] });
      expect(rejected.status).toBe(400);
    }
    expect(
      (await prisma.systemSetting.findUniqueOrThrow({ where: { key: setting.key } })).value,
    ).toBe(setting.value);
    const key = `${fixture.prefix}_JSON`;
    await prisma.systemSetting.create({
      data: {
        key,
        value: '{}',
        type: Enums.SettingType.JSON,
        group: 'TEST',
        label: 'Cấu hình kiểm thử',
      },
    });
    expect(
      (
        await api
          .put(apiPath('/settings'))
          .set(bearer(fixture.adminToken))
          .send({ items: [{ key, value: '{invalid}' }] })
      ).status,
    ).toBe(400);
    const saved = await api
      .put(apiPath('/settings'))
      .set(bearer(fixture.adminToken))
      .send({ items: [{ key, value: '{"enabled":false}' }] });
    expect(saved.status).toBe(200);
    const audit = await prisma.auditLog.findFirstOrThrow({
      where: { entity: 'SystemSetting', meta: { path: '$.after[0].key', equals: key } },
    });
    fixture.auditIds.push(audit.id);
    expect(audit.meta.before[0].value).toBe('{}');
    expect(audit.meta.after[0].value).toBe('{"enabled":false}');
  });

  it('role có quyền xem cấu hình nhưng không có quyền sửa nhận 403 khi cập nhật', async () => {
    const permission = await prisma.permission.findUniqueOrThrow({
      where: { code: PERMISSIONS.SETTING_READ },
    });
    const role = await prisma.role.create({
      data: {
        code: `TEST_${fixture.prefix.slice(-20)}`,
        name: fixture.prefix,
        permissions: { create: { permissionId: permission.id } },
      },
    });
    fixture.roleIds.push(role.id);
    const user = await prisma.user.create({
      data: {
        email: `${fixture.prefix}_view@scms.test`,
        fullName: 'Người chỉ xem cấu hình',
        roleId: role.id,
        passwordHash: fixture.member.passwordHash,
      },
    });
    fixture.userIds.push(user.id);
    const token = await loginAs(user.email, fixture.password);
    expect((await api.get(apiPath('/settings')).set(bearer(token))).status).toBe(200);
    expect(
      (
        await api
          .put(apiPath('/settings'))
          .set(bearer(token))
          .send({ items: [{ key: SETTING_KEYS.CENTER_NAME, value: 'Không được sửa' }] })
      ).status,
    ).toBe(403);
    const profile = await api.get(apiPath('/members/me')).set(bearer(token));
    expect(profile.status).toBe(200);
    expect(profile.body.data.membershipAccess).toBe(false);
  });
});
