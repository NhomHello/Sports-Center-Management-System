import {
  ClockCircleOutlined,
  CustomerServiceOutlined,
  SafetyCertificateOutlined,
  ThunderboltFilled,
} from '@ant-design/icons';
import { Flex, Typography } from 'antd';
import { Outlet, useLocation } from 'react-router';
import { env } from '@/config/env';
import { ROUTES } from '@/constants';

const AUTH_BENEFITS = [
  { icon: <SafetyCertificateOutlined />, label: 'Bảo mật tài khoản' },
  { icon: <ClockCircleOutlined />, label: 'Theo dõi tập luyện' },
  { icon: <CustomerServiceOutlined />, label: 'Hỗ trợ tận tâm' },
];

function AuthBrandPanel() {
  return (
    <aside className="scms-auth-brand">
      <div className="scms-auth-brand__top">
        <span className="scms-brand__mark">
          <ThunderboltFilled />
        </span>
        <span className="scms-auth-brand__name">{env.APP_NAME}</span>
        <span className="scms-auth-brand__caption">GYM & FITNESS MANAGEMENT</span>
      </div>
      <div className="scms-auth-quote">
        <span className="scms-auth-quote__eyebrow">KHỎE MẠNH HƠN MỖI NGÀY</span>
        <Typography.Title level={2}>
          “Vượt qua giới hạn của hôm qua. Bắt đầu hành trình của bạn hôm nay.”
        </Typography.Title>
        <Typography.Text>Không gian tập luyện và quản lý sức khỏe, trong tầm tay.</Typography.Text>
      </div>
      <Flex className="scms-auth-benefits" wrap gap={10}>
        {AUTH_BENEFITS.map(({ icon, label }) => (
          <span className="scms-auth-benefit" key={label}>
            {icon}
            {label}
          </span>
        ))}
      </Flex>
      <span className="scms-auth-brand__copyright">
        © {new Date().getFullYear()} {env.APP_NAME}. Đồng hành cùng bạn trên hành trình khỏe mạnh.
      </span>
    </aside>
  );
}

/** Layout xác thực hai cột theo hệ thống hình ảnh SportHub. */
export function AuthLayout() {
  const { pathname } = useLocation();
  const isRegister = pathname === ROUTES.REGISTER;
  const title = isRegister ? 'Tạo tài khoản mới' : 'Chào mừng trở lại';
  const subtitle = isRegister
    ? 'Đăng ký để bắt đầu trải nghiệm SportHub.'
    : 'Đăng nhập để tiếp tục hành trình tập luyện của bạn.';

  return (
    <div className="scms-auth-shell">
      <AuthBrandPanel />
      <main className="scms-auth-form-panel">
        <section className="scms-auth-form-wrap">
          <div className="scms-auth-mobile-brand">
            <span className="scms-brand__mark">
              <ThunderboltFilled />
            </span>
            <Typography.Text strong>{env.APP_NAME}</Typography.Text>
          </div>
          <Typography.Title className="scms-auth-title" level={2}>
            {title}
          </Typography.Title>
          <Typography.Paragraph className="scms-auth-subtitle">{subtitle}</Typography.Paragraph>
          <Outlet />
          <Typography.Text className="scms-auth-trust">
            <SafetyCertificateOutlined /> Thông tin của bạn được bảo vệ an toàn.
          </Typography.Text>
        </section>
      </main>
    </div>
  );
}
