import { Card, Checkbox, Flex, Typography } from 'antd';
import { SPACING } from '@/theme/theme';

/**
 * Ma tran phan quyen: moi module mot the, checkbox tung action + "chon tat ca".
 * Controlled: value = mang permission code, onChange(nextCodes).
 * @param {{ groups: { module: string, moduleLabel: string, permissions: { code: string, label: string }[] }[], value: string[], onChange: (codes: string[]) => void, disabled?: boolean }} props
 */
export function PermissionMatrix({ groups, value = [], onChange, disabled = false }) {
  const selected = new Set(value);

  const toggleModule = (group, checked) => {
    const codes = group.permissions.map((p) => p.code);
    const next = new Set(selected);
    codes.forEach((code) => (checked ? next.add(code) : next.delete(code)));
    onChange([...next]);
  };

  const toggleOne = (code, checked) => {
    const next = new Set(selected);
    if (checked) next.add(code);
    else next.delete(code);
    onChange([...next]);
  };

  return (
    <Flex vertical gap={SPACING.SM}>
      {groups.map((group) => {
        const codes = group.permissions.map((p) => p.code);
        const checkedCount = codes.filter((code) => selected.has(code)).length;
        const allChecked = checkedCount === codes.length;
        return (
          <Card
            key={group.module}
            size="small"
            title={
              <Checkbox
                disabled={disabled}
                checked={allChecked}
                indeterminate={checkedCount > 0 && !allChecked}
                onChange={(e) => toggleModule(group, e.target.checked)}
              >
                <Typography.Text strong>{group.moduleLabel}</Typography.Text>
              </Checkbox>
            }
          >
            <Flex wrap gap={SPACING.MD}>
              {group.permissions.map((permission) => (
                <Checkbox
                  key={permission.code}
                  disabled={disabled}
                  checked={selected.has(permission.code)}
                  onChange={(e) => toggleOne(permission.code, e.target.checked)}
                >
                  {permission.label}
                </Checkbox>
              ))}
            </Flex>
          </Card>
        );
      })}
    </Flex>
  );
}
