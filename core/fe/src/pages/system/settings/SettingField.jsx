import { Form, Input, InputNumber, Switch } from 'antd';

const INPUT_BY_TYPE = {
  NUMBER: () => <InputNumber style={{ width: '100%' }} />,
  BOOLEAN: () => <Switch />,
  JSON: () => <Input.TextArea rows={3} />,
  STRING: () => <Input />,
};

/**
 * Mot o nhap cau hinh, chon input theo type (STRING / NUMBER / BOOLEAN / JSON).
 * @param {{ setting: { key: string, type: string, label: string, description?: string } }} props
 */
export function SettingField({ setting }) {
  const renderInput = INPUT_BY_TYPE[setting.type] ?? INPUT_BY_TYPE.STRING;
  const isBoolean = setting.type === 'BOOLEAN';
  return (
    <Form.Item
      name={setting.key}
      label={setting.label}
      tooltip={setting.description}
      extra={<code>{setting.key}</code>}
      valuePropName={isBoolean ? 'checked' : 'value'}
      rules={[{ required: !isBoolean, message: 'Không được để trống' }]}
    >
      {renderInput()}
    </Form.Item>
  );
}
