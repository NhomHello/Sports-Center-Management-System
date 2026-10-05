import { SETTING_TYPES } from '@scms/shared';

/** Parse dữ liệu API cho input; không lấy default hoặc miền giá trị từ FE. */
export const getSettingFormValues = (groups) =>
  Object.fromEntries(
    groups.flatMap((group) =>
      group.items.map((setting) => {
        let value = setting.value;
        if (setting.type === SETTING_TYPES.NUMBER) value = Number(setting.value);
        if (setting.type === SETTING_TYPES.BOOLEAN) value = setting.value === 'true';
        return [setting.key, value];
      }),
    ),
  );

/** Chỉ gửi khóa có metadata API và giá trị thực sự đã thay đổi. */
export const getChangedSettingPayload = (values, groups) =>
  groups.flatMap((group) =>
    group.items
      .filter(
        (setting) =>
          setting.editable !== false &&
          values[setting.key] !== undefined &&
          String(values[setting.key]) !== setting.value,
      )
      .map((setting) => ({ key: setting.key, value: String(values[setting.key] ?? '') })),
  );
