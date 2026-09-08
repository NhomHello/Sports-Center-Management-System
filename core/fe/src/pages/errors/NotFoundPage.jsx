import { Button, Result } from 'antd';
import { Link } from 'react-router';
import { ROUTES } from '@/constants';

export function NotFoundPage() {
  return (
    <Result
      status="404"
      title="404"
      subTitle="Trang bạn tìm không tồn tại"
      extra={
        <Link to={ROUTES.DASHBOARD}>
          <Button type="primary">Về trang chủ</Button>
        </Link>
      }
    />
  );
}
