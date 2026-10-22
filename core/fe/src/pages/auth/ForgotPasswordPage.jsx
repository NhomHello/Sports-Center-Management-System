import { MailOutlined } from '@ant-design/icons';
import { useMutation } from '@tanstack/react-query';
import { Alert, Button, Form, Input, Result } from 'antd';
import { Link } from 'react-router';
import { ROUTES } from '@/constants';
import * as authService from '@/services/auth.service';

/** Nhập email để nhận link đặt lại mật khẩu; kết quả luôn giống nhau dù email có tồn tại hay không. */
export function ForgotPasswordPage() {
  const [form] = Form.useForm();
  const mutation = useMutation({
    mutationFn: authService.requestPasswordReset,
    onError: (error) => form.setFields(error.toFormFields()),
  });

  if (mutation.isSuccess) {
    return (
      <Result
        status="success"
        title="Đã gửi hướng dẫn"
        subTitle="Nếu email này có trong hệ thống, chúng tôi đã gửi liên kết đặt lại mật khẩu. Hãy kiểm tra hộp thư (kể cả thư rác)."
        extra={
          <Link to={ROUTES.LOGIN}>
            <Button type="primary">Về trang đăng nhập</Button>
          </Link>
        }
      />
    );
  }
  return (
    <Form form={form} layout="vertical" onFinish={mutation.mutate}>
      {mutation.isError && !mutation.error.toFormFields().length && (
        <Alert showIcon type="error" title={mutation.error.message} style={{ marginBottom: 16 }} />
      )}
      <Form.Item
        name="email"
        label="Email đã đăng ký"
        rules={[
          { required: true, message: 'Nhập email' },
          { type: 'email', message: 'Email không hợp lệ' },
        ]}
      >
        <Input prefix={<MailOutlined />} autoComplete="email" placeholder="email@example.com" />
      </Form.Item>
      <Form.Item>
        <Button type="primary" htmlType="submit" block loading={mutation.isPending}>
          Gửi liên kết đặt lại mật khẩu
        </Button>
      </Form.Item>
      <Link to={ROUTES.LOGIN}>Quay lại đăng nhập</Link>
    </Form>
  );
}
