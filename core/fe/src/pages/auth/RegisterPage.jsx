import { useMutation } from '@tanstack/react-query';
import { App, Button, Form, Input, Typography } from 'antd';
import { Link, useNavigate } from 'react-router';
import { ROUTES } from '@/constants';
import * as authService from '@/services/auth.service';

const PASSWORD_MIN = 8;

export function RegisterPage() {
  const { message } = App.useApp();
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const registerMutation = useMutation({
    mutationFn: ({ confirmPassword: _confirm, ...payload }) => authService.register(payload),
    onSuccess: ({ message: msg }) => {
      message.success(msg);
      navigate(ROUTES.LOGIN, { replace: true });
    },
    onError: (error) => {
      form.setFields(error.toFormFields());
      message.error(error.message);
    },
  });

  return (
    <Form form={form} layout="vertical" onFinish={registerMutation.mutate}>
      <Form.Item
        name="fullName"
        label="Họ tên"
        rules={[{ required: true, message: 'Nhập họ tên' }]}
      >
        <Input />
      </Form.Item>
      <Form.Item
        name="email"
        label="Email"
        rules={[
          { required: true, message: 'Nhập email' },
          { type: 'email', message: 'Email không hợp lệ' },
        ]}
      >
        <Input />
      </Form.Item>
      <Form.Item name="phone" label="Số điện thoại">
        <Input />
      </Form.Item>
      <Form.Item
        name="password"
        label="Mật khẩu"
        rules={[{ required: true, min: PASSWORD_MIN, message: `Tối thiểu ${PASSWORD_MIN} ký tự` }]}
      >
        <Input.Password />
      </Form.Item>
      <Form.Item
        name="confirmPassword"
        label="Nhập lại mật khẩu"
        dependencies={['password']}
        rules={[
          { required: true, message: 'Nhập lại mật khẩu' },
          ({ getFieldValue }) => ({
            validator: (_rule, value) =>
              !value || getFieldValue('password') === value
                ? Promise.resolve()
                : Promise.reject(new Error('Mật khẩu không khớp')),
          }),
        ]}
      >
        <Input.Password />
      </Form.Item>
      <Form.Item>
        <Button type="primary" htmlType="submit" block loading={registerMutation.isPending}>
          Đăng ký
        </Button>
      </Form.Item>
      <Typography.Paragraph style={{ textAlign: 'center', marginBottom: 0 }}>
        Đã có tài khoản? <Link to={ROUTES.LOGIN}>Đăng nhập</Link>
      </Typography.Paragraph>
    </Form>
  );
}
