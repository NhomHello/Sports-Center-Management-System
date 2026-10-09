import { PERMISSIONS } from '@scms/shared';
import { Tabs } from 'antd';
import { PageHeader } from '@/components/common/PageHeader';
import { usePermission } from '@/hooks/usePermission';
import { ClassManagementPanel } from './ClassManagementPanel';
import { OpenClassListPanel } from './OpenClassListPanel';
import { ResourceCatalogPanel } from './ResourceCatalogPanel';
import './schedule.css';

/** Trang quản lý danh mục bộ môn và phòng tập của Flow 2. */
export default function SchedulePage() {
  const { can } = usePermission();
  const items = [];

  if (can(PERMISSIONS.CLASS_READ)) {
    items.push({ key: 'open', label: 'Lớp đang mở', children: <OpenClassListPanel /> });
  }
  if (can(PERMISSIONS.CLASS_CREATE, PERMISSIONS.CLASS_UPDATE, PERMISSIONS.CLASS_DELETE)) {
    items.push({ key: 'classes', label: 'Quản lý lớp', children: <ClassManagementPanel /> });
  }
  if (can(PERMISSIONS.SUBJECT_READ)) {
    items.push({
      key: 'subjects',
      label: 'Bộ môn',
      children: (
        <ResourceCatalogPanel
          resource="subjects"
          permissions={{
            create: PERMISSIONS.SUBJECT_CREATE,
            update: PERMISSIONS.SUBJECT_UPDATE,
            delete: PERMISSIONS.SUBJECT_DELETE,
          }}
        />
      ),
    });
  }
  if (can(PERMISSIONS.ROOM_READ)) {
    items.push({
      key: 'rooms',
      label: 'Phòng tập',
      children: (
        <ResourceCatalogPanel
          resource="rooms"
          permissions={{
            create: PERMISSIONS.ROOM_CREATE,
            update: PERMISSIONS.ROOM_UPDATE,
            delete: PERMISSIONS.ROOM_DELETE,
          }}
        />
      ),
    });
  }

  return (
    <div className="scms-page-enter scms-schedule">
      <PageHeader
        title="Lớp học và lịch tập"
        subtitle="Chọn lớp phù hợp và theo dõi lịch theo giờ Việt Nam."
      />
      <Tabs items={items} destroyOnHidden />
    </div>
  );
}
