import { Avatar } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { getCoachAvatar } from '@/services/profile.service';
/** Container ảnh có JWT; chỉ gọi khi hồ sơ báo có ảnh. */
export function CoachAvatar({ id, profile, size = 64 }) {
  const query = useQuery({
    queryKey: ['coach-avatar', id, profile?.avatarUpdatedAt],
    queryFn: () => getCoachAvatar(id),
    enabled: Boolean(profile?.hasAvatar),
    retry: false,
  });
  return <Avatar size={size} src={query.data} icon={<UserOutlined />} />;
}
