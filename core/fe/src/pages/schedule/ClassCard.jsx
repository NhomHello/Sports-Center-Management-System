import { PERMISSIONS as P } from '@scms/shared';
import {
  CalendarOutlined,
  ClockCircleOutlined,
  EnvironmentOutlined,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { Button, Card, Dropdown, App, Tag } from 'antd';
import { CLASS_STATUS, ENROLLMENT_STATUS } from '@/constants/schedule';
import { formatDate, formatDateTime } from '@/utils/format';
import { classDisplayStatus, describeWeeklySchedule } from '@/utils/schedule';

function ClassManageMenu({ item, can, onEdit, onCancel, loading }) {
  const { modal } = App.useApp();
  if (item.status === CLASS_STATUS.CANCELLED) return null;
  const items = [
    can(P.CLASS_UPDATE) && { key: 'edit', label: 'Sửa lớp', onClick: onEdit },
    can(P.CLASS_DELETE) && {
      key: 'cancel',
      label: 'Hủy lớp',
      danger: true,
      onClick: () =>
        modal.confirm({
          title: 'Hủy toàn bộ lớp và thông báo hội viên?',
          okText: 'Hủy lớp',
          cancelText: 'Giữ lớp',
          onOk: onCancel,
        }),
    },
  ].filter(Boolean);
  if (!items.length) return null;
  return (
    <Dropdown menu={{ items }} trigger={['click']}>
      <Button aria-label="Thao tác quản lý lớp" loading={loading}>
        ⋯
      </Button>
    </Dropdown>
  );
}

/** Card dùng chung cho danh sách lớp mở và phạm vi quản lý. */
const WAITLIST_OFFERED = 'OFFERED';

function SeatSummary({ item }) {
  const booked = item.capacity - item.seatsRemaining;
  if (item.waitlist?.status === WAITLIST_OFFERED)
    return <strong>Đang giữ chỗ cho bạn · bấm Đăng ký lớp để xác nhận</strong>;
  if (item.seatsRemaining <= 0)
    return (
      <strong className="scms-class-full">
        Đã đủ chỗ ({booked}/{item.capacity})
      </strong>
    );
  return (
    <strong>
      Còn {item.seatsRemaining} chỗ trống
      <span className="scms-class-card__seat-total">
        {' '}
        · đã đăng ký {booked}/{item.capacity}
      </span>
    </strong>
  );
}

export function ClassCard({ item, can, onDetail, onEdit, onCancel, loading, children }) {
  const display = classDisplayStatus(item);
  return (
    <Card title={item.name} className="scms-class-card">
      <div className="scms-class-card__body">
        <div className="scms-class-card__tags">
          <Tag color={display.color}>{display.label}</Tag>
          {item.enrollment?.status === ENROLLMENT_STATUS.BOOKED && (
            <Tag color="green">Đã đăng ký</Tag>
          )}
          <Tag>{item.subject.name}</Tag>
        </div>
        <div className="scms-class-card__meta scms-class-card__schedule">
          <CalendarOutlined />
          <span>
            {describeWeeklySchedule(item.weeklySchedule).map((line) => (
              <span key={line} className="scms-class-card__slot">
                {line}
              </span>
            ))}
            <span className="scms-class-card__range">
              {formatDate(item.startsOn)} – {formatDate(item.endsOn)}
            </span>
          </span>
        </div>
        <div className="scms-class-card__meta">
          <EnvironmentOutlined />
          <span>{item.room.name}</span>
        </div>
        <div className="scms-class-card__meta">
          <UserOutlined />
          <span>HLV: {item.coach.fullName}</span>
        </div>
        <div className="scms-class-card__availability">
          <TeamOutlined />
          <SeatSummary item={item} />
        </div>
        <div className="scms-class-card__deadline">
          <ClockCircleOutlined />
          <span>
            Hạn đăng ký: {formatDateTime(item.registrationEndAt)}
            {(item.cancellationExceptionUntil || item.cancelDeadline) && (
              <>
                <br />
                Hạn hủy buổi gần nhất:{' '}
                {formatDateTime(item.cancellationExceptionUntil || item.cancelDeadline)}
              </>
            )}
          </span>
        </div>
        <div className="scms-class-card__actions">
          {children && <div className="scms-class-card__booking">{children}</div>}
          <Button onClick={onDetail}>Chi tiết</Button>
          <ClassManageMenu {...{ item, can, onEdit, onCancel, loading }} />
        </div>
      </div>
    </Card>
  );
}
