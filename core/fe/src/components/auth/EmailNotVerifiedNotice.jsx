import { MailOutlined } from '@ant-design/icons';
import { useMutation } from '@tanstack/react-query';
import { Alert, App, Button, Space } from 'antd';
import * as authService from '@/services/auth.service';
import { SupportContacts } from './SupportContacts';

/** Hướng dẫn khi tài khoản chưa xác minh email: gửi lại link hoặc nhờ trung tâm xác minh hộ. */
export function EmailNotVerifiedNotice({ email, title, description }) {
  const { message } = App.useApp();
  const resend = useMutation({
    mutationFn: () => authService.requestEmailVerification({ email }),
    onSuccess: () => message.success('Đã gửi lại email xác minh, vui lòng kiểm tra hộp thư.'),
    onError: (error) => message.error(error.message),
  });
  return (
    <Alert
      showIcon
      type="warning"
      icon={<MailOutlined />}
      className="scms-email-unverified"
      style={{ marginBottom: 16 }}
      title={title}
      description={
        <Space orientation="vertical" size="small">
          <span>{description}</span>
          <Button size="small" loading={resend.isPending} onClick={() => resend.mutate()}>
            Gửi lại email xác minh
          </Button>
          <SupportContacts />
        </Space>
      }
    />
  );
}
