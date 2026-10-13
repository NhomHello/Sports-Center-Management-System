import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { Button, Form, Input, Typography } from 'antd';
import { Link } from 'react-router';
import { EmailNotVerifiedNotice } from '@/components/auth/EmailNotVerifiedNotice';
import { ROUTES } from '@/constants';
import { useLogin } from '@/hooks/useLogin';

/** Đăng nhập và chuyển tới màn hình được phép sử dụng của tài khoản hiện tại. */
export function LoginPage() {
  const [form] = Form.useForm();
  const { loginMutation, unverifiedEmail } = useLogin(form);

  return (
    <Form form={form} layout="vertical" onFinish={loginMutation.mutate} autoComplete="on">
      {unverifiedEmail && (
        <EmailNotVerifiedNotice
          email={unverifiedEmail}
          title="Email chưa được xác minh"
          description={`Mở liên kết trong email chúng tôi đã gửi tới ${unverifiedEmail} để xác minh trước khi đăng nhập.`}
        />
      )}
      <Form.Item
        name="email"
        label="Email hoặc số điện thoại"
        rules={[{ required: true, message: 'Nhập email hoặc số điện thoại' }]}
      >
        <Input
          prefix={<UserOutlined />}
          placeholder="Email hoặc số điện thoại của bạn"
          autoComplete="username"
        />
      </Form.Item>
      <Form.Item
        name="password"
        label="Mật khẩu"
        rules={[{ required: true, message: 'Nhập mật khẩu' }]}
      >
        <Input.Password
          prefix={<LockOutlined />}
          placeholder="Nhập mật khẩu"
          autoComplete="current-password"
        />
      </Form.Item>
      <Typography.Paragraph className="scms-login-forgot">
        <Link to={ROUTES.FORGOT_PASSWORD}>Quên mật khẩu?</Link>
      </Typography.Paragraph>
      <Form.Item>
        <Button type="primary" htmlType="submit" block loading={loginMutation.isPending}>
          Đăng nhập
        </Button>
      </Form.Item>
      <Typography.Paragraph className="scms-login-register">
        Chưa có tài khoản? <Link to={ROUTES.REGISTER}>Đăng ký</Link>
      </Typography.Paragraph>
    </Form>
  );
}
