import { Button } from 'antd';
import { Link } from 'react-router';
import { PageHeader } from '@/components/common/PageHeader';
import { ROUTES } from '@/constants';
import { ChangePasswordForm } from './ChangePasswordForm';

/** Màn S20 có đường dẫn riêng để đổi mật khẩu không phụ thuộc dữ liệu hồ sơ. */
export default function ChangePasswordPage() {
  return (
    <>
      <PageHeader
        title="Đổi mật khẩu"
        subtitle="Xác minh mật khẩu hiện tại và đặt mật khẩu mới cho tài khoản của bạn"
        extra={
          <Link to={ROUTES.PROFILE}>
            <Button>Hồ sơ cá nhân</Button>
          </Link>
        }
      />
      <div className="scms-password-page">
        <ChangePasswordForm />
      </div>
    </>
  );
}
