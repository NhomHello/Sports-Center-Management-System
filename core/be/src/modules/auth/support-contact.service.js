import { SETTING_KEYS } from '@scms/shared';
import * as settingService from '../setting/setting.service.js';

/**
 * Thông tin liên hệ công khai để hội viên nhờ nhân viên hỗ trợ (ví dụ xác minh email thủ công).
 * Chỉ trả các trường an toàn để hiển thị trước khi đăng nhập; chuỗi rỗng => null (FE ẩn).
 */
export const getSupportContacts = async () => {
  const [centerName, phone, zaloUrl, facebookUrl] = await Promise.all(
    [
      SETTING_KEYS.CENTER_NAME,
      SETTING_KEYS.CENTER_PHONE,
      SETTING_KEYS.CENTER_SUPPORT_ZALO_URL,
      SETTING_KEYS.CENTER_SUPPORT_FACEBOOK_URL,
    ].map((key) => settingService.getValue(key)),
  );
  return { centerName, phone, zaloUrl: zaloUrl || null, facebookUrl: facebookUrl || null };
};
