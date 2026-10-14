import { useMutation } from '@tanstack/react-query';
import { App, Alert, Button, Card, Form, Input, Typography } from 'antd';
import { useNavigate } from 'react-router';
import { ROUTES, VALIDATION } from '@/constants';
import { useAuth } from '@/hooks/useAuth';
import * as authService from '@/services/auth.service';
import { getApiOperationErrorMessage } from '@/utils/apiAvailability';

/** Biểu mẫu đổi mật khẩu của tài khoản đang đăng nhập. */
export function ChangePasswordForm() {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const mutation = useMutation({
    mutationFn: ({ confirmPassword: _confirm, ...payload }) => authService.changePassword(payload),
    onSuccess: ({ data, message: resultMessage }) => {
      message.success(resultMessage || 'Đổi mật khẩu thành công');
      form.resetFields();
      if (data?.requiresLogin) {
        logout();
        navigate(ROUTES.LOGIN, { replace: true });
      }
    },
    onError: (error) => {
      form.setFields(error.toFormFields());
      message.error(getApiOperationErrorMessage(error, 'đổi mật khẩu'));
    },
  });

  return (
    <Card id="change-password" title="Đổi mật khẩu">
      <Typography.Paragraph type="secondary">
        Sau khi đổi mật khẩu thành công, các phiên đăng nhập cũ sẽ hết hiệu lực. Bạn cần đăng nhập
        lại bằng mật khẩu mới.
      </Typography.Paragraph>
      {mutation.isError && (
        <Alert
          showIcon
          type="error"
          message={getApiOperationErrorMessage(mutation.error, 'đổi mật khẩu')}
        />
      )}
      <Form form={form} layout="vertical" onFinish={mutation.mutate} disabled={mutation.isPending}>
        <Form.Item
          name="currentPassword"
          label="Mật khẩu hiện tại"
          rules={[{ required: true, message: 'Nhập mật khẩu hiện tại' }]}
        >
          <Input.Password autoComplete="current-password" />
        </Form.Item>
        <Form.Item
          name="password"
          label="Mật khẩu mới"
          rules={[
            {
              required: true,
              min: VALIDATION.PASSWORD_MIN_LENGTH,
              message: `Mật khẩu tối thiểu ${VALIDATION.PASSWORD_MIN_LENGTH} ký tự`,
            },
            { max: VALIDATION.PASSWORD_MAX_LENGTH, message: 'Mật khẩu vượt quá độ dài cho phép' },
          ]}
        >
          <Input.Password autoComplete="new-password" />
        </Form.Item>
        <Form.Item
          name="confirmPassword"
          label="Nhập lại mật khẩu mới"
          dependencies={['password']}
          rules={[
            { required: true, message: 'Nhập lại mật khẩu mới' },
            ({ getFieldValue }) => ({
              validator: (_rule, value) =>
                !value || getFieldValue('password') === value
                  ? Promise.resolve()
                  : Promise.reject(new Error('Mật khẩu không khớp')),
            }),
          ]}
        >
          <Input.Password autoComplete="new-password" />
        </Form.Item>
        <Button type="primary" htmlType="submit" loading={mutation.isPending}>
          Cập nhật mật khẩu
        </Button>
      </Form>
    </Card>
  );
}
