import { PERMISSIONS as P } from '@scms/shared';
import { Button, Card, Dropdown, App, Tag } from 'antd';
import { CLASS_STATUS, ENROLLMENT_STATUS } from '@/constants/schedule';
import { CLASS_DISPLAY_STATUS, classDisplayStatus } from '@/utils/schedule';
import { ClassCardSummary, ClassSeatSummary } from './ClassCardSummary';

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
      <Button type="text" aria-label="Thao tác quản lý lớp" loading={loading}>
        ⋯
      </Button>
    </Dropdown>
  );
}

function ClassIdentity({ item }) {
  const booked = item.enrollment?.status === ENROLLMENT_STATUS.BOOKED;
  const display = classDisplayStatus(item);
  return (
    <div className="scms-class-card__identity">
      <div className="scms-class-card__topline">
        <Tag
          className="scms-class-card__subject"
          color="blue"
          variant="filled"
          title={item.subject.name}
        >
          {item.subject.name}
        </Tag>
        {booked ? (
          <Tag color="green" variant="filled">
            Đã đăng ký
          </Tag>
        ) : (
          display !== CLASS_DISPLAY_STATUS.OPEN && (
            <Tag color={display.color} variant="filled">
              {display.label}
            </Tag>
          )
        )}
      </div>
      <h3>{item.name}</h3>
    </div>
  );
}

/** Thẻ lớp gọn: lịch học là thông tin chính, sĩ số và thao tác nằm cùng chân thẻ. */
export function ClassCard({ item, can, onDetail, onEdit, onCancel, loading, renderActions }) {
  const secondaryAction = (
    <Button className="scms-class-card__detail" onClick={onDetail}>
      Chi tiết
    </Button>
  );
  return (
    <Card
      title={<ClassIdentity item={item} />}
      extra={<ClassManageMenu {...{ item, can, onEdit, onCancel, loading }} />}
      className="scms-class-card"
    >
      <ClassCardSummary item={item} />
      <section className="scms-class-card__booking">
        <ClassSeatSummary item={item} />
        {renderActions ? renderActions(item, { compact: true, secondaryAction }) : secondaryAction}
      </section>
    </Card>
  );
}
