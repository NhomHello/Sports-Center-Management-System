import {
  BellOutlined,
  ClockCircleOutlined,
  SafetyCertificateOutlined,
  ThunderboltFilled,
} from '@ant-design/icons';
import { Typography } from 'antd';
import { Outlet, useLocation } from 'react-router';
import { env } from '@/config/env';
import { ROUTES } from '@/constants';
import '@/styles/authExperience.css';

const AUTH_BENEFITS = [
  {
    icon: <ClockCircleOutlined />,
    label: 'Lịch tập trong tầm tay',
    description: 'Xem lớp học và lịch tập của bạn theo ngày, tuần.',
  },
  {
    icon: <BellOutlined />,
    label: 'Luôn cập nhật',
    description: 'Theo dõi thông báo và những thay đổi từ trung tâm.',
  },
  {
    icon: <SafetyCertificateOutlined />,
    label: 'Tài khoản cá nhân',
    description: 'Quản lý hồ sơ và thông tin tài khoản tại một nơi.',
  },
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
      <div className="scms-auth-brand__content">
        <div className="scms-auth-quote">
          <span className="scms-auth-quote__eyebrow">KHỎE MẠNH HƠN MỖI NGÀY</span>
          <Typography.Title level={2}>
            <span>Một lịch tập rõ ràng.</span>
            <span>Một khởi đầu khỏe mạnh.</span>
          </Typography.Title>
          <Typography.Text>
            Chọn lớp phù hợp, theo dõi lịch và nhận cập nhật từ trung tâm trong một nơi.
          </Typography.Text>
        </div>
        <div className="scms-auth-benefits">
          {AUTH_BENEFITS.map(({ icon, label, description }) => (
            <div className="scms-auth-benefit" key={label}>
              <span className="scms-auth-benefit__icon" aria-hidden="true">
                {icon}
              </span>
              <div>
                <strong>{label}</strong>
                <span>{description}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
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
    <div
      className={`scms-auth-shell scms-auth-experience${isRegister ? ' scms-auth-experience--register' : ''}`}
    >
      <AuthBrandPanel />
      <main className="scms-auth-form-panel">
        <section className="scms-auth-form-wrap">
          <div className="scms-auth-mobile-brand">
            <span className="scms-brand__mark">
              <ThunderboltFilled />
            </span>
            <Typography.Text strong>{env.APP_NAME}</Typography.Text>
          </div>
          <span className="scms-auth-form-eyebrow">
            {isRegister ? 'THAM GIA SPORTS CENTER' : 'TÀI KHOẢN SPORTS CENTER'}
          </span>
          <Typography.Title className="scms-auth-title" level={1}>
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
