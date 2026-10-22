import {
  CalendarOutlined,
  EnvironmentOutlined,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { WEEKDAYS, WAITLIST_STATUS } from '@/constants/schedule';
import { formatDate } from '@/utils/format';
import { describeWeeklySchedule } from '@/utils/schedule';
import { CourseOrderPrice } from './CourseOrderPrice';

const SHORT_DAYS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
const compactDays = (text) =>
  WEEKDAYS.reduce(
    (result, weekday) => result.replaceAll(weekday.label, SHORT_DAYS[weekday.value]),
    text,
  );

/** Giữ lịch học, phòng và người dạy trên các dòng ngắn; lịch đầy đủ có trong tooltip. */
export function ClassCardSummary({ item }) {
  return (
    <div className="scms-class-card__summary">
      <div className="scms-class-card__schedule">
        <div className="scms-class-card__schedule-lines">
          {describeWeeklySchedule(item.weeklySchedule).map((line) => {
            const [days, time] = line.split(' · ');
            return (
              <div className="scms-class-card__slot" key={line} title={line}>
                <div className="scms-class-card__slot-days">
                  <span className="scms-class-card__schedule-icon">
                    <CalendarOutlined aria-hidden="true" />
                  </span>
                  <span>{compactDays(days)}</span>
                </div>
                <strong>{time}</strong>
              </div>
            );
          })}
        </div>
        <span className="scms-class-card__range">
          {formatDate(item.startsOn)} – {formatDate(item.endsOn)}
        </span>
      </div>
      <div className="scms-class-card__details">
        <div className="scms-class-card__meta">
          <EnvironmentOutlined aria-hidden="true" />
          <span title={item.room.name}>{item.room.name}</span>
        </div>
        <div className="scms-class-card__meta">
          <UserOutlined aria-hidden="true" />
          <span title={item.coach.fullName}>{item.coach.fullName}</span>
        </div>
        <CourseOrderPrice item={item} />
      </div>
    </div>
  );
}

/** Thể hiện sĩ số bằng một dòng và thanh tiến độ, tránh lặp hai đoạn mô tả chỗ trống. */
export function ClassSeatSummary({ item }) {
  const offered = item.waitlist?.status === WAITLIST_STATUS.OFFERED;
  const full = item.seatsRemaining <= 0;
  const enrolled = item.enrolledCount ?? Math.max(0, item.capacity - item.seatsRemaining);
  const percent = Math.min(100, Math.max(0, (enrolled / Math.max(1, item.capacity)) * 100));
  return (
    <div
      className={`scms-class-card__capacity${full && !offered ? ' scms-class-card__capacity--full' : ''}`}
    >
      <div className="scms-class-card__capacity-line">
        <span>
          <TeamOutlined aria-hidden="true" />{' '}
          {offered ? 'Đang giữ chỗ' : full ? 'Đã đủ chỗ' : `Còn ${item.seatsRemaining} chỗ`}
        </span>
        <span className="scms-class-card__capacity-count" title="Sĩ số đã đăng ký">
          {enrolled}/{item.capacity}
        </span>
      </div>
      <div className="scms-class-card__capacity-track" aria-hidden="true">
        <span style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
