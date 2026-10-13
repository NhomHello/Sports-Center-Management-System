import { PERMISSIONS as P } from '@scms/shared';
import { useState } from 'react';
import { Select, Tabs } from 'antd';
import { PageHeader } from '@/components/common/PageHeader';
import { usePermission } from '@/hooks/usePermission';
import { ClassListPanel } from './ClassListPanel';
import { ClassBookingActions } from './ClassBookingActions';
import { ClassFilters } from './ClassFilters';
import { ScheduleCalendar } from './ScheduleCalendar';
import { StaffBookingPanel } from './StaffBookingPanel';
import { ResourceCatalogPanel } from './ResourceCatalogPanel';
import './schedule.css';

function catalogTabs(can) {
  const resources = [
    {
      resource: 'subjects',
      label: 'Bộ môn',
      permissions: {
        read: P.SUBJECT_READ,
        create: P.SUBJECT_CREATE,
        update: P.SUBJECT_UPDATE,
        delete: P.SUBJECT_DELETE,
      },
    },
    {
      resource: 'rooms',
      label: 'Phòng tập',
      permissions: {
        read: P.ROOM_READ,
        create: P.ROOM_CREATE,
        update: P.ROOM_UPDATE,
        delete: P.ROOM_DELETE,
      },
    },
  ];
  return resources
    .filter((r) => can(r.permissions.read))
    .map((r) => ({
      key: r.resource,
      label: r.label,
      children: <ResourceCatalogPanel resource={r.resource} permissions={r.permissions} />,
    }));
}

function buildTabs(can, canAll, onViewSchedule) {
  const actions = (item) => <ClassBookingActions item={item} />;
  const management = (
    <ClassListPanel
      scope="management"
      renderActions={actions}
      renderFilters={(table) => <ClassFilters table={table} />}
    />
  );
  const items = [];
  if (can(P.CLASS_READ_ALL))
    items.push({ key: 'manage', label: 'Quản lý lớp', children: management });
  if (canAll(P.CLASS_ENROLL_FOR_MEMBER, P.MEMBER_READ))
    items.push({ key: 'staff', label: 'Đăng ký / huỷ hộ', children: <StaffBookingPanel /> });
  if (can(P.SCHEDULE_VIEW_TEACHING))
    items.push({
      key: 'teaching',
      label: 'Lịch dạy',
      children: <ScheduleCalendar kind="teaching" />,
    });
  if (can(P.CLASS_READ))
    items.push({
      key: 'open',
      label: 'Lớp đang mở',
      children: (
        <ClassListPanel
          renderActions={actions}
          onViewSchedule={can(P.SCHEDULE_VIEW_OWN) ? onViewSchedule : undefined}
        />
      ),
    });
  if (can(P.SCHEDULE_VIEW_OWN))
    items.push({
      key: 'own',
      label: 'Lịch tập của tôi',
      children: <ScheduleCalendar kind="own" />,
    });
  if (can(P.CLASS_READ_ALL))
    items.push({
      key: 'week',
      label: 'Lịch trung tâm',
      children: <ScheduleCalendar kind="management" />,
    });
  if (can(P.SCHEDULE_VIEW_TEACHING) && !can(P.CLASS_READ_ALL))
    items.push({ key: 'assigned', label: 'Lớp phụ trách', children: management });
  items.push(...catalogTabs(can));
  return items;
}

/** Trang Flow 2: tab và thao tác theo permission, không so sánh tên role. */
export default function SchedulePage() {
  const { can, canAll } = usePermission();
  const [selected, setSelected] = useState(null);
  const items = buildTabs(can, canAll, () => setSelected('own'));
  const activeKey = selected || items[0]?.key;
  return (
    <div className="scms-page-enter scms-schedule">
      <PageHeader
        title="Lớp học và lịch tập"
        subtitle="Chọn lớp phù hợp và theo dõi lịch theo giờ Việt Nam."
      />
      <Select
        className="scms-schedule-mobile-nav"
        aria-label="Chọn màn hình lịch"
        virtual={false}
        value={activeKey}
        onChange={setSelected}
        options={items.map(({ key, label }) => ({ value: key, label }))}
      />
      <Tabs activeKey={activeKey} onChange={setSelected} items={items} destroyOnHidden />
    </div>
  );
}
