import { Form, Input, InputNumber, Switch, Select } from 'antd';
import { getSettingValidationError, SETTING_TYPES } from '@scms/shared';

const INPUT_BY_TYPE = {
  NUMBER: (setting) => (
    <InputNumber
      min={setting.minValue}
      max={setting.maxValue}
      precision={setting.integer ? 0 : undefined}
      addonAfter={setting.unit}
      style={{ width: '100%' }}
    />
  ),
  BOOLEAN: () => <Switch />,
  JSON: () => <Input.TextArea rows={3} />,
  STRING: (setting) => <Input maxLength={setting.maxLength} />,
};

/**
 * Mot o nhap cau hinh, chon input theo type (STRING / NUMBER / BOOLEAN / JSON).
 * @param {{ setting: { key: string, type: string, label: string, description?: string } }} props
 */
function SettingDescription({ setting }) {
  const range =
    setting.minValue !== undefined || setting.maxValue !== undefined
      ? `Miền giá trị: ${setting.minValue ?? '−∞'} đến ${setting.maxValue ?? '+∞'}`
      : null;
  const details = [
    setting.unit && `Đơn vị: ${setting.unit}`,
    range,
    setting.maxLength !== undefined && `Tối đa ${setting.maxLength} ký tự`,
  ]
    .filter(Boolean)
    .join(' · ');
  return (
    <>
      {setting.description && <div>{setting.description}</div>}
      {details && <div>{details}</div>}
    </>
  );
}

/** Input và validation lấy từ metadata API, kể cả các khóa được bổ sung sau. */
export function SettingField({ setting }) {
  const renderInput = INPUT_BY_TYPE[setting.type] ?? INPUT_BY_TYPE.STRING;
  const isBoolean = setting.type === SETTING_TYPES.BOOLEAN;
  return (
    <Form.Item
      name={setting.key}
      label={setting.label}
      extra={<SettingDescription setting={setting} />}
      valuePropName={isBoolean ? 'checked' : 'value'}
      rules={[
        {
          validator: (_rule, value) => {
            const error = getSettingValidationError(setting, value);
            return error ? Promise.reject(new Error(error)) : Promise.resolve();
          },
        },
      ]}
    >
      {setting.options ? (
        <Select
          options={setting.options.map((option) =>
            typeof option === 'object' ? option : { value: option, label: option },
          )}
        />
      ) : (
        renderInput(setting)
      )}
    </Form.Item>
  );
}
