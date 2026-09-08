import { Button, Result } from 'antd';
import { Link } from 'react-router';
import { ROUTES } from '@/constants';

export function ForbiddenPage() {
  return (
    <Result
      status="403"
      title="403"
      subTitle="Bạn không có quyền truy cập trang này"
      extra={
        <Link to={ROUTES.DASHBOARD}>
          <Button type="primary">Về trang chủ</Button>
        </Link>
      }
    />
  );
}
