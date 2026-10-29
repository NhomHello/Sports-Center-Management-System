import { useMutation } from '@tanstack/react-query';
import { Button, Form, Input, Result, Spin } from 'antd';
import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { EmailNotVerifiedNotice } from '@/components/auth/EmailNotVerifiedNotice';
import { ROUTES } from '@/constants';
import * as authService from '@/services/auth.service';

function VerifySuccess({ emailChanged }) {
  return (
    <Result
      status="success"
      title={emailChanged ? 'Đã xác nhận email mới' : 'Xác minh email thành công'}
      subTitle={emailChanged ? 'Từ giờ hãy dùng email mới để đăng nhập.' : undefined}
      extra={
        <Link to={ROUTES.LOGIN}>
          <Button type="primary">Đăng nhập</Button>
        </Link>
      }
    />
  );
}

/** Đích của link trong email: tự xác nhận token một lần khi mở trang. */
export function VerifyEmailPage() {
  const [email, setEmail] = useState(null);
  const [params] = useSearchParams();
  const token = params.get('token');
  const confirm = useMutation({ mutationFn: authService.confirmEmailVerification });
  // StrictMode chạy effect hai lần; token dùng một lần nên chỉ được gọi một lần.
  const requested = useRef(false);

  useEffect(() => {
    if (!token || requested.current) return;
    requested.current = true;
    confirm.mutate({ token });
  }, [token, confirm]);

  if (token && !confirm.isSuccess && !confirm.isError) return <Spin size="large" />;
  if (confirm.isSuccess) return <VerifySuccess emailChanged={confirm.data?.data?.emailChanged} />;
  return (
    <Result
      status="error"
      title="Liên kết không hợp lệ hoặc đã hết hạn"
      subTitle="Hãy yêu cầu gửi lại email xác minh ở trang đăng nhập, hoặc liên hệ trung tâm để được hỗ trợ."
      extra={
        <>
          <Form onFinish={(values) => setEmail(values.email)} layout="vertical">
            <Form.Item
              name="email"
              label="Email cần xác minh"
              rules={[{ required: true, type: 'email' }]}
            >
              <Input />
            </Form.Item>
            <Button htmlType="submit">Gửi lại liên kết</Button>
          </Form>
          {email && (
            <EmailNotVerifiedNotice
              email={email}
              title="Gửi lại email xác minh"
              description="Kiểm tra địa chỉ rồi bấm gửi lại."
            />
          )}
          <Link to={ROUTES.LOGIN}>
            <Button>Về trang đăng nhập</Button>
          </Link>
        </>
      }
    />
  );
}
