import { LockOutlined, MailOutlined } from '@ant-design/icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { App, Button, Form, Input, Typography } from 'antd';
import { Link, useLocation, useNavigate } from 'react-router';
import { ROUTES } from '@/constants';
import * as authService from '@/services/auth.service';
import { useAuthStore } from '@/stores/authStore';

export function LoginPage() {
  const { message } = App.useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const setSession = useAuthStore((state) => state.setSession);
  const [form] = Form.useForm();

  const loginMutation = useMutation({
    mutationFn: authService.login,
    onSuccess: ({ data, message: msg }) => {
      queryClient.clear();
      setSession(data);
      message.success(msg);
      navigate(location.state?.from?.pathname ?? ROUTES.DASHBOARD, { replace: true });
    },
    onError: (error) => {
      form.setFields(error.toFormFields());
      message.error(error.message);
    },
  });

  return (
    <Form form={form} layout="vertical" onFinish={loginMutation.mutate} autoComplete="on">
      <Form.Item
        name="email"
        label="Email"
        rules={[
          { required: true, message: 'Nhập email' },
          { type: 'email', message: 'Email không hợp lệ' },
        ]}
      >
        <Input prefix={<MailOutlined />} placeholder="email@example.com" />
      </Form.Item>
      <Form.Item
        name="password"
        label="Mật khẩu"
        rules={[{ required: true, message: 'Nhập mật khẩu' }]}
      >
        <Input.Password prefix={<LockOutlined />} placeholder="••••••••" />
      </Form.Item>
      <Form.Item>
        <Button type="primary" htmlType="submit" block loading={loginMutation.isPending}>
          Đăng nhập
        </Button>
      </Form.Item>
      <Typography.Paragraph style={{ textAlign: 'center', marginBottom: 0 }}>
        Chưa có tài khoản? <Link to={ROUTES.REGISTER}>Đăng ký</Link>
      </Typography.Paragraph>
    </Form>
  );
}
