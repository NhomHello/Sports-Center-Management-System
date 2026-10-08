import { SearchOutlined } from '@ant-design/icons';
import { Button, Input } from 'antd';
import '@/styles/controlExperience.css';

/** Giữ callback của Ant Design; nhãn và chiều cao dùng chung cho mọi ô tìm kiếm. */
export function SearchInput({ className = '', showButton = true, enterButton, ...props }) {
  const Control = showButton ? Input.Search : Input;
  const searchProps = showButton
    ? {
        enterButton: enterButton ?? (
          <Button icon={<SearchOutlined />} aria-label="Thực hiện tìm kiếm" htmlType="button" />
        ),
      }
    : {};

  return (
    <Control
      allowClear
      {...props}
      {...searchProps}
      aria-label={props['aria-label'] || props.placeholder || 'Tìm kiếm'}
      className={`scms-search-input ${showButton ? '' : 'scms-search-input--plain'} ${className}`}
    />
  );
}
