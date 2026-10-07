import { useMutation } from '@tanstack/react-query';
import { Alert, App, Button } from 'antd';
import * as authService from '@/services/auth.service';

/** Nhắc tài khoản có email nhưng chưa xác minh; cho gửi lại link (API tự giới hạn tần suất). */
export function EmailVerificationBanner({ user }) {
  const { message } = App.useApp();
  const resend = useMutation({
    mutationFn: () => authService.requestEmailVerification({ email: user.email }),
    onSuccess: () => message.success('Đã gửi lại email xác minh, vui lòng kiểm tra hộp thư.'),
    onError: (error) => message.error(error.message),
  });

  if (!user?.email || user.emailVerifiedAt) return null;
  return (
    <Alert
      type="warning"
      showIcon
      style={{ marginBottom: 16 }}
      message={`Email ${user.email} chưa được xác minh`}
      description="Mở liên kết trong email chúng tôi đã gửi để xác minh. Chưa nhận được thư?"
      action={
        <Button size="small" loading={resend.isPending} onClick={() => resend.mutate()}>
          Gửi lại email
        </Button>
      }
    />
  );
}
