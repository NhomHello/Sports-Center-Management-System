import { describe, expect, it } from 'vitest';
import { hasAllPermissions, hasAnyPermission } from './permission';

const granted = ['role.read', 'role.update'];

describe('hasAnyPermission', () => {
  it('true khi khong yeu cau quyen', () => {
    expect(hasAnyPermission(granted, undefined)).toBe(true);
    expect(hasAnyPermission(granted, [])).toBe(true);
    expect(hasAnyPermission(granted, [undefined])).toBe(true);
    expect(hasAnyPermission([], [undefined])).toBe(true);
  });

  it('true khi co it nhat mot quyen', () => {
    expect(hasAnyPermission(granted, 'role.read')).toBe(true);
    expect(hasAnyPermission(granted, ['role.delete', 'role.update'])).toBe(true);
  });

  it('false khi khong co quyen nao', () => {
    expect(hasAnyPermission(granted, 'role.delete')).toBe(false);
  });

  it('nhan Set lam granted', () => {
    expect(hasAnyPermission(new Set(granted), 'role.read')).toBe(true);
  });

  it('vẫn chặn permission thực khi rest args có giá trị trống', () => {
    expect(hasAnyPermission([], [undefined, 'setting.read'])).toBe(false);
    expect(hasAnyPermission(granted, [undefined, 'role.read'])).toBe(true);
  });
});

describe('hasAllPermissions', () => {
  it('true khi du tat ca', () => {
    expect(hasAllPermissions(granted, ['role.read', 'role.update'])).toBe(true);
  });

  it('false khi thieu mot', () => {
    expect(hasAllPermissions(granted, ['role.read', 'role.delete'])).toBe(false);
  });
});
