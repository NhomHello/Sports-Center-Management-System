import { describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  findMany: vi.fn(),
  update: vi.fn(),
  auditCreate: vi.fn(),
  transaction: vi.fn(),
}));

vi.mock('../../config/db.js', () => ({
  Enums: { SettingType: { STRING: 'STRING', NUMBER: 'NUMBER', BOOLEAN: 'BOOLEAN', JSON: 'JSON' } },
  prisma: {
    systemSetting: { findMany: mocks.findMany, update: mocks.update },
    $transaction: (callback) =>
      typeof callback === 'function'
        ? callback({
            systemSetting: { update: mocks.update },
            auditLog: { create: mocks.auditCreate },
          })
        : mocks.transaction(callback),
  },
}));
vi.mock('../../config/env.js', () => ({ env: { SETTING_CACHE_TTL_SECONDS: 60 } }));

const { updateMany } = await import('./setting.service.js');

describe('updateMany settings', () => {
  it('TC-F1-06: từ chối số ngoài miền cấu hình', async () => {
    mocks.findMany.mockResolvedValue([
      { key: 'MEMBERSHIP_EXPIRY_REMINDER_DAYS', value: '7', type: 'NUMBER' },
    ]);
    await expect(
      updateMany([{ key: 'MEMBERSHIP_EXPIRY_REMINDER_DAYS', value: '-1' }], { id: 1 }),
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it('TC-F1-07: audit giá trị trước và sau khi cập nhật', async () => {
    mocks.findMany.mockResolvedValue([{ key: 'CENTER_NAME', value: 'Cũ', type: 'STRING' }]);
    mocks.update.mockResolvedValue({});
    mocks.auditCreate.mockResolvedValue({ id: 1 });
    await updateMany([{ key: 'CENTER_NAME', value: 'Mới' }], { id: 1 });
    expect(mocks.auditCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        meta: {
          before: [{ key: 'CENTER_NAME', value: 'Cũ' }],
          after: [{ key: 'CENTER_NAME', value: 'Mới' }],
        },
      }),
    });
  });
});
