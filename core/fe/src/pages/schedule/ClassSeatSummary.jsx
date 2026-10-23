import { TeamOutlined } from '@ant-design/icons';
import { WAITLIST_STATUS } from '@/constants/schedule';
import { classCapacity } from '@/utils/classCapacity';

/** Số đang giữ chỗ được trình bày riêng, không bị nhầm với chỗ đã đăng ký. */
export function ClassSeatSummary({ item }) {
  const data = classCapacity(item);
  if (!data) return <p className="scms-booking-note">Chưa có dữ liệu sĩ số</p>;
  const offered = item.waitlist?.status === WAITLIST_STATUS.OFFERED;
  return (
    <div className="scms-class-card__capacity">
      <div className="scms-class-card__capacity-line">
        <span>
          <TeamOutlined aria-hidden />{' '}
          {offered
            ? 'Đang giữ chỗ cho bạn'
            : data.seatsRemaining
              ? `Còn ${data.seatsRemaining} chỗ`
              : 'Hiện hết chỗ'}
        </span>
        <span className="scms-class-card__capacity-count">{data.capacity} chỗ</span>
      </div>
      <div className="scms-class-card__capacity-track" aria-hidden="true">
        <span style={{ width: `${data.bookedPercent}%` }} />
        <span className="scms-class-card__held" style={{ width: `${data.heldPercent}%` }} />
      </div>
      <div className="scms-class-card__capacity-legend">
        <span>
          <i aria-hidden />
          {data.enrolledCount} đã đăng ký
        </span>
        {data.heldSeats > 0 && (
          <span>
            <i className="scms-class-card__held" aria-hidden />
            {data.heldSeats} đang giữ chỗ
          </span>
        )}
      </div>
    </div>
  );
}
