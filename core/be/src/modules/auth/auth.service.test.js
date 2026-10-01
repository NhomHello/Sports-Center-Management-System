import { describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  findUnique: vi.fn(),
  update: vi.fn(),
  comparePassword: vi.fn(),
  hashPassword: vi.fn(),
  recordAudit: vi.fn(),
}));

vi.mock('../../config/db.js', () => ({
  Enums: { UserStatus: { ACTIVE: 'ACTIVE' } },
  prisma: { user: { findUnique: mocks.findUnique, update: mocks.update } },
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
    mocks.findUnique.mockResolvedValue({ id: 7, passwordHash: 'old-hash' });
    mocks.comparePassword.mockResolvedValue(true);
    mocks.hashPassword.mockResolvedValue('new-hash');
    mocks.update.mockResolvedValue({ id: 7 });
    mocks.recordAudit.mockResolvedValue();
    await changePassword(7, { currentPassword: 'old-password', password: 'new-password' });
    expect(mocks.update).toHaveBeenCalledWith({
      where: { id: 7 },
      data: { passwordHash: 'new-hash', tokenVersion: { increment: 1 } },
    });
  });
});
