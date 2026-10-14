import { useMutation } from '@tanstack/react-query';
import { Button, Result, Spin } from 'antd';
import { useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router';
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
        <Link to={ROUTES.LOGIN}>
          <Button type="primary">Về trang đăng nhập</Button>
        </Link>
      }
    />
  );
}
