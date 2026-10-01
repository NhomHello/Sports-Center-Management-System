import { describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  notification: {
    findMany: vi.fn(),
    updateMany: vi.fn(),
  },
}));

vi.mock('../../config/db.js', () => ({
  Enums: {
    SettingType: { STRING: 'STRING', NUMBER: 'NUMBER', BOOLEAN: 'BOOLEAN', JSON: 'JSON' },
    MembershipStatus: { ACTIVE: 'ACTIVE' },
    NotificationKind: { MEMBERSHIP_EXPIRY_REMINDER: 'MEMBERSHIP_EXPIRY_REMINDER' },
  },
  prisma: { notification: mocks.notification },
}));
vi.mock('../../config/env.js', () => ({ env: { SETTING_CACHE_TTL_SECONDS: 60 } }));

const { markManyRead } = await import('./notification.service.js');

describe('markManyRead', () => {
  it('TC-F1-08: chỉ cập nhật thông báo thuộc người dùng và bỏ id trùng', async () => {
    mocks.notification.findMany
      .mockResolvedValueOnce([{ id: 1 }, { id: 2 }])
      .mockResolvedValueOnce([
        { id: 2, readAt: new Date() },
        { id: 1, readAt: new Date() },
      ]);
    mocks.notification.updateMany.mockResolvedValue({ count: 2 });
    const result = await markManyRead([1, 1, 2], 9);
    expect(result).toHaveLength(2);
    expect(mocks.notification.updateMany).toHaveBeenCalledWith({
      where: { id: { in: [1, 2] }, userId: 9, readAt: null },
      data: { readAt: expect.any(Date) },
    });
  });

  it('TC-F1-09: không cho cập nhật thông báo ngoài quyền sở hữu', async () => {
    mocks.notification.findMany.mockReset().mockResolvedValueOnce([{ id: 1 }]);
    await expect(markManyRead([1, 2], 9)).rejects.toMatchObject({ statusCode: 404 });
  });
});
