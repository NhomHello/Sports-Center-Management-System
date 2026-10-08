import { ArrowRightOutlined } from '@ant-design/icons';
import { Card, Typography } from 'antd';
import { Link } from 'react-router';
import { useAuth } from '@/hooks/useAuth';
import { usePermission } from '@/hooks/usePermission';
import { routeRegistry } from '@/router/routeRegistry';
import { DashboardHero } from './DashboardHero';
import { DashboardOverview } from './DashboardOverview';
import { buildDashboardShortcuts } from './dashboardData';
import { useDashboardOverview } from './useDashboardOverview';
import '@/styles/dashboardExperience.css';

/** Tổng quan công việc và lịch thực tế theo quyền của tài khoản đang đăng nhập. */
export default function DashboardPage() {
  const { user } = useAuth();
  const { can } = usePermission();
  const shortcuts = buildDashboardShortcuts(routeRegistry, can);
  const overview = useDashboardOverview(can);

  return (
    <div className="scms-dashboard-experience">
      <DashboardHero user={user} primary={shortcuts[0]} today={overview.today} />
      <DashboardOverview overview={overview} />
      <div className="scms-section-heading">
        <span>
          <Typography.Title level={3}>Truy cập nhanh</Typography.Title>
          <Typography.Text type="secondary">
            Chọn công việc bạn muốn tiếp tục hôm nay.
          </Typography.Text>
        </span>
      </div>
      <div className="scms-dashboard-shortcuts">
        {shortcuts.map((item) => (
          <Card key={item.path} className="scms-shortcut-card">
            <Link className="scms-shortcut-card__link" to={item.path}>
              <span className="scms-shortcut-card__icon">{item.icon}</span>
              <span className="scms-shortcut-card__copy">
                <Typography.Text className="scms-shortcut-card__title">
                  {item.title}
                </Typography.Text>
                <Typography.Text className="scms-shortcut-card__description">
                  {item.description}
                </Typography.Text>
              </span>
              <ArrowRightOutlined className="scms-shortcut-card__arrow" />
            </Link>
          </Card>
        ))}
      </div>
    </div>
  );
}
