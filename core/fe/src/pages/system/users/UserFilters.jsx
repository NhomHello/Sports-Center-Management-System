import { Select, Space } from 'antd';
import { SearchInput } from '@/components/common/SearchInput';
import { SPACING } from '@/theme/theme';

const FILTER_WIDTH = 220;

/**
 * Thanh loc cua bang tai khoan. Goi onChange({ search?, roleId? }) -> useTableQuery.setFilters.
 * @param {{ roleOptions: { value: number, label: string }[], onChange: (filters: object) => void }} props
 */
export function UserFilters({ roleOptions, onChange }) {
  return (
    <Space style={{ marginBottom: SPACING.MD }} wrap>
      <SearchInput
        allowClear
        placeholder="Tìm theo tên, email, SĐT"
        style={{ width: FILTER_WIDTH }}
        onSearch={(search) => onChange({ search: search || undefined })}
      />
      <Select
        allowClear
        placeholder="Lọc theo vai trò"
        style={{ width: FILTER_WIDTH }}
        options={roleOptions}
        onChange={(roleId) => onChange({ roleId })}
      />
    </Space>
  );
}
