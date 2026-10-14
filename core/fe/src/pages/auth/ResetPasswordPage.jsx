import { LockOutlined } from '@ant-design/icons';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Alert, Button, Form, Input, Result, Spin } from 'antd';
import { Link, useSearchParams } from 'react-router';
import { ERROR_CODES } from '@scms/shared';
import { ROUTES, VALIDATION } from '@/constants';
import * as authService from '@/services/auth.service';

const PASSWORD_RULES = [
  {
    required: true,
    min: VALIDATION.PASSWORD_MIN_LENGTH,
    message: `Mật khẩu tối thiểu ${VALIDATION.PASSWORD_MIN_LENGTH} ký tự`,
  },
  { max: VALIDATION.PASSWORD_MAX_LENGTH, message: 'Mật khẩu vượt quá độ dài cho phép' },
];

const confirmRule = ({ getFieldValue }) => ({
  validator: (_rule, value) =>
    !value || getFieldValue('password') === value
      ? Promise.resolve()
      : Promise.reject(new Error('Mật khẩu không khớp')),
});

/** Đích của link trong email quên mật khẩu: đặt mật khẩu mới bằng token dùng một lần. */
const isInvalidLink = (error) =>
  [ERROR_CODES.VALIDATION_ERROR, ERROR_CODES.VERIFICATION_TOKEN_INVALID].includes(error?.code);

export function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get('token');
  const [form] = Form.useForm();
  const validation = useQuery({
    queryKey: ['reset-link', token],
    queryFn: () => authService.validatePasswordReset(token),
    enabled: Boolean(token),
    retry: false,
  });
  const mutation = useMutation({
    mutationFn: ({ password }) => authService.confirmPasswordReset({ token, password }),
    onError: (error) => form.setFields(error.toFormFields()),
  });

  if (mutation.isSuccess)
    return (
      <Result
        status="success"
        title="Đã đặt lại mật khẩu"
        subTitle="Mọi phiên đăng nhập cũ đã bị đăng xuất. Hãy đăng nhập bằng mật khẩu mới."
        extra={
          <Link to={ROUTES.LOGIN}>
            <Button type="primary">Đăng nhập</Button>
          </Link>
        }
      />
    );
  const tokenRejected = mutation.error?.code === ERROR_CODES.VERIFICATION_TOKEN_INVALID;
  if (token && validation.isPending) return <Spin />;
  if (validation.isError && !isInvalidLink(validation.error))
    return (
      <Alert
        type="error"
        title={validation.error.message}
        action={<Button onClick={() => validation.refetch()}>Thử lại</Button>}
      />
    );
  if ([!token, tokenRejected, validation.isError].some(Boolean)) {
    return (
      <Result
        status="error"
        title="Liên kết không hợp lệ hoặc đã hết hạn"
        subTitle="Hãy yêu cầu một liên kết đặt lại mật khẩu mới."
        extra={
          <Link to={ROUTES.FORGOT_PASSWORD}>
            <Button type="primary">Quên mật khẩu</Button>
          </Link>
        }
      />
    );
  }
  return (
    <Form form={form} layout="vertical" onFinish={mutation.mutate}>
      {mutation.isError && !mutation.error.toFormFields().length && (
        <Alert
          showIcon
          type="error"
          message={mutation.error.message}
          style={{ marginBottom: 16 }}
        />
      )}
      <Form.Item name="password" label="Mật khẩu mới" rules={PASSWORD_RULES}>
        <Input.Password prefix={<LockOutlined />} autoComplete="new-password" />
      </Form.Item>
      <Form.Item
        name="confirmPassword"
        label="Nhập lại mật khẩu mới"
        dependencies={['password']}
        rules={[{ required: true, message: 'Nhập lại mật khẩu' }, confirmRule]}
      >
        <Input.Password prefix={<LockOutlined />} autoComplete="new-password" />
      </Form.Item>
      <Form.Item>
        <Button type="primary" htmlType="submit" block loading={mutation.isPending}>
          Đặt mật khẩu mới
        </Button>
      </Form.Item>
    </Form>
  );
}
