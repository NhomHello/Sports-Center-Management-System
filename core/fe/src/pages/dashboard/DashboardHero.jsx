import { ArrowRightOutlined, CalendarOutlined } from '@ant-design/icons';
import { Space, Typography } from 'antd';
import { Link } from 'react-router';
import { ROUTES } from '@/constants';

/** Lời chào gọn và hành động chính lấy từ khu vực được phép sử dụng. */
export function DashboardHero({ user, primary, today }) {
  return (
    <section className="scms-dashboard-hero">
      <div className="scms-dashboard-hero__copy">
        <Typography.Text className="scms-dashboard-hero__eyebrow">SPORTS CENTER</Typography.Text>
        <Typography.Title level={1}>Chào mừng trở lại, {user?.fullName || 'bạn'}</Typography.Title>
        <Typography.Paragraph>
          Lớp học, lịch tập và những cập nhật bạn cần — sẵn sàng để tiếp tục ngày hôm nay.
        </Typography.Paragraph>
        <Space wrap>
          <Link
            className="scms-dashboard-action scms-dashboard-action--primary"
            to={primary?.path || ROUTES.PROFILE}
          >
            {primary?.title || 'Xem hồ sơ'} <ArrowRightOutlined aria-hidden="true" />
          </Link>
          {primary?.path !== ROUTES.PROFILE && (
            <Link className="scms-dashboard-action" to={ROUTES.PROFILE}>
              Xem hồ sơ
            </Link>
          )}
        </Space>
      </div>
      <div className="scms-dashboard-date">
        <CalendarOutlined aria-hidden="true" />
        <span>
          <small>HÔM NAY</small>
          <strong>{today.format('DD/MM/YYYY')}</strong>
          <small>Giờ Việt Nam</small>
        </span>
      </div>
    </section>
  );
}
