import { PERMISSIONS } from '@scms/shared';
import { PageHeader } from '@/components/common/PageHeader';
import { ClassManagementPanel } from './ClassManagementPanel';
import { OpenClassListPanel } from './OpenClassListPanel';
import { ResourceCatalogPanel } from './ResourceCatalogPanel';
import './schedule.css';

const SECTIONS = {
  open: {
    title: 'Lớp đang mở',
    subtitle: 'Chọn lớp phù hợp và theo dõi lịch theo giờ Việt Nam.',
    content: OpenClassListPanel,
  },
  classes: {
    title: 'Quản lý lớp',
    subtitle: 'Tạo lớp, cập nhật lịch học và quản lý trạng thái lớp.',
    content: ClassManagementPanel,
  },
  subjects: {
    title: 'Bộ môn',
    subtitle: 'Quản lý các bộ môn đang được tổ chức tại trung tâm.',
    content: () => (
      <ResourceCatalogPanel
        resource="subjects"
        permissions={{
          create: PERMISSIONS.SUBJECT_CREATE,
          update: PERMISSIONS.SUBJECT_UPDATE,
          delete: PERMISSIONS.SUBJECT_DELETE,
        }}
      />
    ),
  },
  rooms: {
    title: 'Phòng tập',
    subtitle: 'Quản lý phòng tập và sức chứa phục vụ lịch học.',
    content: () => (
      <ResourceCatalogPanel
        resource="rooms"
        permissions={{
          create: PERMISSIONS.ROOM_CREATE,
          update: PERMISSIONS.ROOM_UPDATE,
          delete: PERMISSIONS.ROOM_DELETE,
        }}
      />
    ),
  },
};

/** Mỗi chức năng lịch tập là một mục riêng trong sidebar. */
export default function SchedulePage({ section }) {
  const current = SECTIONS[section] || SECTIONS.open;
  const Content = current.content;

  return (
    <div className="scms-page-enter scms-schedule">
      <PageHeader title={current.title} subtitle={current.subtitle} />
      <section className="scms-schedule-panel">
        <Content />
      </section>
    </div>
  );
}
