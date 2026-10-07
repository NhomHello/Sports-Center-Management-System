/**
 * Ham thuan kiem tra quyen (khong phu thuoc React) - de test va tai su dung.
 */

/**
 * Co IT NHAT MOT quyen trong danh sach yeu cau. Khong yeu cau gi => true.
 * @param {Iterable<string>} granted
 * @param {string | string[] | undefined} required
 */
export const hasAnyPermission = (granted, required) => {
  const requiredList = normalize(required);
  if (requiredList.length === 0) return true;
  const grantedSet = granted instanceof Set ? granted : new Set(granted);
  return requiredList.some((code) => grantedSet.has(code));
};

/**
 * Co TAT CA quyen trong danh sach yeu cau.
 * @param {Iterable<string>} granted
 * @param {string | string[] | undefined} required
 */
export const hasAllPermissions = (granted, required) => {
  const requiredList = normalize(required);
  const grantedSet = granted instanceof Set ? granted : new Set(granted);
  return requiredList.every((code) => grantedSet.has(code));
};

/** @param {string | string[] | undefined} required */
const normalize = (required) => {
  if (!required) return [];
  // usePermission().can(undefined) dùng rest args nên nhận [undefined], không phải undefined.
  return Array.isArray(required)
    ? required.filter((code) => code !== undefined && code !== null)
    : [required];
};
