import { describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  findMany: vi.fn(),
  update: vi.fn(),
  transaction: vi.fn(),
  recordAudit: vi.fn(),
}));

vi.mock('../../config/db.js', () => ({
  Enums: { SettingType: { STRING: 'STRING', NUMBER: 'NUMBER', BOOLEAN: 'BOOLEAN', JSON: 'JSON' } },
  prisma: {
    systemSetting: { findMany: mocks.findMany, update: mocks.update },
    $transaction: mocks.transaction,
  },
}));
vi.mock('../../config/env.js', () => ({ env: { SETTING_CACHE_TTL_SECONDS: 60 } }));
vi.mock('../../common/utils/audit.js', () => ({ recordAudit: mocks.recordAudit }));

const { updateMany } = await import('./setting.service.js');

describe('updateMany settings', () => {
  it('TC-F1-06: từ chối số ngoài miền cấu hình', async () => {
    mocks.findMany.mockResolvedValue([
      { key: 'MEMBERSHIP_EXPIRY_REMINDER_DAYS', value: '7', type: 'NUMBER' },
    ]);
    await expect(
      updateMany([{ key: 'MEMBERSHIP_EXPIRY_REMINDER_DAYS', value: '0' }], { id: 1 }),
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it('TC-F1-07: audit giá trị trước và sau khi cập nhật', async () => {
    mocks.findMany.mockResolvedValue([{ key: 'CENTER_NAME', value: 'Cũ', type: 'STRING' }]);
    mocks.transaction.mockResolvedValue([]);
    mocks.recordAudit.mockResolvedValue();
    await updateMany([{ key: 'CENTER_NAME', value: 'Mới' }], { id: 1 });
    expect(mocks.recordAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        meta: { changes: [{ key: 'CENTER_NAME', before: 'Cũ', after: 'Mới' }] },
      }),
    );
  });
});
