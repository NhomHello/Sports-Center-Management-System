import { PERMISSIONS as P } from '@scms/shared';
import { Tabs } from 'antd';
import { usePermission } from '@/hooks/usePermission';
import { CoachProfilePanel } from './CoachProfilePanel';
import { MemberTrainingPanel } from './MemberTrainingPanel';
/** Các tab được suy ra từ permission, không kiểm tra tên role. */
export function ProfileExtensions() {
  const { can } = usePermission();
  const items = [
    can(P.COACH_PROFILE_UPDATE_OWN) && {
      key: 'coach-profile',
      label: 'Hồ sơ HLV',
      children: <CoachProfilePanel />,
    },
    can(P.MEMBER_PROFILE_READ_OWN) && {
      key: 'member',
      label: 'Hồ sơ tập luyện',
      children: <MemberTrainingPanel />,
    },
  ].filter(Boolean);
  return items.length ? <Tabs items={items} destroyOnHidden /> : null;
}
