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
import '@/styles/authExperience.css';

const AUTH_BENEFITS = [
  { icon: <SafetyCertificateOutlined />, label: 'Bảo mật tài khoản' },
  { icon: <ClockCircleOutlined />, label: 'Theo dõi lịch tập' },
  { icon: <CustomerServiceOutlined />, label: 'Kết nối trung tâm' },
];

function AuthBrandPanel() {
  return (
    <aside className="scms-auth-brand">
      <div className="scms-auth-brand__top">
        <span className="scms-brand__mark">
          <ThunderboltFilled />
        </span>
        <span className="scms-auth-brand__name">{env.APP_NAME}</span>
        <span className="scms-auth-brand__caption">LỚP HỌC · LỊCH TẬP · KẾT NỐI</span>
      </div>
      <div className="scms-auth-quote">
        <span className="scms-auth-quote__eyebrow">KHỎE MẠNH HƠN MỖI NGÀY</span>
        <Typography.Title level={2}>Một lịch tập rõ ràng. Một khởi đầu khỏe mạnh.</Typography.Title>
        <Typography.Text>
          Chọn lớp phù hợp, theo dõi lịch và nhận cập nhật từ trung tâm trong một nơi.
        </Typography.Text>
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

/** Layout xác thực hai cột dùng chung nhận diện Sports Center. */
export function AuthLayout() {
  const { pathname } = useLocation();
  const isRegister = pathname === ROUTES.REGISTER;
  const title = isRegister ? 'Tạo tài khoản mới' : 'Chào mừng trở lại';
  const subtitle = isRegister
    ? 'Tạo tài khoản để khám phá lớp học và theo dõi lịch tập tại Sports Center.'
    : 'Đăng nhập để xem lớp học, lịch tập và cập nhật mới nhất.';

  return (
    <div className="scms-auth-shell scms-auth-experience">
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
