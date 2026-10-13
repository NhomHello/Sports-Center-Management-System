import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { App, Button, Form, Result } from 'antd';
import { Link } from 'react-router';
import { ROUTES } from '@/constants';
import * as authService from '@/services/auth.service';
import { normalizeRegistrationPayload } from '@/utils/account';
import { EmailNotVerifiedNotice } from '@/components/auth/EmailNotVerifiedNotice';
import { RegisterForm } from './RegisterForm';

/** Tạo tài khoản hội viên; role mặc định do API gán. */
export function RegisterPage() {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [registeredEmail, setRegisteredEmail] = useState(null);
  const mutation = useMutation({
    mutationFn: (values) => authService.register(normalizeRegistrationPayload(values)),
    onSuccess: ({ data }) => {
      // Phải xác minh email mới đăng nhập được nên giữ người dùng ở màn hướng dẫn, không đẩy về login.
      setRegisteredEmail(data.email);
    },
    onError: (error) => {
      form.setFields(error.toFormFields());
      message.error(error.message);
    },
  });

  if (registeredEmail) {
    return (
      <Result
        status="success"
        title="Đăng ký thành công. Hãy kiểm tra email"
        subTitle={`Chúng tôi đã gửi liên kết xác minh tới ${registeredEmail}. Bạn cần xác minh email trước khi đăng nhập.`}
        extra={[
          <Link key="login" to={ROUTES.LOGIN}>
            <Button type="primary">Đến trang đăng nhập</Button>
          </Link>,
        ]}
      >
        <EmailNotVerifiedNotice
          email={registeredEmail}
          title="Chưa nhận được email?"
          description="Kiểm tra thư rác hoặc gửi lại liên kết bên dưới."
        />
      </Result>
    );
  }
  return <RegisterForm form={form} mutation={mutation} />;
}
