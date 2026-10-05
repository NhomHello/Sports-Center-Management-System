import { describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  findUnique: vi.fn(),
  updateMany: vi.fn(),
  auditCreate: vi.fn(),
  comparePassword: vi.fn(),
  hashPassword: vi.fn(),
  recordAudit: vi.fn(),
}));

vi.mock('../../config/db.js', () => ({
  Enums: { UserStatus: { ACTIVE: 'ACTIVE' } },
  prisma: {
    user: { findUniqueOrThrow: mocks.findUnique },
    $transaction: (callback) =>
      callback({
        user: { updateMany: mocks.updateMany },
        auditLog: { create: mocks.auditCreate },
      }),
  },
}));
vi.mock('../../common/utils/password.js', () => ({
  comparePassword: mocks.comparePassword,
  hashPassword: mocks.hashPassword,
}));
vi.mock('../../common/utils/audit.js', () => ({ recordAudit: mocks.recordAudit }));
vi.mock('../../common/utils/jwt.js', () => ({ signAccessToken: vi.fn() }));

const { changePassword } = await import('./auth.service.js');

describe('changePassword', () => {
  it('TC-F1-05: đổi hash và tăng tokenVersion để vô hiệu hoá token cũ', async () => {
    mocks.findUnique.mockResolvedValue({ id: 7, passwordHash: 'old-hash', tokenVersion: 2 });
    mocks.comparePassword.mockResolvedValue(true);
    mocks.hashPassword.mockResolvedValue('new-hash');
    mocks.updateMany.mockResolvedValue({ count: 1 });
    mocks.auditCreate.mockResolvedValue({ id: 1 });
    mocks.recordAudit.mockResolvedValue();
    await changePassword(7, { currentPassword: 'old-password', password: 'new-password' });
    expect(mocks.updateMany).toHaveBeenCalledWith({
      where: { id: 7, tokenVersion: 2 },
      data: { passwordHash: 'new-hash', tokenVersion: { increment: 1 } },
    });
  });
});
