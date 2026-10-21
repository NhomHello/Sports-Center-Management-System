import { PERMISSIONS as P } from '@scms/shared';
import { useSearchParams } from 'react-router';
import { Select, Tabs } from 'antd';
import { PageHeader } from '@/components/common/PageHeader';
import { usePermission } from '@/hooks/usePermission';
import { ClassListPanel } from './ClassListPanel';
import { ClassBookingActions } from './ClassBookingActions';
import { ClassFilters } from './ClassFilters';
import { ScheduleCalendar } from './ScheduleCalendar';
import { StaffBookingPanel } from './StaffBookingPanel';
import { ResourceCatalogPanel } from './ResourceCatalogPanel';
import { RoomTypePanel } from './RoomTypePanel';
import { OperatingFramePanel } from './OperatingFramePanel';
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
  const tabs = resources
    .filter((r) => can(r.permissions.read))
    .map((r) => ({
      key: r.resource,
      label: r.label,
      children: <ResourceCatalogPanel resource={r.resource} permissions={r.permissions} />,
    }));
  if (can(P.ROOM_READ))
    tabs.push({ key: 'room-types', label: 'Loại phòng', children: <RoomTypePanel /> });
  if (can(P.SETTING_READ, P.CLASS_CREATE))
    tabs.push({ key: 'frames', label: 'Khung giờ', children: <OperatingFramePanel /> });
  return tabs;
}

function buildTabs(can, canAll, onViewSchedule) {
  const canPersonal = (permission) => can(permission) && !can(P.CLASS_READ_ALL);
  const actions = (item) => <ClassBookingActions item={item} />;
  const management = (
    <ClassListPanel
      scope="management"
      renderActions={(item) => <ClassBookingActions item={item} rosterOnly />}
      renderFilters={(table) => <ClassFilters table={table} />}
    />
  );
  const items = [];
  if (can(P.CLASS_READ_ALL))
    items.push({ key: 'manage', label: 'Quản lý lớp', children: management });
  if (canAll(P.CLASS_ENROLL_FOR_MEMBER, P.MEMBER_READ))
    items.push({ key: 'staff', label: 'Đăng ký / hủy hộ', children: <StaffBookingPanel /> });
  if (canPersonal(P.SCHEDULE_VIEW_TEACHING))
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
          renderFilters={(table) => <ClassFilters table={table} hideStatus />}
          onViewSchedule={can(P.SCHEDULE_VIEW_OWN) ? onViewSchedule : undefined}
        />
      ),
    });
  if (canPersonal(P.SCHEDULE_VIEW_OWN))
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
  if (canPersonal(P.SCHEDULE_VIEW_TEACHING))
    items.push({ key: 'assigned', label: 'Lớp phụ trách', children: management });
  items.push(...catalogTabs(can));
  return items;
}

/** Trang Flow 2: tab và thao tác theo permission, không so sánh tên role. */
export default function SchedulePage() {
  const { can, canAll } = usePermission();
  const [params, setParams] = useSearchParams();
  const selected = params.get('tab');
  const setSelected = (tab) =>
    setParams((previous) => {
      const next = new URLSearchParams(previous);
      next.set('tab', tab);
      return next;
    });
  const items = buildTabs(can, canAll, () => setSelected('own'));
  const activeKey = items.find((i) => i.key === selected)?.key || items[0]?.key;
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
