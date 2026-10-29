import { CalendarOutlined, EnvironmentOutlined, UserOutlined } from '@ant-design/icons';
import { WEEKDAYS } from '@/constants/schedule';
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
                <strong>{time}</strong>
                <div className="scms-class-card__slot-days">
                  <span className="scms-class-card__schedule-icon">
                    <CalendarOutlined aria-hidden="true" />
                  </span>
                  <span>{compactDays(days)}</span>
                </div>
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
