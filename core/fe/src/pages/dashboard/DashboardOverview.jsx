import { ArrowRightOutlined, BellOutlined, CalendarOutlined } from '@ant-design/icons';
import { Button, Card, Skeleton, Typography } from 'antd';
import { Link } from 'react-router';
import { ROUTES } from '@/constants';
import { formatDateTime } from '@/utils/format';

const SCHEDULE_LABELS = Object.freeze({
  own: 'Lịch tập của bạn',
  teaching: 'Lịch dạy của bạn',
  management: 'Lịch trung tâm',
});

function QueryFeedback({ query }) {
  if (query.isPending) return <Skeleton active title={false} paragraph={{ rows: 2 }} />;
  if (!query.isError) return null;
  return (
    <div className="scms-dashboard-query-feedback" role="status">
      <Typography.Text type="secondary">Chưa tải được dữ liệu. Vui lòng thử lại.</Typography.Text>
      <Button size="small" onClick={() => query.refetch()}>
        Thử lại
      </Button>
    </div>
  );
}

function ScheduleOverview({ overview }) {
  const { kind, schedule, upcoming, today } = overview;
  const next = upcoming[0];
  return (
    <Card className="scms-dashboard-overview-card">
      <div className="scms-dashboard-overview-card__heading">
        <span className="scms-dashboard-overview-card__icon">
          <CalendarOutlined />
        </span>
        <Typography.Text strong>{SCHEDULE_LABELS[kind] || 'Khám phá lớp học'}</Typography.Text>
      </div>
      {!kind ? (
        <Typography.Paragraph type="secondary">
          Chọn một khu vực bên dưới để bắt đầu công việc của bạn.
        </Typography.Paragraph>
      ) : (
        <>
          <QueryFeedback query={schedule} />
          {!schedule.isPending && !schedule.isError && (
            <div className="scms-dashboard-schedule-summary">
              <Typography.Text className="scms-dashboard-overview-card__value">
                {upcoming.length} <span>buổi còn lại trong tuần</span>
              </Typography.Text>
              {next ? (
                <>
                  <Typography.Text strong>{next.className}</Typography.Text>
                  <Typography.Text type="secondary">
                    {new Date(next.startAt) <= today.toDate() ? 'Đang diễn ra' : 'Sắp diễn ra'}
                    {' · '}
                    {formatDateTime(next.startAt)} · {next.room}
                  </Typography.Text>
                </>
              ) : (
                <Typography.Text type="secondary">
                  Chưa có buổi học còn lại trong tuần này.
                </Typography.Text>
              )}
            </div>
          )}
          <Link className="scms-dashboard-overview-card__link" to={ROUTES.SCHEDULE}>
            Mở lớp học và lịch tập <ArrowRightOutlined />
          </Link>
        </>
      )}
    </Card>
  );
}

function NotificationOverview({ query }) {
  const unreadCount = query.data?.meta?.unreadCount;
  return (
    <Card className="scms-dashboard-overview-card">
      <div className="scms-dashboard-overview-card__heading">
        <span className="scms-dashboard-overview-card__icon">
          <BellOutlined />
        </span>
        <Typography.Text strong>Thông báo cần đọc</Typography.Text>
      </div>
      <QueryFeedback query={query} />
      {!query.isPending && !query.isError && (
        <>
          <Typography.Text className="scms-dashboard-overview-card__value">
            {unreadCount ?? '—'} <span>thông báo chưa đọc</span>
          </Typography.Text>
          <Typography.Paragraph type="secondary">
            {unreadCount === 0
              ? 'Bạn đã đọc hết các thông báo.'
              : 'Theo dõi thay đổi lớp học và cập nhật của tài khoản.'}
          </Typography.Paragraph>
        </>
      )}
      <Link className="scms-dashboard-overview-card__link" to={ROUTES.NOTIFICATIONS}>
        Xem thông báo <ArrowRightOutlined />
      </Link>
    </Card>
  );
}

/** Tóm tắt lịch tuần và số thông báo do API trả; không thay lỗi/loading bằng số 0. */
export function DashboardOverview({ overview }) {
  return (
    <div className="scms-dashboard-overview">
      <ScheduleOverview overview={overview} />
      <NotificationOverview query={overview.notifications} />
    </div>
  );
}
