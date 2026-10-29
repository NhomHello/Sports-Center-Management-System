import { FacebookFilled, MessageOutlined, PhoneOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { Space, Typography } from 'antd';
import * as authService from '@/services/auth.service';

const SUPPORT_STALE_MS = 5 * 60 * 1000;

/** Kênh liên hệ trung tâm (lấy từ cấu hình) để nhờ nhân viên xác minh email thủ công. */
export function SupportContacts() {
  const { data } = useQuery({
    queryKey: ['support-contacts'],
    queryFn: authService.getSupportContacts,
    staleTime: SUPPORT_STALE_MS,
  });
  const contacts = data?.data;
  if (!contacts) return null;
  const links = [
    contacts.zaloUrl && { href: contacts.zaloUrl, icon: <MessageOutlined />, label: 'Zalo' },
    contacts.facebookUrl && {
      href: contacts.facebookUrl,
      icon: <FacebookFilled />,
      label: 'Facebook',
    },
  ].filter(Boolean);
  return (
    <div className="scms-support-contacts">
      <Typography.Text type="secondary">
        Vẫn chưa được? Liên hệ {contacts.centerName} để lễ tân xác minh giúp bạn:
      </Typography.Text>
      <Space wrap size="middle" style={{ marginTop: 8 }}>
        {links.map(({ href, icon, label }) => (
          <a key={label} href={href} target="_blank" rel="noopener noreferrer">
            {icon} {label}
          </a>
        ))}
        {contacts.phone && (
          <a href={`tel:${contacts.phone.replace(/\s/g, '')}`}>
            <PhoneOutlined /> {contacts.phone}
          </a>
        )}
      </Space>
    </div>
  );
}
