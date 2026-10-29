import { useState } from 'react';
import { Button } from 'antd';
import { PERMISSIONS as P } from '@scms/shared';
import { usePermission } from '@/hooks/usePermission';
import { StudentDetailDrawer } from './StudentDetailDrawer';
/** Nút tái sử dụng trong roster/điểm danh, tên học viên vẫn đọc được nếu không có quyền. */
export function StudentProfileButton({ member }) {
  const { can } = usePermission();
  const [open, setOpen] = useState(false);
  if (!can(P.MEMBER_PROFILE_VIEW_ASSIGNED)) return member.fullName;
  return (
    <>
      <Button type="link" onClick={() => setOpen(true)}>
        {member.fullName}
      </Button>
      {open && <StudentDetailDrawer memberId={member.id} onClose={() => setOpen(false)} />}
    </>
  );
}
