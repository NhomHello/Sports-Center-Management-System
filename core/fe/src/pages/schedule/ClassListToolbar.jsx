import { FilterOutlined, PlusOutlined } from '@ant-design/icons';
import { Button } from 'antd';
import { SearchInput } from '@/components/common/SearchInput';

/** Từ khóa đang nhập độc lập với điều kiện đã gửi; reset đồng bộ input và kết quả. */
export function ClassListToolbar({ search, onSearchChange, onSearch, onCreate, filters }) {
  return (
    <div className="scms-class-list-toolbar">
      <SearchInput
        aria-label="Tìm tên lớp"
        placeholder="Tìm tên lớp"
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
        onSearch={onSearch}
      />
      {filters && (
        <Button
          aria-expanded={filters.open}
          icon={<FilterOutlined aria-hidden="true" />}
          onClick={filters.toggle}
        >
          Bộ lọc{filters.count > 0 ? ` (${filters.count})` : ''}
        </Button>
      )}
      {onCreate && (
        <Button aria-label="Tạo lớp" type="primary" icon={<PlusOutlined />} onClick={onCreate}>
          Tạo lớp
        </Button>
      )}
    </div>
  );
}
