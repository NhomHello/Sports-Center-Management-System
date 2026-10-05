import {
  CreditCardOutlined,
  GiftOutlined,
  SafetyCertificateOutlined,
  SettingOutlined,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { PERMISSIONS } from '@scms/shared';
import { Avatar, Button, Card, Col, Row, Space, Statistic, Typography } from 'antd';
import { Link } from 'react-router';
import { ROUTES } from '@/constants';
import { useAuth } from '@/hooks/useAuth';
import { usePermission } from '@/hooks/usePermission';

const SHORTCUTS = [
  {
    path: ROUTES.MEMBERS,
    permission: PERMISSIONS.MEMBER_READ,
    icon: <TeamOutlined />,
    title: 'Quản lý hội viên',
    description: 'Tra cứu hồ sơ, cập nhật thông tin và đăng ký gói tại quầy.',
  },
  {
    path: ROUTES.MEMBERSHIP_PLANS,
    permission: PERMISSIONS.MEMBERSHIP_PLAN_READ,
    icon: <GiftOutlined />,
    title: 'Gói tập',
    description: 'Xem bảng giá và quản lý danh mục gói đang mở bán.',
  },
  {
    path: ROUTES.PAYMENTS,
    permission: [PERMISSIONS.INVOICE_READ_OWN, PERMISSIONS.INVOICE_READ_ALL],
    icon: <CreditCardOutlined />,
    title: 'Hóa đơn',
    description: 'Theo dõi hóa đơn, thu tiền và xem lịch sử giao dịch.',
  },
  {
    path: ROUTES.SYSTEM_ROLES,
    permission: PERMISSIONS.ROLE_READ,
    icon: <SafetyCertificateOutlined />,
    title: 'Vai trò & quyền',
    description: 'Kiểm soát phạm vi truy cập theo từng nhóm người dùng.',
  },
  {
    path: ROUTES.SYSTEM_SETTINGS,
    permission: PERMISSIONS.SETTING_READ,
    icon: <SettingOutlined />,
    title: 'Cấu hình trung tâm',
    description: 'Cập nhật thông tin vận hành và dữ liệu hiển thị trên hóa đơn.',
  },
];

const getInitials = (name) =>
  name
    ?.trim()
    .split(/\s+/)
    .slice(-2)
    .map((part) => part[0])
    .join('')
    .toUpperCase() || 'SH';

const getPrimaryPath = (shortcuts) =>
  shortcuts.length > 0 ? shortcuts[0].path : ROUTES.PROFILE;

/** Trang chào theo hướng Ant Design Pro, chỉ hiển thị lối tắt đúng quyền hiện có. */
export default function DashboardPage() {
  const { user } = useAuth();
  const { can, permissions } = usePermission();
  const shortcuts = SHORTCUTS.filter((item) => can(item.permission));

  return (
    <>
      <section className="scms-dashboard-hero">
        <div className="scms-dashboard-hero__copy">
          <Typography.Text className="scms-dashboard-hero__eyebrow">
            SPORT HUB · TRUNG TÂM ĐIỀU HÀNH
          </Typography.Text>
          <Typography.Title level={1}>Chào mừng trở lại, {user?.fullName}</Typography.Title>
          <Typography.Paragraph>
            Mọi công cụ của Sprint 1 đã sẵn sàng trong một không gian quản trị rõ ràng, nhất quán
            và đúng phạm vi quyền của bạn.
          </Typography.Paragraph>
          <Space wrap>
            <Link to={getPrimaryPath(shortcuts)}>
              <Button type="primary" size="large">
                Bắt đầu làm việc
              </Button>
            </Link>
            <Link to={ROUTES.PROFILE}>
              <Button ghost size="large">
                Xem hồ sơ
              </Button>
            </Link>
          </Space>
        </div>
        <div className="scms-dashboard-hero__identity">
          <span className="scms-dashboard-hero__orbit" />
          <Avatar className="scms-dashboard-hero__avatar" size={72} icon={<UserOutlined />}>
            {getInitials(user?.fullName)}
          </Avatar>
          <span className="scms-dashboard-hero__identity-label">VAI TRÒ HIỆN TẠI</span>
          <strong>{user?.role?.name ?? 'Người dùng'}</strong>
        </div>
      </section>

      <Row gutter={[20, 20]} className="scms-dashboard-metrics">
        <Col xs={24} md={12}>
          <Card>
            <Statistic title="Vai trò đang sử dụng" value={user?.role?.name ?? '—'} />
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card>
            <Statistic title="Quyền được cấp" value={permissions.length} suffix="quyền" />
          </Card>
        </Col>
      </Row>

      <div className="scms-section-heading">
        <span>
          <Typography.Title level={3}>Truy cập nhanh</Typography.Title>
          <Typography.Text type="secondary">Các khu vực bạn có thể sử dụng ngay</Typography.Text>
        </span>
        <span className="scms-section-heading__count">{shortcuts.length} KHU VỰC</span>
      </div>
      <div className="scms-dashboard-shortcuts">
        {shortcuts.map((item) => (
          <Card key={item.path} className="scms-shortcut-card">
            <Link className="scms-shortcut-card__link" to={item.path}>
              <span className="scms-shortcut-card__icon">{item.icon}</span>
              <span>
                <Typography.Text className="scms-shortcut-card__title">
                  {item.title}
                </Typography.Text>
                <Typography.Text className="scms-shortcut-card__description">
                  {item.description}
                </Typography.Text>
              </span>
            </Link>
          </Card>
        ))}
      </div>
    </>
  );
}
