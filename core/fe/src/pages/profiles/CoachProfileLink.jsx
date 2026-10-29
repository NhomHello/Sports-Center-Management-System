import { PERMISSIONS as P } from '@scms/shared';
import { Link } from 'react-router';
import { usePermission } from '@/hooks/usePermission';
import { ROUTES } from '@/constants';
/** Tên HLV dẫn sang hồ sơ công khai nếu tài khoản có quyền xem. */
export function CoachProfileLink({ coach }) {
  const { can } = usePermission();
  return can(P.COACH_PROFILE_READ) ? (
    <Link to={ROUTES.COACH_DETAIL.replace(':id', coach.id)}>{coach.fullName}</Link>
  ) : (
    coach.fullName
  );
}
