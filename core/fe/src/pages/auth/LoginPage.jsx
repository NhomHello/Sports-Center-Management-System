import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { App, Button, Form, Input, Typography } from 'antd';
import { Link, useLocation, useNavigate } from 'react-router';
import { QUERY_KEYS, ROUTES } from '@/constants';
import { routeRegistry } from '@/router/routeRegistry';
import { resolvePostLoginPath } from '@/router/resolvePostLoginPath';
import * as authService from '@/services/auth.service';
import { useAuthStore } from '@/stores/authStore';

export function LoginPage() {
  const { message } = App.useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const setSession = useAuthStore((state) => state.setSession);
  const setProfile = useAuthStore((state) => state.setProfile);
  const clearSession = useAuthStore((state) => state.logout);
  const [form] = Form.useForm();

  const loginMutation = useMutation({
    mutationFn: authService.login,
    onSuccess: async ({ data, message: msg }) => {
      queryClient.clear();
      setSession(data);
      try {
        const profileResponse = await authService.getMe();
        setProfile(profileResponse.data);
        queryClient.setQueryData(QUERY_KEYS.ME, profileResponse);
        const destination = resolvePostLoginPath({
          requestedLocation: location.state?.from,
          permissions: profileResponse.data.permissions,
          routes: routeRegistry,
        });
        message.success(msg);
        navigate(destination, { replace: true });
      } catch (error) {
        clearSession();
        message.error(error.message || 'Không thể tải quyền tài khoản');
      }
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
        label="Email hoặc số điện thoại"
        rules={[{ required: true, message: 'Nhập email hoặc số điện thoại' }]}
      >
        <Input prefix={<UserOutlined />} placeholder="email@example.com hoặc 0901234567" />
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
