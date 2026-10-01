import { SETTING_TYPES } from './settings.js';

const validateNumber = (setting, value) => {
  const number = Number(value);
  if (
    value === null ||
    value === undefined ||
    String(value).trim() === '' ||
    !Number.isFinite(number)
  )
    return 'Nhập một số hợp lệ';
  if (setting.integer && !Number.isInteger(number)) return 'Giá trị phải là số nguyên';
  if (setting.minValue !== undefined && number < setting.minValue)
    return `Giá trị tối thiểu là ${setting.minValue}`;
  if (setting.maxValue !== undefined && number > setting.maxValue)
    return `Giá trị tối đa là ${setting.maxValue}`;
  return null;
};

const validateJson = (_setting, value) => {
  try {
    JSON.parse(value);
    return null;
  } catch {
    return 'Nhập JSON hợp lệ';
  }
};

const VALIDATORS = {
  [SETTING_TYPES.NUMBER]: validateNumber,
  [SETTING_TYPES.JSON]: validateJson,
  [SETTING_TYPES.BOOLEAN]: (_setting, value) =>
    [true, false, 'true', 'false'].includes(value) ? null : 'Giá trị phải là true hoặc false',
};

/** Kiểm tra theo metadata API; dùng chung FE/BE, không đoán miền cho cấu hình lạ. */
export const getSettingValidationError = (setting, value) => {
  if (setting.required && (value === null || value === undefined || String(value).trim() === ''))
    return 'Không được để trống';
  if (
    setting.maxLength !== undefined &&
    typeof value === 'string' &&
    value.length > setting.maxLength
  )
    return `Tối đa ${setting.maxLength} ký tự`;
  const typeError = VALIDATORS[setting.type]?.(setting, value);
  if (typeError) return typeError;
  if (setting.format === 'currency' && !Intl.supportedValuesOf('currency').includes(value))
    return 'Mã tiền tệ không được hỗ trợ';
  if (setting.format === 'invoicePrefix' && !/^[A-Za-z0-9_-]+$/.test(value))
    return 'Tiền tố chỉ chứa chữ, số, gạch ngang hoặc gạch dưới';
  if (setting.options && !setting.options.some((option) => (option.value ?? option) === value))
    return 'Chọn giá trị trong danh sách cho phép';
  return null;
};
