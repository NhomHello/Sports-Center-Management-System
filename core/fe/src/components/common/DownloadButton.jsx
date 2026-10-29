import { LoadingOutlined } from '@ant-design/icons';
import { Button } from 'antd';
/** Trạng thái tải được điều khiển trực tiếp để nút mở lại sau tải tệp liên tiếp. */
export function DownloadButton({ pending, disabled = false, onClick, children }) {
  return (
    <Button
      aria-label={children}
      disabled={pending || disabled}
      icon={pending ? <LoadingOutlined spin /> : undefined}
      onClick={onClick}
    >
      {children}
    </Button>
  );
}
