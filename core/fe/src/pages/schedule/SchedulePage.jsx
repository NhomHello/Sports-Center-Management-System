import { PERMISSIONS as P } from '@scms/shared';
import { Tabs } from 'antd';
import { PageHeader } from '@/components/common/PageHeader';
import { usePermission } from '@/hooks/usePermission';
import { ClassListPanel } from './ClassListPanel';
import { ResourceCatalogPanel } from './ResourceCatalogPanel';
import './schedule.css';

/** Trang Flow 2; thêm tab theo permission thay vì tên role. */
export default function SchedulePage() {
  const { can } = usePermission();
  const items = [{ key: 'open', label: 'Lớp đang mở', children: <ClassListPanel /> }];
  if (can(P.SUBJECT_READ))
    items.push({
      key: 'subjects',
      label: 'Bộ môn',
      children: (
        <ResourceCatalogPanel
          resource="subjects"
          permissions={{
            read: P.SUBJECT_READ,
            create: P.SUBJECT_CREATE,
            update: P.SUBJECT_UPDATE,
            delete: P.SUBJECT_DELETE,
          }}
        />
      ),
    });
  if (can(P.ROOM_READ))
    items.push({
      key: 'rooms',
      label: 'Phòng tập',
      children: (
        <ResourceCatalogPanel
          resource="rooms"
          permissions={{
            read: P.ROOM_READ,
            create: P.ROOM_CREATE,
            update: P.ROOM_UPDATE,
            delete: P.ROOM_DELETE,
          }}
        />
      ),
    });
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
