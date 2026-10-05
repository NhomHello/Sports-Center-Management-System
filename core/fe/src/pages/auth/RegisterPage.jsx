import { useMutation } from '@tanstack/react-query';
import { App, Form } from 'antd';
import { useNavigate } from 'react-router';
import { ROUTES } from '@/constants';
import * as authService from '@/services/auth.service';
import { normalizeRegistrationPayload } from '@/utils/account';
import { RegisterForm } from './RegisterForm';

/** Tạo tài khoản hội viên; role mặc định do API gán. */
export function RegisterPage() {
  const { message } = App.useApp();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const mutation = useMutation({
    mutationFn: (values) => authService.register(normalizeRegistrationPayload(values)),
    onSuccess: ({ message: resultMessage }) => {
      message.success(resultMessage || 'Đăng ký thành công');
      navigate(ROUTES.LOGIN, { replace: true });
    },
    onError: (error) => {
      form.setFields(error.toFormFields());
      message.error(error.message);
    },
  });

  return <RegisterForm form={form} mutation={mutation} />;
}
